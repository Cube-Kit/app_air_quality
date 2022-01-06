// Type imports
import {  Router } from "express";
// External imports
import express from "express";
import passport from "passport";
// Internal imports

// Export the router
export var router: Router = express.Router();

// Authenticate token
router.use('/', passport.authenticate('bearer'));

// Delegate view-routes to their views
// router.use('/', ... )