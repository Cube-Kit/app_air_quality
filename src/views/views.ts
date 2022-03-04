// Type imports
import { Router, Request, Response } from "express";
import { Cube } from "../types";
// External imports
import express from "express";
import passport from "passport";
import { getCubeWithId, getCubesByLocation } from "../model/cube";
// Internal imports

// Export the router
export var router: Router = express.Router();
// Thresholds for air quality levels
const qualityThresholdString: string = process.env.AirQualityThresholds || "50 100 150";
const qualityThresholds: Array<number> = qualityThresholdString.split(" ").map((string) => {
    return parseInt(string);
});

console.log(qualityThresholds);

// Authenticate token
// router.use('/', passport.authenticate('bearer'));

// router.get('/', (req, res) => {
//     let locations = getLocations();
//     res.render("location-list", {locations: locations});
// })
router.get('/', (req, res) => {
    res.send("hello World");
})
router.get('/cube/:cubeId', getCubeDetail);
router.get('/location/:location', getLocationDetail);


// TODO send threshold values
async function getCubeDetail(req: Request, res: Response) {

    let cubeId: string = req.params["cubeId"];
    try {
        let cube: Cube = await getCubeWithId(cubeId);
        res.render("cube-detail", {
            cubeId: cube.id,
            thresholds: qualityThresholds
        });
    } catch (error) {
        res.status(500).end();
    }
}

async function getLocationDetail(req: Request, res: Response) {

    let location: string = req.params["location"];
    try {
        let cubes: Array<Cube> = await getCubesByLocation(location);
        let cubeIds: Array<string> = []
        cubes.forEach(e => {
            cubeIds.push(e.id);
        }); 
        console.log(cubeIds);
        res.render("location-detail", {
            cubeIds: cubeIds,
            location: location,
            thresholds: qualityThresholds
        });
    } catch (error) {
        console.log(error);
        res.status(500).end();
    }
}