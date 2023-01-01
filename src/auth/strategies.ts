import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { con } from "../db/Connect";
import * as users from '../db/Users';

export default function Configure() {
    passport.use(new LocalStrategy(function(username, password, done) {
        const user = users.findByUsername(username);
        if (!user) return done(undefined, false);
        if (user.password !== password) return done(undefined, false);
        return done(undefined, user);
    }));
}