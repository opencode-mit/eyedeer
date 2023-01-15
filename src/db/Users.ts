import { InfoType, User } from "../Common";
import e from "../../dbschema/edgeql-js";
import { DBClient } from "./Connect";
import { sendEmail } from "../config/Mailer";
import bcrypt, { hash } from 'bcrypt';
import * as utils from '../util/Utils';

export const findByEmail = async (email: string): Promise<User | undefined> => {
    const user = await e.select(e.User, () => ({
        ...e.User['*'],
        grants: {
            client: {
                name: true,
                client_id: true,
                redirect_uri: true,
                image: true,
            },
            scopes: true
        },
        clients: {
            name: true,
            client_id: true,
            client_secret: true,
            redirect_uri: true,
            image: true,
        },
        filter_single: { email: email }
    })).run(DBClient);
    if (user) return user;
    return undefined;
};

export const findById = async (id: string): Promise<User | undefined> => {
    const user = await e.select(e.User, () => ({
        ...e.User['*'],
        grants: {
            client: {
                name: true,
                client_id: true,
                redirect_uri: true,
                image: true,
            },
            scopes: true
        },
        clients: {
            name: true,
            client_id: true,
            client_secret: true,
            redirect_uri: true,
            image: true,
        },
        filter_single: { id: id }
    })).run(DBClient);
    if (user) return user;
    return undefined;
};

export async function addInfo(email: string, info: InfoType, value: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: { email: email },
        set: {
            ...(info === InfoType.Email) && { emails: { "+=": value } },
            ...(info === InfoType.Name) && { names: { "+=": value } },
            ...(info === InfoType.Address) && { addresses: { "+=": value } },
        }
    })).run(DBClient);
}

export async function updateInfo(email: string, info: InfoType, previous: string, value: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: { email: email },
        set: {
            ...(info === InfoType.Email) && { emails: { "-=": previous } },
            ...(info === InfoType.Name) && { names: { "-=": previous } },
            ...(info === InfoType.Address) && { addresses: { "-=": previous } },
        }
    })).run(DBClient);
    await e.update(e.User, user => ({
        filter_single: { email: email },
        set: {
            ...(info === InfoType.Email) && { emails: { "+=": value } },
            ...(info === InfoType.Name) && { names: { "+=": value } },
            ...(info === InfoType.Address) && { addresses: { "+=": value } },
        }
    })).run(DBClient);
}

export async function deleteInfo(email: string, info: InfoType, previous: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: { email: email },
        set: {
            ...(info === InfoType.Email) && { emails: { "-=": previous } },
            ...(info === InfoType.Name) && { names: { "-=": previous } },
            ...(info === InfoType.Address) && { addresses: { "-=": previous } },
        }
    })).run(DBClient);
}

async function verify(email: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: { email: email },
        set: {
            verified: true
        }
    })).run(DBClient);
}

async function changePassword(email: string, password: string): Promise<void> {
    const hash = await bcrypt.hash(password, 10);
    await e.update(e.User, user => ({
        filter_single: { email: email },
        set: {
            hash: hash
        }
    })).run(DBClient);
}

const verificationTokens = new Map<string, { token: string, expires: number, sent: number }>();
const reverseVerificationTokens = new Map<string, string>();

async function sendEmailVerification(email: string, token: string) {
    await sendEmail({
        to: email,
        subject: "Welcome to EyeDeer! Confirm Your Email",
        body: `Please click on ${process.env["HOST_URL"]}/verify/${token} to verify your Email address`
    });
}

export async function sendVerification(email: string): Promise<boolean> {
    const lastToken = verificationTokens.get(email);
    if (lastToken !== undefined && (Date.now() - lastToken.sent) < 1000 * 30) return false;
    const token = utils.getUid(60);
    await sendEmailVerification(email, token);
    verificationTokens.set(email, { token, expires: Date.now() + 1000 * 60 * 60, sent: Date.now() });
    reverseVerificationTokens.set(token, email);
    return true;
}

export async function attemptVerify(token: string): Promise<boolean> {
    const email = reverseVerificationTokens.get(token);
    if (email === undefined) return false;
    const data = verificationTokens.get(email);
    if (data === undefined) return false;
    if (data.expires < Date.now()) {
        verificationTokens.delete(email);
        return false;
    }
    if (data.token !== token) return false;
    await verify(email);
    return true;
}

const resetTokens = new Map<string, { token: string, expires: number, sent: number }>();
const reverseResetTokens = new Map<string, string>();

async function sendEmailReset(email: string, token: string) {
    await sendEmail({
        to: email,
        subject: "Reset your EyeDeer password",
        body: `Please click on ${process.env["HOST_URL"]}/reset/${token} to reset your password`
    });
}

export async function sendReset(email: string): Promise<boolean> {
    const lastToken = resetTokens.get(email);
    if (lastToken !== undefined && (Date.now() - lastToken.sent) < 1000 * 30) return false;
    const token = utils.getUid(60);
    await sendEmailReset(email, token);
    resetTokens.set(email, { token, expires: Date.now() + 1000 * 60 * 60, sent: Date.now() });
    reverseResetTokens.set(token, email);
    return true;
}

export async function attemptReset(token: string, password: string): Promise<boolean> {
    const email = reverseResetTokens.get(token);
    if (email === undefined) return false;
    const data = resetTokens.get(email);
    if (data === undefined) return false;
    if (data.expires < Date.now()) {
        resetTokens.delete(email);
        return false;
    }
    if (data.token !== token) return false;
    await changePassword(email, password);
    return true;
}