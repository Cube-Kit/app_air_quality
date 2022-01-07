/** 
 * Module for general util methods.
 * 
 * @module
 */

// Type imports
import { Cube, Sensor } from "../types";


/**
 * Extracts the sensor types from an array of [Sensors]{@link types.Sensor}.
 * Can contain duplicates of a sensor type.
 * 
 * @param sensors an array of [Sensors]{@link types.Sensor}
 * 
 * @return an array of sensor types
 */
export function getSensorTypesArray(sensors: Array<Sensor>): Array<string> {
    let sensorTypes: Array<string> = [];

    sensors.forEach(sensor => {
        let type = sensor.type.trim();
        sensorTypes.push(type);
    });

    return sensorTypes;
}

/**
 * Checks if two sensor types are equal.
 * 
 * @param sensor the [Sensor]{@link types.Sensor} to be checked against
 */
export function compareSensorTypes(sensor: Sensor): boolean {
    //this is the sensor whose index in the array is supposed to be found
    //@ts-ignore
    return sensor.type == this.type;
}