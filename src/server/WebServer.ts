import assert from 'assert';
import express, { Application, json, NextFunction } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import errorHander from 'errorhandler';
import session from 'express-session'
const expressMySQLStore = require('express-mysql-session')(session);
import login from 'connect-ensure-login';
import * as clients from '../db/Clients';
import * as users from '../db/Users';
import * as accessTokens from '../db/AccessTokens';
import * as refreshTokens from '../db/RefreshTokens';
import * as authorizationCodes from '../db/AuthorizationCodes';
import * as utils from '../util/Utils';
import HttpStatus from 'http-status-codes';
import asyncHandler from 'express-async-handler';
import { Client, CODE_LENGTH, TOKEN_LENGTH, User } from '../Common';
import passport from 'passport';

declare module 'express-session' {
    interface SessionData {
        user: User;
    }
}


export class WebServer {
    private readonly app: Application;
    public server: http.Server | undefined;

    public constructor(private readonly port: number) {
        this.app = express();
        this.app.set('view engine', 'ejs');
        // this.app.use(cookieParser());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(errorHander());
        const sessionStore = new expressMySQLStore({
            host: process.env['MYSQL_HOST'],
            port: process.env['MYSQL_PORT'],
            user: process.env['MYSQL_USER'],
            password: process.env['MYSQL_PASSWORD'],
            database: 'cookies'
        });
        this.app.use(session({
            secret: 'barish',
            resave: false,
            saveUninitialized: true,
            store: sessionStore,
            cookie: {
                maxAge: 60 * 60 * 1000
            }
        }));
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.app.use((req, res, next) => {
            console.log(req.url);
            next();
        });

        this.app.use(express.static('assets'));

        this.app.get("/", (req, res) => {
            res.send("<h1>OAuth 2.0 Server!</h1>");
        });

        this.app.get("/login", (req, res) => {
            res.render('login', { direction: `/login` });
        });

        this.app.post("/login", (req, res, next) => {
            const { username, password } = req.body;
            const user = users.findByUsername(username);
            if (!user || user.password !== password) return res.redirect("/login");
            req.session.user = user;
            res.redirect("/dashboard");
        });

        const isAuth = (req: any, res: any, next: NextFunction) => {
            if (req.session.user) return next();
            res.redirect('/login')
        }

        this.app.get("/dashboard", isAuth, (req, res) => {
            const user = req.session.user;
            assert(user);
            console.log(user);
            const approvedApps = [...users.findById(user.id)!.apps.keys()];
            const approvedClients = approvedApps.map((clientId) => clients.findByClientId(clientId));
            res.render('dashboard', { user: users.findById(user.id), clients: approvedClients });
        });

        this.app.get("/logto", (req, res) => {
            const { redirect_uri, state, client_id, scope } = req.query;
            assert(redirect_uri && state && client_id && scope);
            res.render('login', { direction: `/logto?redirect_uri=${redirect_uri}&state=${state}&client_id=${client_id}&scope=${scope}` });
        });

        this.app.post("/logto", (req, res, next) => {
            const { username, password } = req.body;
            const user = users.findByUsername(username);
            if (!user || user.password !== password) return res.redirect("/logto");
            req.session.user = user;
            next();
        }, (req, res, next) => {
            const { redirect_uri, state, client_id, scope } = req.query;
            assert(redirect_uri && state && client_id && scope);
            const client = clients.findByClientId(client_id as string);
            assert(client);
            assert(client.redirect_uri == redirect_uri);
            const user = req.session.user as User;
            if (users.checkScopes(user.id, client.clientId, new Set((scope as string).split(" ")))) {
                const code = utils.getUid(CODE_LENGTH);
                authorizationCodes.save(code, client.clientId, redirect_uri, user.id, scope as string);
                return res.redirect(redirect_uri + `?code=${code}&state=${state}`);
            }
            const transaction_id = utils.getUid(64);
            transactions.set(transaction_id, { redirect_uri: redirect_uri as string, state: state as string, client, user, scope: scope as string });
            const existingScopes = users.getCurrentApprovedScopes(user.id, client.clientId);
            const newScopes = utils.inFirstNotInSecond(new Set((scope as string).split(" ")), existingScopes);
            res.render('decide', { transactionId: transaction_id, approvedBefore: existingScopes.size > 0, user: user, redirect_uri, clientAuth: client, scopes: utils.formatScopes(newScopes) });
        });

        this.app.get("/logout", (req, res, next) => {
            req.logout(function (err) {
                if (err) { return next(err); }
                res.redirect('/');
            });
        });

        this.app.get("/account", login.ensureLoggedIn(), (req, res) => {
            res.send(JSON.stringify(req.user));
        });

        const transactions = new Map<string, { redirect_uri: string, state: string, client: Client, user: User, scope: string }>();

        this.app.get("/dialog/authorize",
            (req, res, next) => {
                console.log(req.query);
                const { redirect_uri, state, client_id, scope } = req.query;
                assert(redirect_uri && state && client_id && scope);
                if (!req.session.user) {
                    return res.redirect(`/logto?redirect_uri=${redirect_uri}&state=${state}&client_id=${client_id}&scope=${scope}`);
                }
                next();
            },
            (req, res, next) => {
                const { redirect_uri, state, client_id, scope } = req.query;
                assert(redirect_uri && state && client_id && scope);
                const client = clients.findByClientId(client_id as string);
                assert(client);
                assert(client.redirect_uri == redirect_uri);
                const user = req.session.user as User;
                if (users.checkScopes(user.id, client.clientId, new Set((scope as string).split(" ")))) {
                    const code = utils.getUid(CODE_LENGTH);
                    authorizationCodes.save(code, client.clientId, redirect_uri, user.id, scope as string);
                    return res.redirect(redirect_uri + `?code=${code}&state=${state}`);
                }
                const transaction_id = utils.getUid(64);
                const existingScopes = users.getCurrentApprovedScopes(user.id, client.clientId);
                const newScopes = utils.inFirstNotInSecond(new Set((scope as string).split(" ")), existingScopes);
                res.render('decide', { transactionId: transaction_id, approvedBefore: existingScopes.size > 0, user: user, redirect_uri, clientAuth: client, scopes: utils.formatScopes(newScopes) });
            }
        );

        this.app.post("/dialog/authorize", (req, res) => {
            const { transaction_id } = req.body;
            const transaction = transactions.get(transaction_id);
            assert(transaction);
            const { redirect_uri, state, client, user, scope } = transaction;
            users.addAppWithScopes(user.id, client.clientId, new Set(scope.split(" ")));
            const code = utils.getUid(CODE_LENGTH);
            authorizationCodes.save(code, client.clientId, redirect_uri, user.id, scope);
            res.redirect(redirect_uri + `?code=${code}&state=${state}`);
        });

        this.app.post("/token", (req, res) => {
            const { redirect_uri, client_id, client_secret, code } = req.body;
            assert(redirect_uri && client_id && client_secret && code);

            const authData = authorizationCodes.find(code);
            assert(authData);
            const { clientId, redirectUri, userId, scope } = authData;
            assert(client_id === clientId);
            assert(redirect_uri === redirectUri);
            const user = users.findById(userId);
            assert(user);
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

        this.app.get("/user", (req, res) => {
            const { token } = req.query;
            assert(token);
            const tokenData = accessTokens.find(token as string);
            assert(tokenData);
            const { userId, clientId } = tokenData;
            const user = users.findById(userId);
            assert(user);
            res.type('json').send({
                'profile': user.profile
            });
        });

        // this.app.post("/update", isAuth, (req, res) => {
        //     const { field, value } = req.body;
        //     req.session.user!.profile[field] = value;
        // });
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