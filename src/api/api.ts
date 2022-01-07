// Type imports
import { Router } from "express";
// External imports
import express from "express";
import passport from "passport";
// Internal imports
import { router as setupRouter } from "./setup";

// Export the router
export var router: Router = express.Router();

// Delegate API-routes to their routers
router.use('/setup', setupRouter);