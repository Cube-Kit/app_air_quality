// Type imports
import { Token } from "../types";
import { QueryResult } from "pg";
// External imports
import { v4 as uuidv4, validate as uuidvalidate } from "uuid";
// Internal imports
import { pool } from "..";
import { checkTokenKeyValidity } from "../utils/input_check_utils";

// Token table
const createTokensTableQuery: string = "CREATE TABLE IF NOT EXISTS tokens (name CHAR(64) PRIMARY KEY, key CHAR(32) UNIQUE NOT NULL)";
const getTokensQuery: string = 'SELECT * FROM tokens';
const getTokenByKeyQuery: string = 'SELECT * FROM tokens WHERE key=$1';
const addTokenQuery: string = "INSERT INTO tokens (name,key) VALUES ($1, $2) RETURNING *";
const deleteTokenQuery: string = "DELETE FROM tokens WHERE key=$1";

export function createTokensTable(): Promise<QueryResult<any>> {
    return pool.query(createTokensTableQuery);
}

export function getTokens(): Promise<Array<Token>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getTokensQuery);

            let tokens: Array<Token> = res.rows;

            tokens.forEach(token => {
                token.name = token.name.trim()
            })

            return resolve(tokens);
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

export function addToken(name: string, key?: string): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        // Check name
        if (name === undefined || !name.trim()) {
            reject("name is undefined or empty");
        }

        if (!key) {
            key = uuidv4().trim().split('-').join('');
        }
        
        try {
            let res: QueryResult = await pool.query(addTokenQuery, [name, key]);
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

export function deleteToken(token: Token): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // Check key
        try {
            checkTokenKeyValidity(token.key);
        } catch(err) {
            return reject(err);
        }
        
        try {
            await pool.query(deleteTokenQuery, [token.key]);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}