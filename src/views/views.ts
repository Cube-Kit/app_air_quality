// Type imports
import { Router, Request, Response } from "express";
// External imports
import express from "express";
import passport from "passport";
import { defaultMaxListeners } from "events";
// Internal imports

// Export the router
export var router: Router = express.Router();

// Authenticate token
//router.use('/', passport.authenticate('bearer'));

router.get('/', (req, res) => {
    res.render("location-detail");
})

// Delegate view-routes to their views
// router.use('/', ... )