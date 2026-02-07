#!/usr/bin/env node

/**
 * GitHub Actions Secrets Setup Script
 * 
 * This script automates setting GitHub Actions secrets using the GitHub CLI.
 * It reads values from your local .env files or prompts for them.
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

function parseEnvFile(filePath) {
    const env = {};

    if (!fs.existsSync(filePath)) {
        return env;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    }

    return env;
}

function loadEnvFiles() {
    const backendEnvPath = path.join(__dirname, '..', 'apps', 'backend', '.env');
    const frontendEnvPath = path.join(__dirname, '..', 'apps', 'web', '.env');

    const backendEnv = parseEnvFile(backendEnvPath);
    const frontendEnv = parseEnvFile(frontendEnvPath);

    return { ...backendEnv, ...frontendEnv };
}

function checkGhAuth() {
    try {
        const user = execCommand('gh auth status', { silent: true, ignoreError: true });
        return user.includes('Logged in');
    } catch (error) {
        return false;
    }
}

async function authenticateGh() {
    displaySection('GitHub CLI Authentication');

    if (checkGhAuth()) {
        displaySuccess('Already authenticated with GitHub CLI');
        return;
    }

    displayInfo('Opening browser for GitHub authentication...');
    execCommand('gh auth login');
    displaySuccess('Authentication successful!');
}

async function getRepository() {
    displaySection('GitHub Repository');

    // Try to get current repository
    try {
        const remote = execCommand('git config --get remote.origin.url', { silent: true, ignoreError: true });
        if (remote) {
            // Extract owner/repo from URL
            const match = remote.match(/github\.com[:/](.+\/.+?)(\.git)?$/);
            if (match) {
                const repo = match[1].replace('.git', '');
                displayInfo(`Detected repository: ${repo}`);
                const useDetected = await question('Use this repository? (y/n): ');
                if (useDetected.toLowerCase() === 'y') {
                    return repo;
                }
            }
        }
    } catch (error) {
        // Ignore
    }

    const repo = await question('Enter GitHub repository (owner/repo): ');
    return repo;
}

async function setSecret(repo, name, value) {
    if (!value || value === '') {
        displayWarning(`Skipping ${name} (no value provided)`);
        return false;
    }

    try {
        // Use gh secret set with stdin
        execCommand(`echo "${value}" | gh secret set ${name} --repo=${repo}`, { silent: true });
        displaySuccess(`Set secret: ${name}`);
        return true;
    } catch (error) {
        displayError(`Failed to set ${name}: ${error.message}`);
        return false;
    }
}

async function promptForSecret(name, description, defaultValue = '') {
    console.log('');
    displayInfo(description);
    const value = await question(`${name}${defaultValue ? ' [***]' : ''}: `);
    return value.trim() || defaultValue;
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║     CardCraft Studio - GitHub Secrets Setup               ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝', 'bright');

    displayInfo('This script will configure GitHub Actions secrets for your repository.');
    displayWarning('You need GitHub CLI (gh) installed and authenticated.');
    displayWarning('This will OVERWRITE any existing secrets with the same name.');
    console.log('');

    const proceed = await new Promise(resolve => {
        rl.question(`${colors.cyan}Do you want to continue? (y/n): ${colors.reset}`, answer => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });

    if (!proceed) {
        displayWarning('Setup cancelled.');
        rl.close();
        return;
    }

    // Check if gh is installed
    try {
        execCommand('gh --version', { silent: true });
    } catch (error) {
        displayError('GitHub CLI (gh) is not installed!');
        displayInfo('Install from: https://cli.github.com/');
        displayInfo('');
        displayInfo('Alternatively, you can set secrets manually at:');
        displayInfo('https://github.com/YOUR_REPO/settings/secrets/actions');
        process.exit(1);
    }

    try {
        await authenticateGh();
        const repo = await getRepository();

        displaySection('Loading Environment Variables');
        const env = loadEnvFiles();

        if (Object.keys(env).length > 0) {
            displaySuccess(`Loaded ${Object.keys(env).length} variables from .env files`);
        } else {
            displayWarning('No .env files found. You will need to enter all values manually.');
        }

        displaySection('Configuring GitHub Secrets');

        // Define required secrets with their sources
        const secrets = [
            {
                name: 'GCP_PROJECT_ID',
                description: 'Google Cloud Project ID',
                envKey: 'GOOGLE_CLOUD_PROJECT'
            },
            {
                name: 'WIF_PROVIDER',
                description: 'Workload Identity Federation Provider (from setup:cloud-env output)',
                envKey: null
            },
            {
                name: 'WIF_SERVICE_ACCOUNT',
                description: 'Workload Identity Service Account (from setup:cloud-env output)',
                envKey: null
            },
            {
                name: 'GOOGLE_API_KEY',
                description: 'Google API Key for Custom Search',
                envKey: 'GOOGLE_API_KEY'
            },
            {
                name: 'GOOGLE_CUSTOM_SEARCH_CX',
                description: 'Google Custom Search Engine ID',
                envKey: 'GOOGLE_CUSTOM_SEARCH_CX'
            },
            {
                name: 'GOOGLE_CLIENT_ID',
                description: 'Google OAuth Client ID',
                envKey: 'GOOGLE_CLIENT_ID'
            },
            {
                name: 'GOOGLE_CLIENT_SECRET',
                description: 'Google OAuth Client Secret',
                envKey: 'GOOGLE_CLIENT_SECRET'
            },
            {
                name: 'TOKEN_ENCRYPTION_KEY',
                description: 'Token encryption key (32 characters)',
                envKey: 'TOKEN_ENCRYPTION_KEY'
            },
            {
                name: 'JWT_SECRET',
                description: 'JWT signing secret',
                envKey: 'JWT_SECRET'
            },
            {
                name: 'STRIPE_SECRET_KEY',
                description: 'Stripe Secret Key (optional)',
                envKey: 'STRIPE_SECRET_KEY'
            },
            {
                name: 'STRIPE_WEBHOOK_SECRET',
                description: 'Stripe Webhook Secret (optional)',
                envKey: 'STRIPE_WEBHOOK_SECRET'
            },
            {
                name: 'VITE_API_BASE_URL',
                description: 'Production backend URL (e.g., https://your-backend-url.run.app)',
                envKey: 'VITE_API_BASE_URL'
            }
        ];

        let successCount = 0;
        let skipCount = 0;

        for (const secret of secrets) {
            const defaultValue = secret.envKey ? env[secret.envKey] : '';
            const value = await promptForSecret(secret.name, secret.description, defaultValue);

            if (await setSecret(repo, secret.name, value)) {
                successCount++;
            } else {
                skipCount++;
            }
        }

        displaySection('Setup Complete! 🎉');

        displaySuccess(`Successfully set ${successCount} secrets`);
        if (skipCount > 0) {
            displayWarning(`Skipped ${skipCount} secrets`);
        }

        console.log('');
        displayInfo('Your GitHub Actions workflows are now configured!');
        displayInfo('Push to main branch to trigger deployments.');
        console.log('');
        displayInfo('View secrets at:');
        console.log(`  https://github.com/${repo}/settings/secrets/actions`);

    } catch (error) {
        displayError(`Setup failed: ${error.message}`);
        console.error(error);

        displayInfo('');
        displayInfo('Manual setup instructions:');
        console.log('  1. Go to: https://github.com/YOUR_REPO/settings/secrets/actions');
        console.log('  2. Click "New repository secret"');
        console.log('  3. Add each secret from the list above');
        console.log('');
        displayInfo('Full documentation: docs/SETUP.md');

        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
