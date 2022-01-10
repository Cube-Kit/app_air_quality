// Type imports
import { Router, Request, Response } from "express";
// External imports
import express from "express";
// Internal imports
import { router as setupRouter } from "./setup";
import { getSensorData } from "../model/sensor_data";

// Export the router
export var router: Router = express.Router();

// Delegate API-routes to their routers
router.use('/setup', setupRouter);
router.post('/data/:cubeId', getData);

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
