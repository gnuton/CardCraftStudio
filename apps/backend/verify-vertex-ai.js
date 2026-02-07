const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function verifyVertexAIAccess() {
    console.log('🔍 Verifying Vertex AI Access...\n');

    // Check environment variables
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    console.log('📋 Configuration:');
    console.log('  Project ID:', projectId || '❌ NOT SET');
    console.log('  Credentials Path:', credentialsPath || '❌ NOT SET');

    if (!projectId || !credentialsPath) {
        console.log('\n❌ Missing required environment variables');
        process.exit(1);
    }

    // Check if credentials file exists
    const fs = require('fs');
    if (!fs.existsSync(credentialsPath)) {
        console.log(`\n❌ Credentials file not found at: ${credentialsPath}`);
        process.exit(1);
    }

    console.log('\n✅ Credentials file exists');

    // Load and display service account info
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('\n📧 Service Account:');
    console.log('  Email:', credentials.client_email);
    console.log('  Project ID (from file):', credentials.project_id);

    // Try to get an access token
    console.log('\n🔐 Testing authentication...');
    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        if (accessToken.token) {
            console.log('✅ Successfully obtained access token');
            console.log('   Token preview:', accessToken.token.substring(0, 20) + '...');
        } else {
            console.log('❌ Failed to obtain access token');
            process.exit(1);
        }

        // Test Vertex AI API access
        console.log('\n🧪 Testing Vertex AI API access...');
        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-fast-generate-001:predict`;

        const requestBody = {
            instances: [{ prompt: 'A simple test image' }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.token}`,
            },
            body: JSON.stringify(requestBody)
        });

        console.log('   Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('\n❌ API Error Response:');
            console.log(errorText);

            if (response.status === 403) {
                console.log('\n💡 This is likely a permissions issue. Please ensure:');
                console.log('   1. Vertex AI API is enabled in your project');
                console.log('   2. Service account has "Vertex AI User" role');
                console.log('   3. Billing is enabled for your project');
                console.log('\n   Enable Vertex AI API:');
                console.log(`   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`);
            }
            process.exit(1);
        }

        console.log('✅ Vertex AI API is accessible!');
        console.log('\n🎉 All checks passed! AI image generation should work.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Load environment from .env file
require('dotenv').config();

verifyVertexAIAccess();
