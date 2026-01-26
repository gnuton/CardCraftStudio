import dotenv from 'dotenv';
dotenv.config();

console.log('Starting application...');
console.log('Checking configuration...');
console.log('- Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Detected' : 'MISSING');
const secret = process.env.GOOGLE_CLIENT_SECRET;
const isSecretValid = secret && secret !== 'PASTE_YOUR_SECRET_HERE';
console.log('- Google Client Secret:', isSecretValid ? 'Detected' : 'MISSING or INVALID (Still says PASTE_YOUR_SECRET_HERE)');

import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 8080;

app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
