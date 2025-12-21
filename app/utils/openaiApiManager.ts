/**
 * OpenAI API Manager - Fallback provider when Gemini API fails
 * Mirrors the GeminiApiManager interface for seamless integration
 */

interface OpenAIApiResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    error?: {
        message?: string;
        code?: string;
    };
}

interface ApiKeyResult {
    success: boolean;
    data?: OpenAIApiResponse;
    text?: string;
    error?: string;
    statusCode?: number;
    provider?: 'openai';
}

export class OpenAIApiManager {
    private apiKeys: string[];
    private currentKeyIndex: number = 0;
    private failedKeys: Set<number> = new Set();

    constructor() {
        const apiKeyEnv = process.env.OPENAI_API_KEY;
        if (!apiKeyEnv) {
            throw new Error('OPENAI_API_KEY environment variable is not configured');
        }

        // Split by comma and trim whitespace (supports multiple keys like Gemini)
        this.apiKeys = apiKeyEnv.split(',').map(key => key.trim()).filter(key => key.length > 0);

        if (this.apiKeys.length === 0) {
            throw new Error('No valid API keys found in OPENAI_API_KEY');
        }
    }

    private async makeApiCall(apiKey: string, url: string, body: any): Promise<ApiKeyResult> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    data,
                    error: data.error?.message || 'API request failed',
                    statusCode: response.status,
                    provider: 'openai'
                };
            }

            // Extract the text content for easier access
            const text = data.choices?.[0]?.message?.content || '';

            return {
                success: true,
                data,
                text,
                provider: 'openai'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                statusCode: 500,
                provider: 'openai'
            };
        }
    }

    private getNextAvailableKey(): string | null {
        // Try to find a key that hasn't failed
        for (let i = 0; i < this.apiKeys.length; i++) {
            const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
            if (!this.failedKeys.has(keyIndex)) {
                this.currentKeyIndex = keyIndex;
                return this.apiKeys[keyIndex];
            }
        }

        // If all keys have failed, reset and try again
        this.failedKeys.clear();
        this.currentKeyIndex = 0;
        return this.apiKeys[0];
    }

    private markKeyAsFailed(keyIndex: number): void {
        this.failedKeys.add(keyIndex);
    }

    /**
     * Map Gemini model names to OpenAI equivalents
     */
    private mapModel(geminiModel: string): string {
        const modelMap: Record<string, string> = {
            'gemini-2.5-flash': 'gpt-4o-mini',
            'gemini-2.0-flash': 'gpt-4o-mini',
            'gemini-1.5-pro': 'gpt-4o',
            'gemini-1.5-flash': 'gpt-4o-mini',
            'gemma-3-12b-it': 'gpt-4o-mini',
        };

        // Check for configured model override
        const configuredModel = process.env.OPENAI_MODEL;
        if (configuredModel) {
            return configuredModel;
        }

        return modelMap[geminiModel] || 'gpt-4o-mini';
    }

    async generateContent(prompt: string, model: string = 'gpt-4o-mini', temperature: number = 0.7): Promise<ApiKeyResult> {
        const mappedModel = this.mapModel(model);

        const body = {
            model: mappedModel,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: temperature,
            max_tokens: 2048,
        };

        // Try each available key
        for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
            const apiKey = this.getNextAvailableKey();
            if (!apiKey) {
                return {
                    success: false,
                    error: 'All OpenAI API keys have been exhausted',
                    provider: 'openai'
                };
            }

            const keyIndex = this.currentKeyIndex;
            const apiUrl = 'https://api.openai.com/v1/chat/completions';

            const result = await this.makeApiCall(apiKey, apiUrl, body);

            if (result.success) {
                // Reset failed keys on success
                this.failedKeys.clear();
                return result;
            }

            // Check if this is a key-specific failure that should mark the key as failed
            if (result.statusCode === 429 || // Rate limit
                result.statusCode === 403 || // Quota exceeded
                result.statusCode === 401 || // Invalid API key
                (result.data?.error?.message?.toLowerCase().includes('quota')) ||
                (result.data?.error?.message?.toLowerCase().includes('rate limit'))) {
                this.markKeyAsFailed(keyIndex);
            }

            // Move to next key for next attempt
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        }

        return {
            success: false,
            error: 'All OpenAI API keys failed after multiple attempts',
            provider: 'openai'
        };
    }

    getKeyCount(): number {
        return this.apiKeys.length;
    }

    getCurrentKeyIndex(): number {
        return this.currentKeyIndex;
    }

    getFailedKeyCount(): number {
        return this.failedKeys.size;
    }
}
