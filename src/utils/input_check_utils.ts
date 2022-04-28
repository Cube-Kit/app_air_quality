/**
 * Module for util methods for checking method input.
 * 
 * @module
 */
// Type imports
import { Actuator } from "../types";
// External imports
import { validate as uuidvalidate } from "uuid";

/**
 * Check validity of the id of a [Cube]{@link types.Cube}
 * 
 * Can not be undefined\
 * Has to be a valid UUID
 * 
 * @param cubeId the id of a [Cube]{@link types.Cube}
 */
 export function checkCubeId(cubeId: string | undefined): void {
    //Check cubeId
    if (cubeId === undefined) {
        throw(new Error("cubeId is undefined"));
    }
    if (!uuidvalidate(cubeId)) {
        throw(new Error("cubeId is not a valid uuid"));
    }
}

/**
 * Check validity of the [Actuators]{@link types.Actuator} of a [Cube]{@link types.Cube}
 * 
 * Array can not be empty or undefined\
 * Each [Actuator]{@link types.Actuator} can not have empty or undefined actuators type or values
 * Each value can not have length 0.
 * 
 * @param sensors the [Sensors]{@link types.Sensor} of a [Cube]{@link types.Cube}
 */
 export function checkActuatorArray(actuators: Array<Actuator>): void {
    if (actuators === undefined) {
        throw(new Error("actuators array is undefined"));
    }

    actuators.forEach((actuator: Actuator) => {
        //Check if sensor type is valid
        if (actuator.type === undefined || !actuator.type.trim()) {
            throw(new Error("actuator type is not valid"));
        }
        //Check if sensor scan_interval is valid
        if (!actuator.values === undefined || actuator.values.length == 0) {
            throw(new Error ("actuator values is undefined or empty."));
        }

        actuator.values.forEach((value: string) => {
            if (value.length === 0) {
                throw(new Error ("an actuator value is empty."));
            }
        })
    });
}

/**
 * Check the validity of a [Tokens]{@link types.Token} token string
 * 
 * Can not be undefined\
 * Has to be of length 32 (36 - 4 dashes)\
 * Has to be a valid UUID if dashes are added back into it
 * 
 * @param token the [Tokens]{@link types.Token} token string to be checked
 */
export function checkTokenKeyValidity(token: string): void {
    // Check if token is defined
    if (token === undefined) {
        throw(new Error("token is undefined"));
    }
    // Check length
    if (token.length != 32) {
        throw(new Error("token has to have length of 32"));
    }

    // Create uuid from token
    let uuid: string = token.slice(0, 8) + "-" + token.slice(8, 12)
                        + "-" + token.slice(12, 16) + "-" + token.slice(16, 20)
                        + "-" + token.slice(20, 32);
    // Check if valid uuid
    if (!uuidvalidate(uuid)) {
        throw(new Error("token structure is not valid"));
    }
}

/**
 * Check the validity of a timestamp
 * 
 * Has to be formatted according to [RFC2822]{@link https://datatracker.ietf.org/doc/html/rfc2822#page-14}
 * or [ISO8601]{@link https://www.iso.org/iso-8601-date-and-time-format.html}
 */
 export function checkTimestampValidity(timestamp: string): void {
    let date = new Date(timestamp);
    
    if (date.toString() === "Invalid Date") {
        throw(new Error("The timestamp has an incorrect format"));
    }
}