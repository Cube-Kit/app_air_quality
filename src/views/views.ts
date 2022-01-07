// Type imports
import { Router, Request, Response } from "express";
// External imports
import express from "express";
import passport from "passport";
// Internal imports

// Export the router
export var router: Router = express.Router();

// Authenticate token
router.use('/', passport.authenticate('bearer'));

router.get('/', (req, res) => {
    res.send("<h1>Hello World</h1>");
})

// Delegate view-routes to their views
// router.use('/', ... )