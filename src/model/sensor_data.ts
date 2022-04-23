// External imports
import format from 'pg-format';
// Internal imports
import { pool } from "../index";
import { checkCubeId, checkTimestampValidity } from "../utils/input_check_utils";
import { publishActuatorAction } from '../utils/mqtt_utils';
import { qualityThresholds } from '../views/views';
import { Cube } from "../types";
import { addCube, deleteCubeWithId, getCubes, updateCubeWithId } from "../model/cube";

// Sensor data tables
const createDataTableQuery: string = "CREATE TABLE IF NOT EXISTS data (id SERIAL PRIMARY KEY, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE)";
// Get sensor data
const getDataQuery: string = "SELECT * FROM data";
// Persist sensor data
const persistDataQuery: string = "INSERT INTO data (cube_id, timestamp, data) VALUES ($1, $2, $3)";
// Clear sensor data
const clearTableQuery: string = "DELETE FROM data";

export var lastIAQValues: any = new Object();
  
const ledColors: Array<number> = (process.env.LEDColors || "85 50 0").
    split(" ").map(string => {
        return parseInt(string);
    });

export function createSensorDataTable(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createDataTableQuery);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

export function getSensorData(cubeId?: string, start?: string, end?: string): Promise<Array<Object>> {
    return new Promise(async (resolve, reject) => {
        let selectors: string = "";
        let whereAdded: boolean = false;

        // Add parameters to selectors
        if (cubeId !== undefined) {
            // Check if id is valid
            try {
                checkCubeId(cubeId);
            } catch(err) {
                return reject(err);
            }

            // Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            // Add selectors statement
            selectors = format(selectors + " %I=%L","cube_id", cubeId);
        }
        if (start !== undefined) {
            // Check that the timestamp is valid
            try {
                checkTimestampValidity(start);
            } catch(err) {
                return reject("start does not have the correct format");
            }
            // Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            let startTimestamp: Date = new Date(start);
            // Add selectors statement
            selectors = format(selectors + " %I>=timestamp %L","timestamp", startTimestamp);
        }
        if (end !== undefined) {
            // Check that the timestamp is valid
            try {
                checkTimestampValidity(end);
            } catch(err) {
                return reject("end does not have the correct format");
            }
            // Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            let endTimestamp: Date = new Date(end);
            // Add selectors statement
            selectors = format(selectors + " %I<=timestamp %L","timestamp", endTimestamp);
        }

        // Check that start and end are in correct order
        if (start !== undefined && end !== undefined) {
            let startDate: Date = new Date(start);
            let endDate: Date = new Date(end);
            if (startDate > endDate) {
                return reject("start date is after the end date");
            }
        }
        
        let res_rows;
        try {
            res_rows = await (await pool.query(getDataQuery+selectors)).rows;
        } catch(err) {
            return reject(err);
        }

        let sensor_data: Array<Object> = [];

        res_rows.forEach((row) => {

            if (typeof row.data == "string") {
                row.data = row.data.trim();
            }

            sensor_data.push({
                "cubeId": row.cube_id,
                "timestamp": row.timestamp.toLocaleString(),
                "data": row.data,
            });
        });

        return resolve(sensor_data);
    });
}

export function persistSensorData(cubeId: string, data: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // Check input
        try {
            checkCubeId(cubeId);
            if (data === undefined || !data.trim()) {
                throw new Error("data is undefined or empty");
            }
        } catch (err) {
            return reject(err);
        }
        
        try {
            let timestamp: Date = new Date();

            await pool.query(persistDataQuery, [cubeId, timestamp, data]);

            return resolve();
        } catch (err) {
            return reject(err);
        }
    });
}

export function clearDataTable(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            pool.query(clearTableQuery);
            console.log("Cleared data table");

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}


export function triggerLedActuator(cubeId: string, cubeLocation: string, data: string): Promise<void>{
    return new Promise((resolve, reject) => {
        try {
            checkCubeId(cubeId);
            if (data === undefined || !data.trim()) {
                throw new Error("data is undefined or empty");
            }
            if (lastIAQValues[cubeId] == undefined) {
                throw new Error("cubeId doesn't exist");
            }
        } catch (err) {
            return reject(err);
        }
        try {
            if (!(lastIAQValues[cubeId].lastIAQValues.length < 10)) {
                lastIAQValues[cubeId].lastIAQValues.shift();
            }
            lastIAQValues[cubeId].lastIAQValues.push(Number(data));

            
            var sum = 0;
            for( var i = 0; i < lastIAQValues[cubeId].lastIAQValues.length; i++ ){
                sum += parseInt( lastIAQValues[cubeId].lastIAQValues[i], 10 );
            }

            var avg = sum/lastIAQValues[cubeId].lastIAQValues.length;

            var color = 0

            for( var i = 0; i < qualityThresholds.length; i++) {
                if (avg <= qualityThresholds[i]) {
                    color = ledColors[i];
                    break;
                }
            }

            //TODO check if this works
            publishActuatorAction(cubeLocation, cubeId, "led000", color, "hue");
            publishActuatorAction(cubeLocation, cubeId, "led000", 255, "val");
            publishActuatorAction(cubeLocation, cubeId, "led000", 255, "sat");

            
            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}

export async function setupIAQValues(): Promise<void> {
    return new Promise(async (resolve, reject) => {

        console.log("setting up iaq variables");

        // Subscribe to sensor data of existing cubes
        let cubes: Cube[] = await getCubes();
        let ids: string[] = cubes.map((cube: Cube) => cube.id);
        ids.forEach(id => {
            lastIAQValues[id] = {"lastIAQValues": [], "currentLEDColor": 0};
        });
        return resolve();
    });
} 