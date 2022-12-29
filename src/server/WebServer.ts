import assert from 'assert';
import express, { Application, json } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import errorHander from 'errorhandler';
import session from 'express-session'
import login from 'connect-ensure-login';
import * as clients from '../db/Clients';
import * as users from '../db/Users';
import * as accessTokens from '../db/AccessTokens';
import * as refreshTokens from '../db/RefreshTokens';
import * as authorizationCodes from '../db/AuthorizationCodes';
import * as utils from '../util/Utils';
import HttpStatus from 'http-status-codes';
import asyncHandler from 'express-async-handler';
import dotenv from 'dotenv';
import { Client, User } from '../Types';

export class WebServer {
    private readonly app: Application;
    public server: http.Server | undefined;

    public constructor(private readonly port: number) {
        this.app = express();
        // this.app.use(cookieParser());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(errorHander());
        this.app.use(session({
            secret: 'barish',
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 60 * 60 * 1000
            }
        }));

        this.app.use((req, res, next) => {
            console.log(req.url);
            next();
        });

        this.app.get("/", (req, res) => {
            res.send("<h1>OAuth 2.0 Server!</h1>");
        });

        this.app.get("/login", (req, res) => {
            res.send(`<form action="/login" method="post">
                        <div>
                        <label>Username:</label>
                        <input type="text" name="username" /><br/>
                        </div>
                        <div>
                        <label>Password:</label>
                        <input type="password" name="password" />
                        </div>
                        <div>
                        <input type="submit" value="Submit" />
                        </div>
                    </form>
                    <p><small>Hint - bob:secret</small></p>
                    <p><small>Hint - joe:password</small></p>`);
        });

        this.app.post("/login", (req, res, next) => {
            const { username, password } = req.body;
            const user = users.findByUsername(username);
            if (!user || user.password !== password) return res.redirect("/login");
            req.user = user;
            res.redirect("/");
        });

        this.app.get("/logto", (req, res) => {
            const { redirect_uri, state, client_id } = req.query;
            assert(redirect_uri && state && client_id);
            res.send(`<form action="/logto?redirect_uri=${redirect_uri}&state=${state}&client_id=${client_id}" method="post">
                        <div>
                        <label>Username:</label>
                        <input type="text" name="username" /><br/>
                        </div>
                        <div>
                        <label>Password:</label>
                        <input type="password" name="password" />
                        </div>
                        <div>
                        <input type="submit" value="Submit" />
                        </div>
                    </form>
                    <p><small>Hint - bob:secret</small></p>
                    <p><small>Hint - joe:password</small></p>`);
        });

        this.app.post("/logto", (req, res, next) => {
            const { username, password } = req.body;
            const user = users.findByUsername(username);
            if (!user || user.password !== password) return res.redirect("/logto");
            req.user = user;
            next();
        }, (req, res, next) => {
            const { redirect_uri, state, client_id } = req.query;
            assert(redirect_uri && state && client_id);
            const client = clients.findByClientId(client_id as string);
            assert(client);
            const user = req.user as User;
            const transaction_id = utils.getUid(64);
            transactions.set(transaction_id, { redirect_uri: redirect_uri as string, state: state as string, client, user });
            res.send(`<p>Hi ${user.name}!</p>
                      <p><b>${client.name}</b> is requesting access to your account.</p>
                      <p>Do you approve?</p>
                      
                      <form action="/dialog/authorize" method="post">
                      <input name="transaction_id" type="hidden" value="${transaction_id}" />
                      <div>
                          <input type="submit" value="Allow" id="allow" />
                          <input type="submit" value="Deny" name="cancel" id="deny" />
                      </div>
                      </form>`)
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

        const transactions = new Map<string, { redirect_uri: string, state: string, client: Client, user: User }>();

        this.app.get("/dialog/authorize",
            (req, res, next) => {
                const { redirect_uri, state, client_id } = req.query;
                assert(redirect_uri && state && client_id);
                if (!req.user) {
                    return res.redirect(`/logto?redirect_uri=${redirect_uri}&state=${state}&client_id=${client_id}`);
                }
                next();
            },
            (req, res, next) => {
                const { redirect_uri, state, client_id } = req.query;
                assert(redirect_uri && state && client_id);
                const client = clients.findByClientId(client_id as string);
                assert(client);
                const user = req.user as User;
                const transaction_id = utils.getUid(64);
                transactions.set(transaction_id, { redirect_uri: redirect_uri as string, state: state as string, client, user });
                res.send(`<p>Hi ${user.name}!</p>
                          <p><b>${client.name}</b> is requesting access to your account.</p>
                          <p>Do you approve?</p>
                          
                          <form action="/dialog/authorize" method="post">
                          <input name="transaction_id" type="hidden" value="${transaction_id}" />
                          <div>
                              <input type="submit" value="Allow" id="allow" />
                              <input type="submit" value="Deny" name="cancel" id="deny" />
                          </div>
                          </form>`)
            }
        );

        this.app.post("/dialog/authorize", (req, res) => {
            const { transaction_id } = req.body;
            const transaction = transactions.get(transaction_id);
            assert(transaction);
            const { redirect_uri, state, client, user } = transaction;
            const code = utils.getUid(16);
            authorizationCodes.save(code, client.clientId, redirect_uri, user.id);
            res.redirect(redirect_uri + `?code=${code}&state=${state}`);
        });

        this.app.post("/token", (req, res) => {
            const { redirect_uri, client_id, client_secret, code } = req.body;
            assert(redirect_uri && client_id && client_secret && code);

            const authData = authorizationCodes.find(code);
            assert(authData);
            const { clientId, redirectUri, userId } = authData;
            assert(client_id === clientId);
            assert(redirect_uri === redirectUri);
            const user = users.findById(userId);
            assert(user);
            const accessToken = utils.getUid(256);
            const refreshToken = utils.getUid(256);
            accessTokens.save(accessToken, userId, client_id);
            refreshTokens.save(refreshToken, userId, client_id);
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
                'name': user.name
            });
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