
import dotenv from 'dotenv';
import path from 'path';
import { googleAiService } from '../services/googleAiService';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testGeminiGeneration() {
    console.log('Testing Gemini API with layout image...');

    // A simple 1x1 white pixel PNG base64
    const whitePixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    const layoutImage = `data:image/png;base64,${whitePixelBase64}`;

    const prompt = "Generate an image that looks exactly like the wireframe I sent you. It is a simple white pixel for testing.";

    try {
        console.log('Sending request to Gemini...');
        const result = await googleAiService.generateImage(
            prompt,
            undefined,
            {
                layoutImage: layoutImage
            },
            'gemini'
        );

        console.log('Generation successful!');
        console.log('Final Prompt:', result.finalPrompt);
        if (result.debugData) {
            console.log('Debug Data Model:', result.debugData.model);
            console.log('Debug Data Endpoint:', result.debugData.endpoint);
        }
        console.log('Image Data Length:', result.imageBase64.length);

    } catch (error) {
        console.error('Generation failed:', error);
    }
}

testGeminiGeneration();
