// Type imports
import { Token } from "../types";
import { QueryResult } from "pg";
// External imports
import { v4 as uuidv4 } from "uuid";
// Internal imports
import { pool } from "..";
import { checkTokenKeyValidity } from "../utils/input_check_utils";

// Token table
const createTokensTableQuery: string = "CREATE TABLE IF NOT EXISTS tokens (name CHAR(64) PRIMARY KEY, key CHAR(32) UNIQUE NOT NULL, created TIMESTAMPTZ NOT NULL, ttl INTEGER NOT NULL)";
const getTokenByNameQuery: string = 'SELECT * FROM tokens WHERE name=$1';
const getTokenByKeyQuery: string = 'SELECT * FROM tokens WHERE key=$1';
const addTokenQuery: string = "INSERT INTO tokens (name,key,created,ttl) VALUES ($1, $2, $3, $4) RETURNING *";
const deleteTokenByKeyQuery: string = "DELETE FROM tokens WHERE key=$1";
const deleteTokenByNameQuery: string = "DELETE FROM tokens WHERE name=$1";
const clearTableQuery: string = "DELETE FROM tokens";

export function createTokensTable(): Promise<QueryResult<any>> {
    return pool.query(createTokensTableQuery);
}

export function checkForServerToken(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            let serverRes: QueryResult = await pool.query(getTokenByNameQuery, ["server"]);

            if (serverRes.rows.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch(error) {
            reject(error);
        }
    });
}

export function getAppToken(): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await pool.query(getTokenByNameQuery, ["app"]);
            // If there is no token, reject
            if (!res.rows) {
                return reject("no token with this name found");
            }

            // Return token
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

export function getTokenByKey(key: string): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        // Check key
        try {
            checkTokenKeyValidity(key);
        } catch(err) {
            return reject(err);
        }

        try {
            let res = await pool.query(getTokenByKeyQuery, [key]);

            // If there is no token, reject
            if (!res.rows) {
                return reject("no token with this key found");
            }

            // Return token
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

export function addToken(name: string, ttl?: number, key?: string): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        // Check name
        if (name === undefined || !name.trim()) {
            reject("name is undefined or empty");
        }

        key = key ?? uuidv4().trim().split('-').join('');
        ttl = ttl ?? 0;

        let created: Date = new Date();
        
        try {
            let res: QueryResult = await pool.query(addTokenQuery, [name, key, created, ttl]);
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

export async function addAppToken(): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        let app_token: Token;
        try {
            app_token = await addToken("app");
            return resolve(app_token);
        } catch (error) {
            if ((error as Error).message.includes("duplicate key value violates unique constraint")) {
                await deleteTokenByName("app");
                app_token = await addAppToken();
                return resolve(app_token);;
            } else {
                console.log(error);
            }
        }
    });
}

export function deleteTokenByKey(key: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // Check key
        try {
            checkTokenKeyValidity(key);
        } catch(err) {
            return reject(err);
        }
        
        try {
            await pool.query(deleteTokenByKeyQuery, [key]);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

export function deleteTokenByName(name: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // Check name
        try {
            if(name === undefined) {
                throw new Error("name is undefined");
            }
        } catch(err) {
            return reject(err);
        }
        
        try {
            await pool.query(deleteTokenByNameQuery, [name]);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

export function clearTokensTable(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            pool.query(clearTableQuery);
            console.log("Cleared tokens table");

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}