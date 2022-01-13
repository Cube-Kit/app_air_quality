// Type imports
import { Router, Request, Response } from "express";
import { Cube, Token } from "../types";
// External imports
import express from "express";
// Internal imports
import { addToken, addAppToken } from "../model/token";
import { addCube } from "../model/cube";

// Export the router
export var router: Router = express.Router();

router.post('/', setup);

async function setup(req: Request, res: Response){
    // Persist the server access token
    let server_token: string = req.body["serverToken"];
    try {
        await addToken("server", server_token);
    } catch (error: any) {
        if ((error as Error).message.includes("duplicate key value violates unique constraint")) {
            return res.status(500).send("Already registered to a server.");
        } else {
            console.log(error);
            return res.status(500);
        }
    }

    // Add cubes to app
    let cubes: Array<Cube> = req.body["cubes"];
    cubes.forEach(async (cube: Cube) => {
        try {
            await addCube(cube.id, cube.location);
        } catch (error) {
            console.log(error);
        }
    });
    
    // Create an access token for the server to the app
    try {
        let app_token: Token = await addAppToken();
        return res.send({appToken: app_token.key});
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
}