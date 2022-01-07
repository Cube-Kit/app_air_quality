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
import { getTokenByKey, getAppToken } from "../model/token";

/**
 * Setup the passport strategies and de-/serialization methods.
 */
export async function setupPassport():Promise<void> {

    /**
     * Use httpbearer strategy (token)
     */
    passport.use(new HttpBearerStrategy((token, done) => {
        getTokenByKey(token)
            .then(async (token: Token) => {
                // Return token
                return done(null, token);
            })
            .catch((err: Error) => {
                return done(null, false, {message: 'Token existiert nicht', scope: 'all'});
            });

    }));

    /**
     * Get name from token
     */
    passport.serializeUser((token, done) => {
        //Seems to be a bug in the @types/passport package
        //Where the standard user does not have an ID, but is required to have an id in this method
        //@ts-ignore
        done(null, token.name);
    });

    /**
     * Get user from name
     */
    passport.deserializeUser(async (name: string, done) => {

        getAppToken()
            .then((token: Token) => {

                done(null, token);
            })
            .catch((err: Error) => {
                done(err, null);
            });
    });
}