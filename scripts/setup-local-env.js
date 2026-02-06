#!/usr/bin/env node

/**
 * Interactive Local Environment Setup Script
 * 
 * This script helps you configure your local development environment by:
 * - Prompting for all required environment variables
 * - Generating random keys where needed
 * - Creating .env files for both backend and frontend
 * - Providing guidance on obtaining credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${prompt}${colors.reset}`, resolve);
    });
}

function generateRandomKey(length = 32) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}

async function promptWithDefault(prompt, defaultValue, secret = false) {
    const displayDefault = secret && defaultValue ? '***' : defaultValue;
    const answer = await question(`${prompt}${defaultValue ? ` [${displayDefault}]` : ''}: `);
    return answer.trim() || defaultValue;
}

async function confirmAction(prompt) {
    const answer = await question(`${prompt} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

function displaySection(title) {
    log('\n' + '='.repeat(60), 'bright');
    log(title, 'bright');
    log('='.repeat(60), 'bright');
}

function displayInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function displaySuccess(message) {
    log(`✅ ${message}`, 'green');
}

function displayWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function displayError(message) {
    log(`❌ ${message}`, 'red');
}

async function getGoogleCloudCredentials() {
    displaySection('Google Cloud Configuration');

    displayInfo('You need to set up a Google Cloud Project with the following:');
    console.log('  1. Create a project at https://console.cloud.google.com/');
    console.log('  2. Enable required APIs (Drive, Firestore, Custom Search, AI Platform)');
    console.log('  3. Create OAuth 2.0 credentials');
    console.log('  4. Create a service account and download the JSON key');
    console.log('  5. Set up Custom Search Engine at https://programmablesearchengine.google.com/');
    console.log('');

    const projectId = await promptWithDefault('Google Cloud Project ID', 'cardcraft-studio-485208');
    const apiKey = await promptWithDefault('Google API Key (for Custom Search & AI)', '', true);
    const searchCx = await promptWithDefault('Google Custom Search Engine ID', '', true);
    const serviceAccountPath = await promptWithDefault('Path to Service Account JSON', './serviceAccountKey.json');

    return { projectId, apiKey, searchCx, serviceAccountPath };
}

async function getGoogleOAuthCredentials() {
    displaySection('Google OAuth Configuration (for Drive Sync)');

    displayInfo('Create OAuth 2.0 Client ID at:');
    console.log('  https://console.cloud.google.com/apis/credentials');
    console.log('');
    displayInfo('Add these Authorized JavaScript origins:');
    console.log('  - http://localhost:5173');
    console.log('  - https://yourusername.github.io');
    console.log('');
    displayInfo('Add these Authorized redirect URIs:');
    console.log('  - http://localhost:5173/oauth-callback.html');
    console.log('  - https://yourusername.github.io/CardCraftStudio/oauth-callback.html');
    console.log('');

    const clientId = await promptWithDefault('Google OAuth Client ID', '', true);
    const clientSecret = await promptWithDefault('Google OAuth Client Secret', '', true);
    const redirectUri = await promptWithDefault('OAuth Redirect URI (local)', 'http://localhost:5173/oauth-callback.html');

    return { clientId, clientSecret, redirectUri };
}

async function getSecurityKeys() {
    displaySection('Security Configuration');

    displayInfo('Generating random encryption keys...');
    const tokenKey = generateRandomKey(32);
    const jwtSecret = generateRandomKey(64);

    displaySuccess('Generated TOKEN_ENCRYPTION_KEY');
    displaySuccess('Generated JWT_SECRET');

    return { tokenKey, jwtSecret };
}

async function getServerConfig() {
    displaySection('Server Configuration');

    const port = await promptWithDefault('Backend Port', '3001');
    const allowedOrigins = await promptWithDefault('Allowed CORS Origins', 'http://localhost:5173,http://localhost:4173');

    return { port, allowedOrigins };
}

async function getStripeConfig() {
    displaySection('Stripe Configuration (Optional - for Premium Features)');

    displayInfo('Get your Stripe credentials at: https://dashboard.stripe.com/apikeys');
    console.log('');

    const hasStripe = await confirmAction('Do you want to configure Stripe now?');

    if (!hasStripe) {
        displayWarning('Skipping Stripe configuration. Premium features will not work.');
        return { secretKey: '', webhookSecret: '', priceId: '' };
    }

    const secretKey = await promptWithDefault('Stripe Secret Key', '', true);
    const webhookSecret = await promptWithDefault('Stripe Webhook Secret', '', true);
    const priceId = await promptWithDefault('Stripe Price ID', '', true);

    return { secretKey, webhookSecret, priceId };
}

async function getAdminConfig() {
    displaySection('Admin Configuration');

    displayInfo('The email you specify will be granted admin privileges on first login.');
    const adminEmail = await promptWithDefault('Admin Bootstrap Email', 'your.email@example.com');

    return { adminEmail };
}

function createBackendEnv(config) {
    const envContent = `# Google API Credentials (for Image Search & Generation)
GOOGLE_API_KEY=${config.google.apiKey}
GOOGLE_CUSTOM_SEARCH_CX=${config.google.searchCx}
GOOGLE_CLOUD_PROJECT=${config.google.projectId}
GOOGLE_APPLICATION_CREDENTIALS=${config.google.serviceAccountPath}

# Google OAuth Credentials (for GDrive Sync)
# Get these from Google Cloud Console > Credentials > OAuth 2.0 Client IDs
GOOGLE_CLIENT_ID=${config.oauth.clientId}
GOOGLE_CLIENT_SECRET=${config.oauth.clientSecret}

# The redirect URI must match exactly what is configured in Google Cloud Console
# and what the frontend sends.
GOOGLE_REDIRECT_URI=${config.oauth.redirectUri}

# Security
# Random string for encrypting refresh tokens stored on the client
TOKEN_ENCRYPTION_KEY=${config.security.tokenKey}
JWT_SECRET=${config.security.jwtSecret}

# Server Configuration
PORT=${config.server.port}
ALLOWED_ORIGINS=${config.server.allowedOrigins}

# Stripe (for Premium Subscriptions)
STRIPE_SECRET_KEY=${config.stripe.secretKey}
STRIPE_WEBHOOK_SECRET=${config.stripe.webhookSecret}
STRIPE_PRICE_ID=${config.stripe.priceId}

# Admin Configuration
# Email address that will be automatically granted admin status on first login
ADMIN_BOOTSTRAP_EMAIL=${config.admin.adminEmail}
`;

    const backendEnvPath = path.join(__dirname, '..', 'apps', 'backend', '.env');
    fs.writeFileSync(backendEnvPath, envContent);
    displaySuccess(`Created ${backendEnvPath}`);
}

function createFrontendEnv(config) {
    const envContent = `# Google Client ID (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=${config.oauth.clientId}

# Backend API URL
VITE_API_BASE_URL=http://localhost:${config.server.port}
`;

    const frontendEnvPath = path.join(__dirname, '..', 'apps', 'web', '.env');
    fs.writeFileSync(frontendEnvPath, envContent);
    displaySuccess(`Created ${frontendEnvPath}`);
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║     CardCraft Studio - Local Environment Setup            ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝', 'bright');

    displayInfo('This script will help you configure your local development environment.');
    displayWarning('You will need credentials from Google Cloud Console and Stripe.');
    console.log('');

    const proceed = await confirmAction('Do you want to continue?');
    if (!proceed) {
        displayWarning('Setup cancelled.');
        rl.close();
        return;
    }

    try {
        const config = {
            google: await getGoogleCloudCredentials(),
            oauth: await getGoogleOAuthCredentials(),
            security: await getSecurityKeys(),
            server: await getServerConfig(),
            stripe: await getStripeConfig(),
            admin: await getAdminConfig()
        };

        displaySection('Creating Environment Files');

        createBackendEnv(config);
        createFrontendEnv(config);

        displaySection('Setup Complete! 🎉');

        displaySuccess('Your local environment is configured!');
        console.log('');
        displayInfo('Next steps:');
        console.log('  1. Make sure your service account JSON file is at the correct path');
        console.log('  2. Run: npm install');
        console.log('  3. Run: npm run dev');
        console.log('');
        displayInfo('For cloud deployment, run: npm run setup:cloud-env');
        displayInfo('For GitHub Actions setup, run: npm run setup:github-secrets');
        console.log('');
        displayInfo('Full documentation: docs/SETUP.md');

    } catch (error) {
        displayError(`Setup failed: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
