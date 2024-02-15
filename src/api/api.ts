// Type imports
import { Router, Request, Response } from "express";
// External imports
import express from "express";
import passport from "passport";
// Internal imports
import { getSensorData } from "../model/sensor_data";
import { addToken, deleteTokenByKey } from "../model/token";
import { Token } from "../types";
import { randomUUID } from "crypto";

// Export the router
export var router: Router = express.Router();

// Authenticate token
router.use('/', passport.authenticate('bearer', { session: false }));

router.post('/data/:cubeId', getData);
router.post('/token/refresh/:token', refreshToken);

async function getData(req: Request, res: Response) {
    let cubeId: string = req.params['cubeId'];
    let startTime: string | undefined = req.body['start'] || undefined;
    let endTime: string | undefined = req.body['end'] || undefined;

    try {
        let data: Array<Object> = await getSensorData(cubeId, startTime, endTime);
        return res.status(200).send(data);
    } catch (error) {
        console.log(error);
        return res.status(500).send("database error");
    }
}

async function refreshToken(req: Request, res: Response) {
    let token: string = req.params['token'];

    try {
        let newToken: Token = await addToken("util_" + randomUUID(), 60);
        deleteTokenByKey(token);
        return res.status(200).send(newToken);
    } catch (e) {
        console.log(e);
        return res.status(500).send("database error");
    }
}
