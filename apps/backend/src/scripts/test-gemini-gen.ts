
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testGeminiGeneration(modelId: string) {
    console.log(`\nTesting Gemini Image Generation with model: ${modelId}...`);
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

        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:generateContent`;

        const complexPrompt = `A fantasy card illustration of a dragon in a dark cave.
        
### Layout Requirements
The user is designing a card with specific element placements. You MUST generate a background that respects these areas.
The following list defines the "Restricted Zones" where card elements (text, icons) will be placed.
Inside these zones, the background should be uniform, dark, or low-detail to ensure text readability.
Do NOT place main subjects or busy details inside these zones. 
Frame the composition AROUND these zones.

Restricted Zones (0-1000 scale from top-left):
 - Title: Position(x=50, y=50), Size(w=900, h=100)
 - Description: Position(x=50, y=600), Size(w=900, h=300)`;

        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: complexPrompt }]
                }
            ],
            generationConfig: {
                responseModalities: ['IMAGE'], // Trying JUST image
                temperature: 1.0,
            }
        };

        console.log(`Endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error(`Error (${response.status} ${response.statusText}):`);
            const errorText = await response.text();
            console.error(errorText);
            return;
        }

        const data = await response.json();
        console.log('Success!');
        console.log(JSON.stringify(data.candidates?.[0]?.content?.parts?.[0]?.inlineData ? "Got Image Data" : "No Image Data", null, 2));

    } catch (error) {
        console.error('Script error:', error);
    }
}

async function runTests() {
    await testGeminiGeneration('gemini-2.0-flash-exp');
    await testGeminiGeneration('gemini-2.0-flash-001');
    await testGeminiGeneration('gemini-2.0-flash-preview-02-05'); // Another potential candidate
}

runTests();
