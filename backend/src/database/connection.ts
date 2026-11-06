import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { env } from '../config/env';

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

const db = new (sqlite3.verbose().Database)(
  env.dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (error) => {
    if (error) {
      console.error('Unable to open SQLite database', error);
      throw error;
    }
  }
);

export type SqlParams = unknown[];

export function dbExec(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => (error ? reject(error) : resolve()));
  });
}

export function dbRun(sql: string, params: SqlParams = []): Promise<{ id: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet<T>(sql: string, params: SqlParams = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row as T | undefined)));
  });
}

export function dbAll<T>(sql: string, params: SqlParams = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve((rows || []) as T[])));
  });
}
