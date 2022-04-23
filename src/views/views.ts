// Type imports
import { Router, Request, Response } from "express";
import { Cube } from "../types";
// External imports
import express from "express";
import passport from "passport";
import { getCubeWithId, getCubesByLocation, getCubes, compareCubes } from "../model/cube";
// Internal imports

// Export the router
export var router: Router = express.Router();
// Thresholds for air quality levels
const qualityThresholdString: string = process.env.AirQualityThresholds || "100 200 300";
export const qualityThresholds: Array<number> = qualityThresholdString.split(" ").map((string) => {
    return parseInt(string);
});

console.log(qualityThresholds);

// Authenticate token
// router.use('/', passport.authenticate('bearer'));

// router.get('/', (req, res) => {
//     let locations = getLocations();
//     res.render("location-list", {locations: locations});
// })

router.get('/', getCubeList);
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

async function getCubeList(req:Request, res:Response) {
    let location: string = req.params["location"];
    try {
        let cubes: Array<Cube> = await getCubes();
        console.log(cubes);
        let locationSet: Set<string> = new Set();
        let locations: Array<object> = [];
        cubes.forEach(e => {
            locationSet.add(e.location);
        }); 

        locationSet.forEach(l => {
            let location = {"name": l, "cubes": new Array()};
            cubes.forEach(e => {
                if (l === e.location) {
                    location.cubes.push(e);
                }
            })
            locations.push(location);
        });

        console.log(locations);

        res.render("cubes-list", {
            cubes: cubes,
            locations: locations,
            thresholds: qualityThresholds
        });
    } catch (error) {
        console.log(error);
        res.status(500).end();
    }
}