// Type imports
import { Actuator, Cube, CubeVariables } from '../types';
import { QueryResult } from 'pg';
// External imports
import format from 'pg-format';
// Internal imports
import { pool } from "../index";
import { checkActuatorArray, checkCubeId } from '../utils/input_check_utils';
import { subscribeCubeMQTTTopics, unsubscribeCubeMQTTTopics } from '../utils/mqtt_utils';

// Base tables
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID PRIMARY KEY, location CHAR(255) NOT NULL)";
// Junction tables
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, values CHAR(64)[] NOT NULL, PRIMARY KEY (cube_id, actuator_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";

// Manage cubes
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
const getCubesWithLocationQuery: string = 'SELECT * FROM cubes WHERE location=$1';
const addCubeQuery: string = "INSERT INTO cubes (id, location) VALUES ($1, $2)";
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';
const clearTableQuery: string = 'DELETE FROM cubes RETURNING *';
// Manage cube actuators
const getCubeActuatorsWithIdQuery: string = 'SELECT * FROM cube_actuators WHERE cube_id=$1';
const addCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type, values) VALUES ($1, $2, $3)";

export async function createCubeTables(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createCubesTableQuery);
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

export function getCubesByLocation(location: string): Promise<Array<Cube>> {
    return new Promise(async (resolve, reject) => {
        //Check input
        try {
            if (location === undefined || !location.trim()) {
                throw(new Error("location is undefined or empty"));
            }
        } catch(err) {
            return reject(err);
        }

        try {
            let res: QueryResult = await pool.query(getCubesWithLocationQuery, [location]);

            let cubes: Array<Cube> = [];
            res.rows.forEach((cube: Cube) => {
                cube.location = cube.location.trim();
                cubes.push(cube);
            });

            resolve(cubes);
        } catch(error) {
            reject(error);
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
            cube.location = cube.location.trim();

            return resolve(cube);
        } catch(err) {
            return reject(err);
        };
    });
}

export async function addCube(cube: Cube): Promise<void> {
    return new Promise(async (resolve, reject) => {
        //Check input
        try {
            checkCubeId(cube.id);
            checkActuatorArray(cube.actuators);
            if (cube.location === undefined || !cube.location.trim()) {
                throw(new Error("location is undefined or empty"));
            }
        } catch(err) {
            return reject(err);
        }
        
        try {
            //Get client
            let client = await pool.connect()

            //Add cube
            await client.query(addCubeQuery, [cube.id, cube.location]);
            //Add actuators to cube
            cube.actuators.forEach(async (actuator: Actuator) => {
                await client.query(addCubeActuatorsQuery, [cube.id, actuator.type, actuator.values])
                            .catch((err: Error) => {
                                reject(err);
                            });
            });

            //Subscribe to cube topic
            await subscribeCubeMQTTTopics([cube.id]);

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
        } catch(err) {
            return reject(err);
        }

        try {
            //Check if cube exists
            await getCubeWithId(cubeId);
            //Update cube location
            await pool.query(format(updateCubeWithIdQuery, 'location', variables.location, cubeId));

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

export function clearCubesTable(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(clearTableQuery);
            console.log("Cleared cubes table");

            let cubes: Array<Cube> = res.rows;
            let cubeIds: Array<string> = [];

            cubes.forEach((cube: Cube) => {
                cubeIds.push(cube.id);
            })

            await unsubscribeCubeMQTTTopics(cubeIds);

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}

export function compareCubes(a: Cube, b:Cube):number {
    return a.location.localeCompare(b.location, undefined, {numeric: true});
}