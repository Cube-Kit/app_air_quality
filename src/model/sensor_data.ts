// External imports
import format from 'pg-format';
// Internal imports
import { pool } from "../index";
import { checkCubeId, checkTimestampValidity } from "../utils/input_check_utils";

// Sensor data tables
const createDataTableQuery: string = "";
// Get sensor data
const getDataQuery: string = "";
// Persist sensor data
const persistDataQuery: string = "";

export function createSensorDataTable(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            // await pool.query(createDataTableQuery);

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
                "sensorType": row.sensor_type.trim(),
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