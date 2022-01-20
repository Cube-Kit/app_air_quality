// Type imports
import { Router, Request, Response } from "express";
import { Cube } from "../types";
// External imports
import express from "express";
import passport from "passport";
import { getCubeById } from "../model/cube";
// Internal imports

// Export the router
export var router: Router = express.Router();

// Authenticate token
// router.use('/', passport.authenticate('bearer'));

// router.get('/', (req, res) => {
//     let locations = getLocations();
//     res.render("location-list", {locations: locations});
// })

router.get('/:cubeId', getCubeDetail);


async function getCubeDetail(req: Request, res: Response) {

    let cubeId: string = req.params["cubeId"];
    try {
        let cube: Cube = await getCubeById(cubeId);
        res.render("cube-detail", {
            cubeId: cube.id
        });
    } catch (error) {
        res.status(500);
    }
}