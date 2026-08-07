import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]');
}

function readUsers() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeUsers(users) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email) {
  return readUsers().find((u) => u.email === email) || null;
}

export function createUser(email, passwordHash) {
  const users = readUsers();
  const user = { email, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  return user;
}
