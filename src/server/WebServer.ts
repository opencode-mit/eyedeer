import assert from 'assert';
import express, { Application, json, NextFunction } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import errorHander from 'errorhandler';
import session from 'express-session';
import flash from 'connect-flash';
const expressMySQLStore = require('express-mysql-session')(session);
import login from 'connect-ensure-login';
import * as clients from '../db/Clients';
import * as users from '../db/Users';
import cors from 'cors';
import * as accessTokens from '../db/AccessTokens';
import * as refreshTokens from '../db/RefreshTokens';
import * as authorizationCodes from '../db/AuthorizationCodes';
import * as approvals from '../db/Approvals';
import * as utils from '../util/Utils';
import HttpStatus, { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';
import { Client, CODE_LENGTH, InfoType, REMEMBER_ME_OPTIONS, TOKEN_LENGTH, User } from '../Common';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import Configure, { issueToken, consumeToken } from '../config/Strategies';

declare module 'express-session' {
    interface SessionData {
        returnTo: string;
    }
}

export class WebServer {
    private readonly app: Application;
    public server: http.Server | undefined;

    public constructor(private readonly port: number) {
        Configure();
        this.app = express();
        this.app.set('view engine', 'ejs');
        this.app.use(cors());
        this.app.use(cookieParser());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(errorHander());
        this.app.use(session({
            secret: utils.getUid(16),
            resave: false,
            saveUninitialized: true,
            cookie: {}
        }));
        this.app.use(flash());
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        const ensureLoggedIn = (req: any, res: any, next: NextFunction) => {
            if (req.isAuthenticated() === true) return next();
            req.session.returnTo = req.url;
            req.flash('info', 'Please sign in first.');
            res.redirect('/login');
        }

        const ensureVerified = (req: any, res: any, next: NextFunction) => {
            if (req.user.verified === true) return next();
            req.session.returnTo = req.url;
            req.flash('info', 'Please verify your email first.');
            res.redirect('/ask/verify');
        }

        const rememberMe = async (req: any, res: any, next: NextFunction) => {
            const token = req.cookies['remember_me'];
            if (token === undefined) return next();
            const user = await consumeToken(token);
            if (user === undefined) {
                res.clearCookie("remember_me");
                return next();
            }
            const newToken = issueToken(user.id);
            res.cookie("remember_me", newToken, REMEMBER_ME_OPTIONS);
            req.logIn(user, function (err: any) {
                next();
            });
        };

        const checkForRememberMe = (req: any, res: any, next: NextFunction) => {
            if (!req.body.remember_me) return next();
            const user = req.user! as User;
            const token = issueToken(user.id);
            res.cookie("remember_me", token, REMEMBER_ME_OPTIONS);
            next();
        };

        const redirect = (goingDirection: string) => {
            return (req: any, res: any, next: NextFunction) => {
                const direction = req.session.returnTo;
                if (direction) {
                    req.session.returnTo = undefined;
                    return res.redirect(direction);
                }
                res.redirect(goingDirection);
            };
        };

        this.app.use(rememberMe);

        this.app.use((req, res, next) => {
            console.log(req.url);
            next();
        });

        this.app.use(express.static('assets'));

        this.app.get("/", (req, res) => {
            res.redirect('/dashboard');
        });

        this.app.get("/login", login.ensureLoggedOut({ redirectTo: '/dashboard' }), (req, res) => {
            res.render('login', { info: req.flash('info'), error: req.flash('error') });
        });

        this.app.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), checkForRememberMe, redirect("/dashboard"));

        this.app.get("/signup", (req, res) => {
            res.render('signup', { info: req.flash('info'), error: req.flash('error') });
        });

        this.app.post("/signup", passport.authenticate('local-signup', { failureRedirect: '/signup', failureFlash: true }), checkForRememberMe, redirect("/dashboard"));

        this.app.get("/forgot", (req, res) => {
            res.render("forgot", { info: req.flash("flash") });
        });

        this.app.post("/forgot", async (req, res) => {
            const { email } = req.body;
            const success = await users.sendReset(email);
            if (success) {
                req.flash("info", "Check your inbox!");
            } else {
                req.flash("info", "An email has been already sent.");
            }
            res.redirect("/login");
        });

        this.app.get("/reset/:token", (req, res) => {
            const { token } = req.params;
            if (token === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing token.");
                return;
            }
            res.render("reset", { token: token, info: req.flash("info") });
        });

        this.app.post("/reset/:token", async (req, res) => {
            const { token } = req.params;
            const { password } = req.body;
            if (token === undefined || password === undefined) {
                res.status(StatusCodes.BAD_REQUEST).send("Token or password is missing.");
                return;
            }
            const success = await users.attemptReset(token, password);
            if (success) {
                req.flash("info", "Success! Please sign in.");
            } else {
                req.flash("info", "Token has expired. Please generate a new one.");
            }
            res.redirect("/login");
        });

        this.app.get("/dashboard", ensureLoggedIn, (req, res) => {
            const user = req.user! as User;
            const approvedApps = user.grants.map((grant) => grant.client);
            res.render('dashboard', { user, clients: approvedApps, info: req.flash('info') });
        });

        this.app.get("/logout", (req, res, next) => {
            res.clearCookie("remember_me");
            req.session.destroy(()=>{});
            req.logout(function (err) {
                if (err) { return next(err); }
                res.redirect('/login');
            });
        });

        this.app.get("/account", ensureLoggedIn, (req, res) => {
            res.send(JSON.stringify(req.user));
        });

        const transactions = new Map<string, { redirect_uri: string, state: string, client: Client, user: User, scope: string }>();

        this.app.get("/dialog/authorize",
            ensureLoggedIn,
            async (req, res, next) => {
                const { redirect_uri, state, client_id, scope } = req.query;
                if (redirect_uri === undefined) {
                    res.status(HttpStatus.BAD_REQUEST).send("Missing Redirect URI");
                    return;
                }
                if (state === undefined) {
                    res.status(HttpStatus.BAD_REQUEST).send("Missing State");
                    return;
                }
                if (client_id === undefined) {
                    res.status(HttpStatus.BAD_REQUEST).send("Missing Client ID");
                    return;
                }
                if (scope === undefined) {
                    res.status(HttpStatus.BAD_REQUEST).send("Missing scope");
                    return;
                }
                const client = await clients.findByClientId(client_id as string);
                if (client === undefined) {
                    res.status(HttpStatus.BAD_REQUEST).send("Wrong Client ID");
                    return;
                }
                if (client.redirect_uri !== redirect_uri) {
                    res.status(HttpStatus.BAD_REQUEST).send("Mismatching Redirect URI");
                    return;
                }
                const user = req.user as User;
                const scopes = new Set((scope as string).split(" "));
                const existingScopes = new Set(await approvals.getScopes(user.email, client.client_id));
                const newScopes = utils.inFirstNotInSecond(scopes, existingScopes);
                if (newScopes.size === 0) {
                    const code = utils.getUid(CODE_LENGTH);
                    authorizationCodes.save(code, client.client_id, redirect_uri, user.id, scope as string);
                    return res.redirect(redirect_uri + `?code=${code}&state=${state}`);
                }
                const transaction_id = utils.getUid(64);
                transactions.set(transaction_id, { redirect_uri, state: state as string, client, user, scope: scope as string })
                res.render('decide', { transactionId: transaction_id, approvedBefore: existingScopes.size > 0, user: user, redirect_uri, clientAuth: client, scopes: utils.formatScopes(newScopes), info: req.flash("info") });
            }
        );

        this.app.post("/dialog/authorize", ensureLoggedIn, (req, res) => {
            const { transaction_id } = req.body;
            if (transaction_id === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing transaction ID");
                return;
            }
            const transaction = transactions.get(transaction_id);
            if (transaction === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Wrong transaction ID");
                return;
            }
            const { redirect_uri, state, client, user, scope } = transaction;
            approvals.addApproval(user.email, client.client_id, scope.split(" "));
            const code = utils.getUid(CODE_LENGTH);
            authorizationCodes.save(code, client.client_id, redirect_uri, user.id, scope);
            res.redirect(redirect_uri + `?code=${code}&state=${state}`);
        });

        this.app.post("/token", (req, res) => {
            const { redirect_uri, client_id, client_secret, code } = req.body;
            if (redirect_uri === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing redirect URI");
                return;
            }
            if (client_id === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing client ID");
                return;
            }
            if (client_secret === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing client secret");
                return;
            }
            if (code === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing code");
                return;
            }

            const authData = authorizationCodes.find(code);
            if (authData === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing authcode");
                return;
            }
            const { clientId, redirectUri, userId, scope } = authData;
            if (client_id !== clientId) {
                res.status(HttpStatus.BAD_REQUEST).send("Mismatching client ID");
                return;
            }
            if (redirect_uri !== redirectUri) {
                res.status(HttpStatus.BAD_REQUEST).send("Mismatching redirect URI");
                return;
            }
            const user = users.findById(userId);
            if (user === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Nonexisting User");
                return;
            }
            const accessToken = utils.getUid(TOKEN_LENGTH);
            const refreshToken = utils.getUid(TOKEN_LENGTH);
            accessTokens.save(accessToken, userId, client_id, scope);
            refreshTokens.save(refreshToken, userId, client_id, scope);
            res.type('json').send({
                "access_token": accessToken,
                "token_type": "bearer",
                "expires_in": 7200,
                "refresh_token": refreshToken,
                "created_at": Date.now()
            });
        });

        this.app.get("/user", async (req, res) => {
            const { token } = req.query;
            if (token === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing token");
                return;
            }
            const tokenData = accessTokens.find(token as string);
            if (tokenData === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Nonexisting token");
                return;
            }
            const { userId, clientId, scope } = tokenData;
            const scopes = new Set(scope.split(" "));
            const user = await users.findById(userId);
            if (user === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Nonexisting User");
                return;
            }
            res.type('json').send({
                'id': user.id,
                'verified': user.verified,
                ...(scopes.has('email')) && { 'email': user.email },
                ...(user.emails && scopes.has('email')) && { 'emails': user.emails },
                ...(user.names && scopes.has('name')) && { 'names': user.names },
                ...(user.addresses && scopes.has('address')) && { 'addresses': user.addresses },
            });
        });

        this.app.post("/info/add", ensureLoggedIn, async (req, res) => {
            const { field, value } = req.body;
            if (field === undefined || value === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing request parameters");
                return;
            }
            const info = utils.enumFromValue(field, InfoType);
            if (info === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Unknown field name");
                return;
            }
            const user = req.user! as User;
            await users.addInfo(user.email, info, value);
            req.flash("info", `A new ${field} has been added`);
            res.redirect('/dashboard');
        });

        this.app.post("/info/update", ensureLoggedIn, async (req, res) => {
            const { field, previous, value } = req.body;
            if (field === undefined || previous === undefined || value === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Request parameter missing");
                return;
            }
            const info = utils.enumFromValue(field, InfoType);
            if (info === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Unknown field name");
                return;
            }
            const user = req.user! as User;
            await users.updateInfo(user.email, info, previous, value);
            req.flash("info", `${field} has been updated`);
            res.redirect('/dashboard');
        });

        this.app.post("/info/delete", ensureLoggedIn, async (req, res) => {
            const { field, previous } = req.body;
            if (field === undefined || previous === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Request parameter missing");
                return;
            }
            const info = utils.enumFromValue(field, InfoType);
            if (info === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Unknown field name");
                return;
            }
            const user = req.user! as User;
            await users.deleteInfo(user.email, info, previous);
            res.redirect('/dashboard');
        });

        this.app.get("/developer", ensureLoggedIn, ensureVerified, (req, res) => {
            res.render("developer", { user: req.user, info: req.flash("info") });
        });

        this.app.get("/developer/new", ensureLoggedIn, ensureVerified, (req, res) => {
            res.render("newapp", { user: req.user, info: req.flash("info") });
        });

        this.app.get("/developer/app/:clientId", ensureLoggedIn, ensureVerified, (req, res) => {
            const { clientId } = req.params;
            if (clientId === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing clientId");
                return;
            }
            const user = req.user! as User;
            const client = user.clients.filter(c => c.client_id === clientId)[0];
            if (client === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing clientId");
                return;
            }
            res.render("appview", { user: req.user! as User, app: client, info: req.flash("info") });
        });

        this.app.post("/app/new", ensureLoggedIn, async (req, res) => {
            const { name, redirect_uri } = req.body;
            if (name === undefined || redirect_uri === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing request paramter");
                return;
            }
            await clients.addNewClient(req.user! as User, name, redirect_uri);
            req.flash("info", "App added successfully");
            res.redirect("/developer");
        });

        this.app.post("/app/update", ensureLoggedIn, async (req, res) => {
            const { client_id, name, redirect_uri } = req.body;
            if (client_id === undefined || name === undefined || redirect_uri === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Missing request paramter");
                return;
            }
            await clients.updateClient(client_id, req.user! as User, name, redirect_uri);
            req.flash("info", "App has been updated.");
            res.redirect("/developer/app/" + client_id);
        });

        this.app.post("/ask/verify", ensureLoggedIn, async (req, res) => {
            const user = req.user! as User;
            if (!user.verified) {
                const success = await users.sendVerification(user.email);
                if (success) {
                    req.flash("info", "Check your inbox!");
                } else {
                    req.flash("info", "Email is already sent.");
                }
            } else {
                req.flash("info", "User is already verified.");
            }
            res.redirect("/dashboard");
        });

        this.app.get("/verify/:token", async (req, res) => {
            const { token } = req.params;
            if (token === undefined) {
                res.status(HttpStatus.BAD_REQUEST).send("Token is missing");
                return;
            }
            const success = await users.attemptVerify(token);
            if (success) {
                req.flash("info", "Your email was verified successfully!");
            } else {
                req.flash("info", "Your token has expired.");
            }
            res.redirect("/login");
        });

        this.app.get("/ask/verify", ensureLoggedIn, (req, res) => {
            res.render("verify", { user: req.user, info: req.flash("info") });
        });
    }


    public start(): Promise<void> {
        return new Promise(resolve => {
            this.server = this.app.listen(this.port, () => {
                console.log('server now listening at', this.port);
                resolve();
            });
        });
    }

    public stop(): void {
        this.server?.close();
        console.log('server stopped');
    }
}