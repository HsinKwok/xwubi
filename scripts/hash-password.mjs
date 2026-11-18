import { pbkdf2Sync, randomBytes } from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('用法: node scripts/hash-password.mjs <password>');
  process.exit(1);
}

const iterations = 210000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');

const b64url = (buffer) =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

console.log(`pbkdf2$sha256$${iterations}$${b64url(salt)}$${b64url(hash)}`);
