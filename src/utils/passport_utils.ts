/**
 * Module for authentication related util methods.
 * 
 * @module
 */

// Type imports
import { Token } from "../types";
// External imports
import passport from "passport";
import { Strategy as HttpBearerStrategy } from "passport-http-bearer";
// Internal imports
import { getTokenByKey } from "../model/token";

/**
 * Setup the passport strategies and de-/serialization methods.
 */
export async function setupPassport():Promise<void> {

    /**
     * Use httpbearer strategy (token)
     */
    passport.use(new HttpBearerStrategy((token, done) => {
        getTokenByKey(token)
            .then(async (tokenObj: null | Token) => {
                // Check if token object returned
                if (!tokenObj) {
                    return done(null, false, {message: 'Token existiert nicht', scope: 'all'});
                }

                // Return tokenObj if all is correct
                return done(null, tokenObj);
            })
            .catch((err: Error) => {
                return done(err);
            });

    }));
}