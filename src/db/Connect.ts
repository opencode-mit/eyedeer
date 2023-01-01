// import mysql, { Connection } from 'mysql2/promise';
import * as edgedb from "edgedb";
import { CLIENT_ID_LENGTH, CLIENT_NAME_MAX, CLIENT_SECRET_LENGTH, HASHED_PASSWORD_MAX, REDIRECT_URI_MAX, USERNAME_MAX } from '../Common';

export let DBClient = edgedb.createClient();

export async function connect() {
    console.log(await DBClient.query("select 1 + 1;"));
};