// Type imports
import { Cube, CubeVariables, Sensor } from '../types';
import { QueryResult } from 'pg';
// External imports
import format from 'pg-format';
import { v4 as uuidv4 } from "uuid";
// Internal imports
import { pool } from "../index";
import { checkCubeId, checkSensorArray } from '../utils/input_check_utils';
import { compareSensorTypes, getSensorTypesArray } from "../utils/general_utils";
import { subscribeCubeMQTTTopic } from '../utils/mqtt_utils';

// Base tables
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID PRIMARY KEY, location CHAR(255) NOT NULL)";
// Junction tables
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, scan_interval NUMERIC NOT NULL, PRIMARY KEY (cube_id, sensor_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, PRIMARY KEY (cube_id, actuator_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";

// Manage cubes
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
const addCubeQuery: string = "INSERT INTO cubes (id, location) VALUES ($1, $2)";
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';
// Manage cube sensors/actuators
const getCubeSensorsWithIdQuery: string = 'SELECT * FROM cube_sensors WHERE cube_id=$1';
const addCubeSensorsQuery: string = "INSERT INTO cube_sensors (cube_id, sensor_type, scan_interval) VALUES ($1, $2, $3)";
const updateCubeSensorsQuery: string = "UPDATE cube_sensors SET scan_interval=$3 WHERE cube_id=$1 AND sensor_type=$2";
const getCubeActuatorsWithIdQuery: string = 'SELECT * FROM cube_actuators WHERE cube_id=$1';
const addCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type) VALUES ($1, $2)";

export async function createCubeTables(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createCubesTableQuery);
            await pool.query(createCubeSensorsTableQuery);
            await pool.query(createCubeActuatorsTableQuery);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

export function getCubes(): Promise<Array<Cube>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getCubesQuery);

            let cubes: Array<Cube> = [];

            res.rows.forEach((row) => {
                let cube = row;
                cube.location = row.location.trim();

                cubes.push(cube);
            })

            return resolve(cubes);
        } catch(err) {
            return reject(err);
        }
    });
}

export function getCubeWithId(cubeId: string): Promise<Cube> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        try {
            checkCubeId(cubeId);
        } catch(err) {
            return reject(err);
        }

        try {
            let res: QueryResult = await pool.query(getCubeWithIdQuery, [cubeId]);

            if (res.rows.length == 0) {
                reject(new Error("no cube with specified id found"));
            }

            let cube: Cube = res.rows[0];
            cube.ip = cube.ip.trim();
            cube.location = cube.location.trim();

            let sensors: Array<Sensor> = await getCubeSensors(cubeId);
            cube.sensors = sensors;

            let actuators: Array<string> = await getCubeActuators(cubeId);
            cube.actuators = actuators;

            return resolve(cube);
        } catch(err) {
            return reject(err);
        };
    });
}

async function getCubeSensors(cubeId: string): Promise<Array<Sensor>> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        try {
            checkCubeId(cubeId);
        } catch(err) {
            return reject(err);
        }

        try {
            let sensors: Array<Sensor> = [];
            let res: QueryResult = await pool.query(getCubeSensorsWithIdQuery, [cubeId]);

            res.rows.forEach((sensor) => {
                sensors.push({
                    type: sensor.sensor_type.trim(),
                    scanInterval: parseInt(sensor.scan_interval)
                });
            })

            return resolve(sensors)
        } catch(err) {
            return reject(err);
        }
    });
}

async function getCubeActuators(cubeId: string): Promise<Array<string>> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        try {
            checkCubeId(cubeId);
        } catch(err) {
            return reject(err);
        }
        
        try {
            let actuators: Array<string> = [];
            let res: QueryResult = await pool.query(getCubeActuatorsWithIdQuery, [cubeId]);

            res.rows.forEach((value) => {
                actuators.push(value.actuator_type.trim());
            })

            return resolve(actuators)
        } catch(err) {
            return reject(err);
        }
    });
}

export async function addCube(cubeId: string, location: string, sensors: Array<Sensor>, actuators: Array<string>): Promise<void> {
    return new Promise(async (resolve, reject) => {
        //Check input
        try {
            checkCubeId(cubeId);
            if (location === undefined || !location.trim()) {
                throw(new Error("location is undefined or empty"));
            }
            checkSensorArray(sensors);
            if (actuators === undefined || actuators.length == 0) {
                throw(new Error("actuators array is undefined or empty"));
            }
        } catch(err) {
            return reject(err);
        }
        
        try {
            //Get client
            let client = await pool.connect()

            //Add cube
            await client.query(addCubeQuery, [cubeId, location]);

            //Add sensors to cube
            sensors.forEach(async (sensor: Sensor) => {
                await client.query(addCubeSensorsQuery, [cubeId, sensor.type, sensor.scanInterval])
                            .catch((err: Error) => {
                                reject(err);
                            });
            })

            //Add actuators to cube
            actuators.forEach(async (value: string) => {
                await client.query(addCubeActuatorsQuery, [cubeId, value])
                            .catch((err: Error) => {
                                reject(err);
                            });
            });

            //Subscribe to cube topic
            await subscribeCubeMQTTTopic(cubeId, 2);

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}

export function updateCubeWithId(cubeId: string, variables: CubeVariables): Promise<Cube> {
    return new Promise(async (resolve, reject) => {
        //Check input
        try {
            checkCubeId(cubeId);
            if (variables.location === undefined || !variables.location.trim()) {
                throw(new Error("location is undefined or empty"));
            }
            checkSensorArray(variables.sensors);
            if (variables.actuators === undefined || variables.actuators.length == 0) {
                throw(new Error("actuators array is undefined or empty"));
            }
        } catch(err) {
            return reject(err);
        }

        try {
            //Check if cube exists
            await getCubeWithId(cubeId);
            //Update cube location
            await pool.query(format(updateCubeWithIdQuery, 'location', variables.location, cubeId));

            let old_sensors: Array<Sensor> = await getCubeSensors(cubeId);
            let old_sensor_types: Array<string> = getSensorTypesArray(old_sensors);
            let new_sensors: Array<Sensor> = variables.sensors;

            new_sensors.forEach(async (sensor: Sensor) => {
                //Check if sensor type exists for this cube
                if (!old_sensor_types.includes(sensor.type)) {
                    throw(new Error("sensor type does not exist on this cube"));
                }

                //Update scan interval, if it was changed
                let sensors_index = old_sensors.findIndex(compareSensorTypes,sensor);
                if (old_sensors[sensors_index].scanInterval != sensor.scanInterval) {
                    //Persist to database
                    await pool.query(updateCubeSensorsQuery, [cubeId, sensor.type, sensor.scanInterval]);
                }
            });

            return resolve(getCubeWithId(cubeId));
        } catch(err) {
            return reject(err);
        }
    });
}

export function deleteCubeWithId(cubeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        //Check cubeId
        checkCubeId(cubeId);

        try {
            pool.query(deleteCubeWithIdQuery, [cubeId]);

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}