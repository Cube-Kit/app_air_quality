// Type imports
import { Router, Request, Response } from "express";
import { Cube } from "../types";
// External imports
import express from "express";
import passport from "passport";
// Internal imports
import { getCubeWithId, getCubesByLocation, getCubes } from "../model/cube";
import { qualityThresholds } from "../model/sensor_data";

// Export the router
export var router: Router = express.Router();

// Authenticate token
// router.use('/', passport.authenticate('bearer'));

// router.get('/', (req, res) => {
//     let locations = getLocations();
//     res.render("location-list", {locations: locations});
// })

router.get('/', getLocationsList);
router.get('/cube/:cubeId', getCubeDetail);
router.get('/location/:location', getLocationDetail);

async function getLocationsList(req:Request, res:Response) {
    try {
        let cubes: Array<Cube> = await getCubes();
        let locationMap: Map<string, Array<Cube>> = new Map();

        cubes.forEach((cube: Cube) => {
            let location: Array<Cube> = locationMap.get(cube.location) || [];
            location.push(cube);
            locationMap.set(cube.location, location);
        });

        let locations =  Array.from(locationMap,
            (location) => {
                return {
                    name: location[0],
                    cubes: location[1]
                };
            }
        );

        res.render("locations-list", {
            locations: locations,
            thresholds: qualityThresholds
        });
    } catch (error) {
        console.log(error);
        res.status(500).end();
    }
}

async function getCubeDetail(req: Request, res: Response) {

    let cubeId: string = req.params["cubeId"];
    try {
        let cube: Cube = await getCubeWithId(cubeId);
        res.render("location-detail", {
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
        let cubeIds: Array<string> = [];

        cubes.forEach(e => {
            cubeIds.push(e.id);
        }); 

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