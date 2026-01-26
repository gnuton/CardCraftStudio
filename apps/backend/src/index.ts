import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try multiple locations for .env
const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../../.env'), // Monorepo Root
];

let loaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`[Environment] Detected and loaded: ${envPath}`);
        loaded = true;
        break;
    }
}

if (!loaded) {
    console.warn('[Environment] No .env file found. Expected at one of:', envPaths);
}

console.log('Starting application...');
console.log('Checking configuration...');
console.log('- Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Detected' : 'MISSING');
const secret = process.env.GOOGLE_CLIENT_SECRET;
const isSecretValid = secret && secret !== 'PASTE_YOUR_SECRET_HERE';
console.log('- Google Client Secret:', isSecretValid ? 'Detected' : 'MISSING or INVALID');

import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 8080;

app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
