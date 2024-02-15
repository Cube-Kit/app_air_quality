// Type imports
import { Router, Request, Response } from "express";
import { Cube, Token } from "../types";
// External imports
import express from "express";
import passport from "passport";
// Internal imports
import { addToken, addAppToken, clearTokensTable } from "../model/token";
import { addCube, clearCubesTable } from "../model/cube";
import { clearDataTable } from "../model/sensor_data";
import { subscribeDefaultTopics, unsubscribeDefaultTopics } from "../utils/mqtt_utils";

// Export the router
export var router: Router = express.Router();

router.post('/', setup);
router.post('/reset', passport.authenticate('bearer'), reset);

async function setup(req: Request, res: Response){
    // Persist the server access token
    let server_token: string = req.body["serverToken"];
    try {
        await addToken("server", 0, server_token);
    } catch (error: any) {
        if ((error as Error).message.includes("duplicate key value violates unique constraint")) {
            return res.status(500).send("Already registered to a server.");
        } else {
            console.log(error);
            return res.status(500).end();
        }
    }

    // Setup app for use
    try {
        await clearCubesTable();
        await clearDataTable();
        await subscribeDefaultTopics();
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }

    // Add cubes to app
    let cubes: Array<Cube> = req.body["cubes"];
    cubes.forEach(async (cube: Cube) => {
        try {
            await addCube(cube);
        } catch (error) {
            console.log(error);
        }
    });
    
    // Create an access token for the server to the app
    try {
        let app_token: Token = await addAppToken();
        console.log("Connected to server");
        return res.send({appToken: app_token.key});
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
}

async function reset(req: Request, res: Response) {
    // Reset tables
    try {
        await clearTokensTable();
        await clearCubesTable();
        await clearDataTable();
        await unsubscribeDefaultTopics();
        console.log("Disconnected from server");
        return res.status(200).end();
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
}