import assert from 'assert';
import express, { Application, json } from 'express';
import http from 'http';
import HttpStatus from 'http-status-codes';
import asyncHandler from 'express-async-handler';
import dotenv from 'dotenv';

export class WebServer {
    private readonly app: Application;
    public server: http.Server | undefined;

    public constructor(private readonly port: number) {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.app.get("/", (req, res) => {
            res.send("<h1>Hello World!</h1>");
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