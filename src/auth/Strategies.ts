import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "~/Common";
import e from "../../dbschema/edgeql-js";
import bcrypt, { hash } from 'bcrypt';
import * as users from '../db/Users';
import { DBClient } from "../db/Connect";
import { Strategy as RememberMeStrategy } from 'passport-remember-me';
import * as util from '../util/Utils';

export const tokens = new Map<string, string>();

export function issueToken(userId: string): string {
    const token = util.getUid(64);
    tokens.set(token, userId);
    return token;
}

export async function consumeToken(token: string): Promise<User | undefined> {
    const userId = tokens.get(token);
    if (userId === undefined) return undefined;
    tokens.delete(token);
    const user = await users.findById(userId);
    if (user === undefined) return undefined;
    return user;
}

export default function Configure() {
    passport.serializeUser<any, any>((req, user, done) => {
        const actualUser = user as User;
        done(undefined, actualUser.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        done(undefined, await users.findById(id));
    });

    passport.use(new LocalStrategy({ usernameField: "email", passReqToCallback: true }, async function(req, email, password, done) {
        const user = await users.findByEmail(email);
        if (!user) return done(undefined, false);
        const isMatch = await bcrypt.compare(password, user.hash);
        if (!isMatch) {
            return done(undefined, false);
        }
        return done(undefined, user);
    }));

    passport.use('local-signup', new LocalStrategy({ usernameField: "email" }, async function(email, password, done) {
        const existingUser = await users.findByEmail(email);
        if (existingUser !== undefined) return done(undefined, false);
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = await e.insert(e.User, {
            email: email,
            hash: hashedPassword,
            verified: false
        }).run(DBClient);
        const newUser = await users.findById(id.id);
        done(undefined, newUser!);
    }));
}