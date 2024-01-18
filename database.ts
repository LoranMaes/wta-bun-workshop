// Some help for the queries with ChatGPT and Bun Docs

import { Database } from "bun:sqlite";
import type { Message } from "./interfaces/User";

const db = new Database(":memory");

export function init() {
  try {
    const query = db.prepare(`CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user TEXT NOT NULL,
              message TEXT NOT NULL,
              filename TEXT NOT NULL,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

    query.run();
    return true;
  } catch (err) {
    return false;
  }
}

export function addUser(message: Message, imageFileName: string) {
  try {
    const query = db.prepare(
      `INSERT INTO messages (user, message, filename) VALUES (?, ?, ?)`,
      [message.name, message.message, imageFileName]
    );
    const add = query.run();
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
}

export function getMessages() {
  try {
    const query = db.prepare(`SELECT * FROM messages`);
    const messages = query.all();
    return messages;
  } catch (err) {
    return [];
  }
}

export function closeDb() {
  db.close();
}
