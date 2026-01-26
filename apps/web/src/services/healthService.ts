export interface HealthStatus {
    status: 'ok' | 'incomplete' | 'error';
    timestamp: string;
    missingVariables?: string[];
    message?: string;
}

class HealthService {
    private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    async checkHealth(): Promise<HealthStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    message: `Backend returned ${response.status}: ${response.statusText}`
                };
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to check backend health:', error);
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                message: error instanceof Error ? error.message : 'Failed to connect to backend'
            };
        }
    }
}

export const healthService = new HealthService();
