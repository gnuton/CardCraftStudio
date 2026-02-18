#!/usr/bin/env node

/**
 * Google Cloud Environment Setup Script
 * 
 * This script automates the Google Cloud resource provisioning:
 * - Creates/selects GCP project
 * - Enables required APIs
 * - Creates service account
 * - Sets up Workload Identity Federation for GitHub Actions
 * - Creates OAuth 2.0 credentials
 * - Provisions Firestore database
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
    displayInfo('Checking gcloud authentication...');
    try {
        const account = execCommand('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { silent: true });
        if (account) {
            displaySuccess(`Authenticated as: ${account}`);
            return true;
        }
    } catch (error) {
        // Not authenticated
    }
    return false;
}

async function authenticateGcloud() {
    displaySection('Google Cloud Authentication');

    if (checkGcloudAuth()) {
        const useExisting = await question('Use existing authentication? (y/n): ');
        if (useExisting.toLowerCase() === 'y') {
            return;
        }
    }

    displayInfo('Opening browser for authentication...');
    execCommand('gcloud auth login');
    displaySuccess('Authentication successful!');
}

async function selectOrCreateProject() {
    displaySection('Google Cloud Project');

    const projectId = await question('Enter your GCP Project ID (or create new): ');

    // Check if project exists
    const existingProject = execCommand(
        `gcloud projects describe ${projectId} --format="value(projectId)"`,
        { silent: true, ignoreError: true }
    );

    if (existingProject) {
        displaySuccess(`Project ${projectId} found!`);
    } else {
        displayWarning(`Project ${projectId} does not exist.`);
        const create = await question('Create this project? (y/n): ');

        if (create.toLowerCase() === 'y') {
            displayInfo('Creating project...');
            execCommand(`gcloud projects create ${projectId}`);
            displaySuccess(`Project ${projectId} created!`);
        } else {
            throw new Error('Project setup cancelled');
        }
    }

    // Set as active project
    execCommand(`gcloud config set project ${projectId}`);
    displaySuccess(`Active project set to: ${projectId}`);

    return projectId;
}

function enableApis(projectId) {
    displaySection('Enabling Required APIs');

    const apis = [
        'run.googleapis.com',
        'artifactregistry.googleapis.com',
        'cloudbuild.googleapis.com',

        'aiplatform.googleapis.com',
        'cloudresourcemanager.googleapis.com',
        'iam.googleapis.com',
        'drive.googleapis.com',
        'firestore.googleapis.com',
        'firebase.googleapis.com',
        'iamcredentials.googleapis.com',
        'sts.googleapis.com'
    ];

    displayInfo(`Enabling ${apis.length} APIs...`);

    for (const api of apis) {
        try {
            execCommand(`gcloud services enable ${api} --project=${projectId}`, { silent: true });
            displaySuccess(`Enabled: ${api}`);
        } catch (error) {
            displayWarning(`Failed to enable ${api}: ${error.message}`);
        }
    }

    displayInfo('Waiting for APIs to propagate (30 seconds)...');
    execSync('sleep 30');
}

function createServiceAccount(projectId) {
    displaySection('Creating Service Account');

    const saName = 'cardcraft-backend';
    const saEmail = `${saName}@${projectId}.iam.gserviceaccount.com`;

    // Check if service account exists
    const existing = execCommand(
        `gcloud iam service-accounts describe ${saEmail} --project=${projectId} --format="value(email)"`,
        { silent: true, ignoreError: true }
    );

    if (existing) {
        displaySuccess(`Service account already exists: ${saEmail}`);
    } else {
        displayInfo('Creating service account...');
        execCommand(
            `gcloud iam service-accounts create ${saName} \
        --display-name="CardCraft Backend Service Account" \
        --project=${projectId}`
        );
        displaySuccess(`Created service account: ${saEmail}`);
    }

    // Grant necessary roles
    displayInfo('Granting IAM roles...');
    const roles = [
        'roles/datastore.user',
        'roles/aiplatform.user',
        'roles/storage.objectAdmin'
    ];

    for (const role of roles) {
        execCommand(
            `gcloud projects add-iam-policy-binding ${projectId} \
        --member="serviceAccount:${saEmail}" \
        --role="${role}" \
        --condition=None`,
            { silent: true, ignoreError: true }
        );
    }

    // Download service account key
    const keyPath = path.join(__dirname, '..', 'apps', 'backend', 'serviceAccountKey.json');

    if (fs.existsSync(keyPath)) {
        displayWarning('Service account key already exists. Skipping download.');
    } else {
        displayInfo('Downloading service account key...');
        execCommand(
            `gcloud iam service-accounts keys create ${keyPath} \
        --iam-account=${saEmail} \
        --project=${projectId}`
        );
        displaySuccess(`Service account key saved to: ${keyPath}`);
        displayWarning('Keep this key secure! Add it to .gitignore');
    }

    return saEmail;
}

async function setupWorkloadIdentityFederation(projectId) {
    displaySection('Workload Identity Federation (for GitHub Actions)');

    const setupWIF = await question('Set up Workload Identity Federation for GitHub Actions? (y/n): ');
    if (setupWIF.toLowerCase() !== 'y') {
        displayWarning('Skipping WIF setup. You will need to configure this manually for CI/CD.');
        return null;
    }

    const githubRepo = await question('Enter your GitHub repository (owner/repo): ');
    const poolName = 'github-pool';
    const providerId = 'github-provider';
    const saName = 'github-actions';
    const saEmail = `${saName}@${projectId}.iam.gserviceaccount.com`;

    // Create workload identity pool
    displayInfo('Creating workload identity pool...');
    execCommand(
        `gcloud iam workload-identity-pools create ${poolName} \
      --project="${projectId}" \
      --location="global" \
      --display-name="GitHub Actions Pool"`,
        { ignoreError: true }
    );

    // Create workload identity provider
    displayInfo('Creating workload identity provider...');
    execCommand(
        `gcloud iam workload-identity-pools providers create-oidc ${providerId} \
      --project="${projectId}" \
      --location="global" \
      --workload-identity-pool="${poolName}" \
      --display-name="GitHub Provider" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
      --issuer-uri="https://token.actions.githubusercontent.com"`,
        { ignoreError: true }
    );

    // Create service account for GitHub Actions
    displayInfo('Creating GitHub Actions service account...');
    execCommand(
        `gcloud iam service-accounts create ${saName} \
      --display-name="GitHub Actions Service Account" \
      --project=${projectId}`,
        { ignoreError: true }
    );

    // Grant roles to service account
    const roles = [
        'roles/run.admin',
        'roles/artifactregistry.writer',
        'roles/iam.serviceAccountUser',
        'roles/storage.admin'
    ];

    for (const role of roles) {
        execCommand(
            `gcloud projects add-iam-policy-binding ${projectId} \
        --member="serviceAccount:${saEmail}" \
        --role="${role}"`,
            { silent: true, ignoreError: true }
        );
    }

    // Allow GitHub Actions to impersonate the service account
    execCommand(
        `gcloud iam service-accounts add-iam-policy-binding ${saEmail} \
      --project="${projectId}" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/projects/${execCommand(`gcloud projects describe ${projectId} --format='value(projectNumber)'`, { silent: true })}/locations/global/workloadIdentityPools/${poolName}/attribute.repository/${githubRepo}"`,
        { ignoreError: true }
    );

    const projectNumber = execCommand(`gcloud projects describe ${projectId} --format='value(projectNumber)'`, { silent: true });
    const wifProvider = `projects/${projectNumber}/locations/global/workloadIdentityPools/${poolName}/providers/${providerId}`;

    displaySuccess('Workload Identity Federation configured!');

    return {
        provider: wifProvider,
        serviceAccount: saEmail
    };
}

async function createFirestoreDatabase(projectId) {
    displaySection('Firestore Database');

    const createDb = await question('Create Firestore database? (y/n): ');
    if (createDb.toLowerCase() !== 'y') {
        displayWarning('Skipping Firestore setup.');
        return;
    }

    displayInfo('Creating Firestore database...');

    // Check if database exists
    const existing = execCommand(
        `gcloud firestore databases describe --database="(default)" --project=${projectId} --format="value(name)"`,
        { silent: true, ignoreError: true }
    );

    if (existing) {
        displaySuccess('Firestore database already exists!');
    } else {
        execCommand(
            `gcloud firestore databases create --database="(default)" --location=us-central1 --type=firestore-native --project=${projectId}`
        );
        displaySuccess('Firestore database created!');
    }
}

function displayConfiguration(projectId, wifConfig) {
    displaySection('Configuration Summary');

    console.log('');
    displayInfo('Add these to your local .env files:');
    console.log('');
    console.log(`GOOGLE_CLOUD_PROJECT=${projectId}`);
    console.log(`GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json`);
    console.log('');

    if (wifConfig) {
        displayInfo('Add these secrets to GitHub Actions:');
        console.log('');
        console.log(`GCP_PROJECT_ID=${projectId}`);
        console.log(`WIF_PROVIDER=${wifConfig.provider}`);
        console.log(`WIF_SERVICE_ACCOUNT=${wifConfig.serviceAccount}`);
        console.log('');
        displayInfo('Run: npm run setup:github-secrets (to automate this)');
    }

    console.log('');
    displayInfo('Still needed (obtain from Google Cloud Console):');
    displayInfo('Still needed (obtain from Google Cloud Console):');
    console.log('  - GOOGLE_CLIENT_ID (OAuth 2.0 Client)');
    console.log('  - GOOGLE_CLIENT_SECRET (OAuth 2.0 Client)');
    console.log('');
    displayInfo('Create OAuth credentials at:');
    console.log('  https://console.cloud.google.com/apis/credentials');
    console.log('');
    displayInfo('Create OAuth credentials at:');
    console.log('  https://console.cloud.google.com/apis/credentials');
    console.log('');
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║     CardCraft Studio - Cloud Environment Setup            ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝', 'bright');

    displayInfo('This script will provision Google Cloud resources for CardCraft Studio.');
    displayWarning('You need gcloud CLI installed and configured.');
    console.log('');

    // Check if gcloud is installed
    try {
        execCommand('gcloud --version', { silent: true });
    } catch (error) {
        displayError('gcloud CLI is not installed!');
        displayInfo('Install from: https://cloud.google.com/sdk/docs/install');
        process.exit(1);
    }

    try {
        await authenticateGcloud();
        const projectId = await selectOrCreateProject();
        enableApis(projectId);
        createServiceAccount(projectId);
        const wifConfig = await setupWorkloadIdentityFederation(projectId);
        await createFirestoreDatabase(projectId);

        displaySection('Setup Complete! 🎉');
        displayConfiguration(projectId, wifConfig);

        displayInfo('Next steps:');
        console.log('  1. Update your .env files with the configuration above');
        console.log('  2. Create OAuth 2.0 credentials in Google Cloud Console');
        console.log('  3. Run: npm run setup:github-secrets');
        console.log('');
        displayInfo('Full documentation: docs/SETUP.md');

    } catch (error) {
        displayError(`Setup failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
