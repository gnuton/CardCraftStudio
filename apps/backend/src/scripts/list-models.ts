
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listModels() {
    console.log('Listing available Vertex AI models...');
    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        if (!projectId) {
            console.error('Missing GOOGLE_CLOUD_PROJECT');
            return;
        }

        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/us-central1/publishers/google/models`;

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Error listing models: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(errorText);
            return;
        }

        const data = await response.json();
        const models = data.models || [];

        console.log(`Found ${models.length} models.`);

        // Filter for gemini models
        const geminiModels = models
            .filter((m: any) => m.name.toLowerCase().includes('gemini'))
            .map((m: any) => ({
                name: m.name,
                displayName: m.displayName,
                supportedGenerationMethods: m.supportedGenerationMethods
            }));

        console.log('Gemini Models:');
        console.log(JSON.stringify(geminiModels, null, 2));

    } catch (error) {
        console.error('Script error:', error);
    }
}

listModels();
