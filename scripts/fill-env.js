#!/usr/bin/env node

/**
 * Auto-Fill Environment Variables from Google Cloud
 * 
 * This script automatically detects missing environment variables and fills them
 * by fetching values from Google Cloud resources:
 * - GOOGLE_API_KEY: Fetches or creates an API key
 * - GOOGLE_CUSTOM_SEARCH_CX: Lists available search engines
 * - GOOGLE_CLOUD_PROJECT: Uses active gcloud project
 * - GOOGLE_CLIENT_ID/SECRET: Lists OAuth credentials
 * 
 * Usage:
 *   npm run fill-env           # Interactive mode
 *   npm run fill-env -- --auto # Auto-fill mode (non-interactive)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function execCommand(command, options = {}) {
    try {
        const result = execSync(command, {
            encoding: 'utf-8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        return result ? result.trim() : '';
    } catch (error) {
        if (!options.ignoreError) {
            throw error;
        }
        return '';
    }
}

function checkGcloudAuth() {
    try {
        const account = execCommand('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { silent: true });
        return !!account;
    } catch (error) {
        return false;
    }
}

function getActiveProject() {
    try {
        return execCommand('gcloud config get-value project', { silent: true });
    } catch (error) {
        return null;
    }
}

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return env;
}

function writeEnvFile(filePath, envVars) {
    const lines = [];
    const existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    const existingLines = existingContent.split('\n');

    // Preserve comments and structure
    const processedKeys = new Set();

    for (const line of existingLines) {
        const trimmed = line.trim();

        // Keep comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
            lines.push(line);
            continue;
        }

        // Parse key=value
        const [key] = trimmed.split('=');
        if (key && envVars.hasOwnProperty(key.trim())) {
            const keyName = key.trim();
            lines.push(`${keyName}=${envVars[keyName]}`);
            processedKeys.add(keyName);
        } else {
            lines.push(line);
        }
    }

    // Add any new keys that weren't in the original file
    for (const [key, value] of Object.entries(envVars)) {
        if (!processedKeys.has(key)) {
            lines.push(`${key}=${value}`);
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'));
}

async function getSecretValue(projectId, secretName) {
    try {
        const value = execCommand(
            `gcloud secrets versions access latest --secret="${secretName}" --project=${projectId}`,
            { silent: true, ignoreError: true }
        );
        return value || null;
    } catch (error) {
        return null;
    }
}

async function getOrCreateApiKey(projectId, autoMode = false) {
    displayInfo('Checking for existing API keys...');

    // 1. Try to fetch from Secret Manager first (prod pattern)
    const secretKey = await getSecretValue(projectId, 'google-api-key');
    if (secretKey) {
        displaySuccess('Found GOOGLE_API_KEY in Secret Manager');
        return secretKey;
    }

    try {
        // 2. Try to list via gcloud services
        const keysJson = execCommand(
            `gcloud alpha services api-keys list --project=${projectId} --format=json`,
            { silent: true, ignoreError: true }
        );

        if (keysJson) {
            const keys = JSON.parse(keysJson);
            if (keys && keys.length > 0) {
                const key = keys[0];
                const keyString = execCommand(
                    `gcloud alpha services api-keys get-key-string ${key.name.split('/').pop()} --project=${projectId} --format="value(keyString)"`,
                    { silent: true, ignoreError: true }
                );
                if (keyString) {
                    displaySuccess(`Found existing API key: ${key.displayName || key.name}`);
                    return keyString;
                }
            }
        }
    } catch (error) {
        // Fallback to manual/creation
    }

    if (autoMode) return null;
    const create = await question('No API key found. Create a new one? (y/n): ');
    if (create.toLowerCase() !== 'y') return null;

    try {
        displayInfo('Creating new API key...');
        const result = execCommand(`gcloud alpha services api-keys create --display-name="cardcraft-api-key" --project=${projectId} --format=json`, { silent: true });
        const keyId = JSON.parse(result).name.split('/').pop();
        execSync('sleep 5');
        return execCommand(`gcloud alpha services api-keys get-key-string ${keyId} --project=${projectId} --format="value(keyString)"`, { silent: true });
    } catch (error) {
        return null;
    }
}

async function getCustomSearchEngineId(projectId, autoMode = false) {
    displayInfo('Checking for Custom Search Engine ID...');

    // 1. Try Secret Manager
    const cx = await getSecretValue(projectId, 'google-search-cx');
    if (cx) {
        displaySuccess('Found GOOGLE_CUSTOM_SEARCH_CX in Secret Manager');
        return cx;
    }

    displayWarning('Custom Search Engine IDs are not directly retrievable via standard gcloud commands.');
    displayInfo('If you have already created one, please paste it below.');
    if (autoMode) return null;
    const input = await question('Enter Search Engine ID (or Enter to skip): ');
    return input.trim() || null;
}

async function getOAuthCredentials(projectId, autoMode = false) {
    displayInfo('Checking for OAuth Credentials...');

    const clientId = await getSecretValue(projectId, 'google-client-id');
    const clientSecret = await getSecretValue(projectId, 'google-client-secret');

    if (clientId && clientSecret) {
        displaySuccess('Found OAuth Credentials in Secret Manager');
        return { clientId, clientSecret };
    }

    if (autoMode) return { clientId: null, clientSecret: null };
    const id = await question('Enter OAuth Client ID (or Enter to skip): ');
    const secret = id ? await question('Enter OAuth Client Secret: ') : null;
    return { clientId: id || null, clientSecret: secret || null };
}


async function fillBackendEnv(autoMode = false) {
    const envPath = path.join(__dirname, '..', 'apps', 'backend', '.env');

    displaySection('Backend Environment (.env)');

    if (!fs.existsSync(envPath)) {
        displayWarning('Backend .env file not found. Creating from .env.example...');
        const examplePath = path.join(__dirname, '..', 'apps', 'backend', '.env.example');
        if (fs.existsSync(examplePath)) {
            fs.copyFileSync(examplePath, envPath);
            displaySuccess('Created .env from .env.example');
        } else {
            displayError('.env.example not found!');
            return;
        }
    }

    const env = parseEnvFile(envPath);
    const updates = {};
    const missing = [];

    // Check which variables are missing or empty
    const requiredVars = [
        'GOOGLE_API_KEY',
        'GOOGLE_CUSTOM_SEARCH_CX',
        'GOOGLE_CLOUD_PROJECT',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
    ];

    for (const varName of requiredVars) {
        if (!env[varName] || env[varName] === '' || env[varName].includes('your_') || env[varName].includes('_here')) {
            missing.push(varName);
        }
    }

    if (missing.length === 0) {
        displaySuccess('All required environment variables are already set!');
        return;
    }

    displayInfo(`Found ${missing.length} missing or empty variables: ${missing.join(', ')}`);
    console.log('');

    // Get active project
    const projectId = getActiveProject();
    if (!projectId) {
        displayError('No active gcloud project found!');
        displayInfo('Run: gcloud config set project YOUR_PROJECT_ID');
        return;
    }

    displaySuccess(`Using project: ${projectId}`);

    // Fill GOOGLE_CLOUD_PROJECT
    if (missing.includes('GOOGLE_CLOUD_PROJECT')) {
        updates.GOOGLE_CLOUD_PROJECT = projectId;
        displaySuccess(`Set GOOGLE_CLOUD_PROJECT=${projectId}`);
    }

    // Fill GOOGLE_API_KEY
    if (missing.includes('GOOGLE_API_KEY')) {
        const apiKey = await getOrCreateApiKey(projectId, autoMode);
        if (apiKey) {
            updates.GOOGLE_API_KEY = apiKey;
            displaySuccess('Set GOOGLE_API_KEY');
        } else {
            displayWarning('GOOGLE_API_KEY not set (manual setup required)');
        }
    }

    // Fill GOOGLE_CUSTOM_SEARCH_CX
    if (missing.includes('GOOGLE_CUSTOM_SEARCH_CX')) {
        const cx = await getCustomSearchEngineId(projectId, autoMode);
        if (cx) {
            updates.GOOGLE_CUSTOM_SEARCH_CX = cx;
            displaySuccess('Set GOOGLE_CUSTOM_SEARCH_CX');
        } else {
            displayWarning('GOOGLE_CUSTOM_SEARCH_CX not set (manual setup required)');
        }
    }

    // Fill OAuth credentials
    if (missing.includes('GOOGLE_CLIENT_ID') || missing.includes('GOOGLE_CLIENT_SECRET')) {
        const oauth = await getOAuthCredentials(projectId, autoMode);
        if (oauth.clientId) {
            updates.GOOGLE_CLIENT_ID = oauth.clientId;
            displaySuccess('Set GOOGLE_CLIENT_ID');
        } else {
            displayWarning('GOOGLE_CLIENT_ID not set (manual setup required)');
        }
        if (oauth.clientSecret) {
            updates.GOOGLE_CLIENT_SECRET = oauth.clientSecret;
            displaySuccess('Set GOOGLE_CLIENT_SECRET');
        } else {
            displayWarning('GOOGLE_CLIENT_SECRET not set (manual setup required)');
        }
    }

    // Write updates
    if (Object.keys(updates).length > 0) {
        const mergedEnv = { ...env, ...updates };
        writeEnvFile(envPath, mergedEnv);
        displaySuccess(`Updated ${envPath}`);

        console.log('');
        displayInfo('Updated variables:');
        for (const [key, value] of Object.entries(updates)) {
            const displayValue = key.includes('SECRET') || key.includes('KEY') ? '***' : value;
            console.log(`  ${key}=${displayValue}`);
        }
    } else {
        displayWarning('No automatic updates were possible. Manual setup required.');
    }
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║     CardCraft Studio - Auto-Fill Environment              ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝', 'bright');

    const autoMode = process.argv.includes('--auto');

    if (autoMode) {
        displayInfo('Running in AUTO mode (non-interactive)');
    } else {
        displayInfo('Running in INTERACTIVE mode');
    }

    console.log('');

    // Check if gcloud is installed
    try {
        execCommand('gcloud --version', { silent: true });
    } catch (error) {
        displayError('gcloud CLI is not installed!');
        displayInfo('Install from: https://cloud.google.com/sdk/docs/install');
        process.exit(1);
    }

    // Check authentication
    if (!checkGcloudAuth()) {
        displayError('Not authenticated with gcloud!');
        displayInfo('Run: gcloud auth login');
        process.exit(1);
    }

    try {
        await fillBackendEnv(autoMode);

        displaySection('Complete! 🎉');

        console.log('');
        displayInfo('Next steps:');
        console.log('  1. Review the updated .env file');
        console.log('  2. Manually fill any remaining variables if needed');
        console.log('  3. Restart your backend server: npm start');
        console.log('');
        displayInfo('For variables that require manual setup:');
        console.log('  - Custom Search Engine: https://programmablesearchengine.google.com/');
        console.log('  - OAuth Credentials: https://console.cloud.google.com/apis/credentials');

    } catch (error) {
        displayError(`Fill failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
