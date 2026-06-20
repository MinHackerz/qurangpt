/**
 * Unified AI Manager - Orchestrates OpenAI requests exclusively
 * Normalizes OpenAI response format to Gemini format for compatibility
 */

import { OpenAIApiManager } from './openaiApiManager';

interface UnifiedApiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
    // For compatibility with existing code that checks response structure
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    error?: {
        message?: string;
        code?: number | string;
    };
}

interface ApiKeyResult {
    success: boolean;
    data?: UnifiedApiResponse;
    text?: string;
    error?: string;
    statusCode?: number;
    provider?: 'gemini' | 'openai';
}

export class UnifiedAiManager {
    private openaiManager: OpenAIApiManager | null = null;
    private openaiAvailable: boolean = false;

    constructor() {
        // Try to initialize OpenAI
        try {
            this.openaiManager = new OpenAIApiManager();
            this.openaiAvailable = true;
        } catch {
            // OpenAI not configured
            this.openaiAvailable = false;
        }

        // At least OpenAI must be available
        if (!this.openaiAvailable) {
            throw new Error('No AI provider configured. Please set the OPENAI_API_KEY environment variable.');
        }
    }

    /**
     * Convert OpenAI response format to Gemini-compatible format
     * This ensures existing code that expects Gemini's response structure continues to work
     */
    private normalizeResponse(result: ApiKeyResult): ApiKeyResult {
        if (result.provider === 'openai' && result.success && result.data) {
            // Convert OpenAI response to Gemini-like structure
            const text = result.data.choices?.[0]?.message?.content || result.text || '';

            return {
                ...result,
                data: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: text
                            }]
                        }
                    }]
                }
            };
        }
        return result;
    }

    async generateContent(prompt: string, model: string = 'gpt-4o-mini', temperature: number = 0.7): Promise<ApiKeyResult> {
        // Try OpenAI fallback if available
        if (this.openaiAvailable && this.openaiManager) {
            const openaiResult = await this.openaiManager.generateContent(prompt, model, temperature);

            if (openaiResult.success) {
                // Normalize the response to Gemini format for compatibility
                return this.normalizeResponse({
                    ...openaiResult,
                    provider: 'openai'
                });
            }

            return {
                ...openaiResult,
                provider: 'openai'
            };
        }

        // OpenAI unavailable
        return {
            success: false,
            error: 'OpenAI is not configured',
            provider: 'openai'
        };
    }

    /**
     * Translation-specific method that uses generateContent internally
     */
    async translateText(
        text: string,
        targetLanguage: string,
        sourceLanguage: string = 'en',
        context: string = 'general',
        preserveFormatting: boolean = true,
        model: string = 'gpt-4o-mini'
    ): Promise<ApiKeyResult> {
        const prompt = this.createOptimizedTranslationPrompt(
            text,
            targetLanguage,
            sourceLanguage,
            context,
            preserveFormatting
        );

        return this.generateContent(prompt, model, 0.1);
    }

    private createOptimizedTranslationPrompt(
        text: string,
        targetLanguage: string,
        sourceLanguage: string,
        context?: string,
        preserveFormatting?: boolean
    ): string {
        let prompt = `Translate from ${sourceLanguage} to ${targetLanguage}. `;

        if (context === 'islamic') {
            prompt += `Preserve Islamic terms and religious accuracy. `;
        }

        if (preserveFormatting) {
            prompt += `Keep exact formatting and structure. `;
        }

        prompt += `\n\nText:\n${text}`;

        return prompt;
    }

    /**
     * Check which providers are available
     */
    getAvailableProviders(): { gemini: boolean; openai: boolean } {
        return {
            gemini: false,
            openai: this.openaiAvailable
        };
    }

    /**
     * Get key counts (for compatibility with existing code)
     */
    getKeyCount(): number {
        if (this.openaiAvailable && this.openaiManager) {
            return this.openaiManager.getKeyCount();
        }
        return 0;
    }

    getCurrentKeyIndex(): number {
        if (this.openaiAvailable && this.openaiManager) {
            return this.openaiManager.getCurrentKeyIndex();
        }
        return 0;
    }

    getFailedKeyCount(): number {
        if (this.openaiAvailable && this.openaiManager) {
            return this.openaiManager.getFailedKeyCount();
        }
        return 0;
    }
}
