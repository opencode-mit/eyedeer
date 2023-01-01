// import mysql, { Connection } from 'mysql2/promise';
import * as edgedb from "edgedb";
import { CLIENT_ID_LENGTH, CLIENT_NAME_MAX, CLIENT_SECRET_LENGTH, HASHED_PASSWORD_MAX, REDIRECT_URI_MAX, USERNAME_MAX } from '../Common';

export let DBClient = edgedb.createClient();

export async function connect() {
    // con = await mysql.createConnection({
    //     host: process.env["MYSQL_HOST"],
    //     port: Number.parseInt(process.env["MYSQL_PORT"]!),
    //     user: process.env["MYSQL_USER"],
    //     password: process.env["MYSQL_PASSWORD"],
    //     database: 'eyedeer'
    // });
    // await con.connect();
    // await con.execute(`DROP TABLE users`);
    // await con.execute(`DROP TABLE clients`);
    // // await con.execute(`DROP TABLE grants`);
    // await con.execute(`CREATE TABLE IF NOT EXISTS users (ID INTEGER PRIMARY KEY, username VARCHAR(${USERNAME_MAX}) UNIQUE KEY, hash VARCHAR(${HASHED_PASSWORD_MAX}), verified BOOLEAN)`)
    // await con.execute(`CREATE TABLE IF NOT EXISTS clients (ID INTEGER PRIMARY KEY, name VARCHAR(${CLIENT_NAME_MAX}), clientId VARCHAR(${CLIENT_ID_LENGTH}) UNIQUE KEY, clientSecret VARCHAR(${CLIENT_SECRET_LENGTH}), redirectURI VARCHAR(${REDIRECT_URI_MAX}), image LONGBLOB)`)
    // await con.execute(`CREATE TABLE IF NOT EXISTS grants (ID INTEGER PRIMARY KEY, userId INTEGER, clientId VARCHAR(${CLIENT_ID_LENGTH}), scopes TEXT, FOREIGN KEY(userId) REFERENCES users(ID), FOREIGN KEY(clientId) REFERENCES clients(clientId))`)
};