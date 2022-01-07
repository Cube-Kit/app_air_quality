// Type imports
import { Router, Request, Response } from "express";
import { Token } from "../types";
// External imports
import express from "express";
// Internal imports
import { addToken } from "../model/token";

// Export the router
export var router: Router = express.Router();

router.post('/', setup);

async function setup(req: Request, res: Response){
    // Persist the server access token
    let server_token: string = req.body["serverToken"];
    await addToken("server", server_token);

    // Create an access token for the server to the app
    let app_token: Token = await addToken("app");
    res.send({appToken: app_token.key});
}