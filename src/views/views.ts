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

// Authenticate token
// router.use('/', passport.authenticate('bearer'));

// router.get('/', (req, res) => {
//     let locations = getLocations();
//     res.render("location-list", {locations: locations});
// })

router.get('/cube/:cubeId', getCubeDetail);
router.get('/location/:location', getLocationDetail);


// TODO send threshold values
async function getCubeDetail(req: Request, res: Response) {

    let cubeId: string = req.params["cubeId"];
    try {
        let cube: Cube = await getCubeWithId(cubeId);
        res.render("cube-detail", {
            cubeId: cube.id
        });
    } catch (error) {
        res.status(500).end();
    }
}

async function getLocationDetail(req: Request, res: Response) {

    let location: string = req.params["location"];
    try {
        let cubes: Array<Cube> = await getCubesByLocation(location);
        console.log("exit");
        let cubeIds: Array<string> = []
        cubes.forEach(e => {
            cubeIds.push(e.id);
        }); 
        res.render("location-detail", {
            cubeIds: cubeIds,
            location: location
        });
    } catch (error) {
        console.log(error);
        res.status(500).end();
    }
}