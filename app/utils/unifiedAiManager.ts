/**
 * Unified AI Manager - Orchestrates Gemini (primary) and OpenAI (fallback)
 * Uses Gemini first, falls back to OpenAI when Gemini fails
 */

import { GeminiApiManager } from './geminiApiManager';
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
    private geminiManager: GeminiApiManager | null = null;
    private openaiManager: OpenAIApiManager | null = null;
    private geminiAvailable: boolean = false;
    private openaiAvailable: boolean = false;

    constructor() {
        // Try to initialize Gemini
        try {
            this.geminiManager = new GeminiApiManager();
            this.geminiAvailable = true;
        } catch {
            // Gemini not configured, will use fallback
            this.geminiAvailable = false;
        }

        // Try to initialize OpenAI as fallback
        try {
            this.openaiManager = new OpenAIApiManager();
            this.openaiAvailable = true;
        } catch {
            // OpenAI not configured
            this.openaiAvailable = false;
        }

        // At least one provider must be available
        if (!this.geminiAvailable && !this.openaiAvailable) {
            throw new Error('No AI provider configured. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.');
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

    async generateContent(prompt: string, model: string = 'gemini-2.0-flash', temperature: number = 0.7): Promise<ApiKeyResult> {
        // Try Gemini first if available
        if (this.geminiAvailable && this.geminiManager) {
            const geminiResult = await this.geminiManager.generateContent(prompt, model, temperature);

            if (geminiResult.success) {
                return {
                    ...geminiResult,
                    provider: 'gemini'
                };
            }

            // Gemini failed, log and try OpenAI fallback
            console.log('[UnifiedAiManager] Gemini failed, attempting OpenAI fallback...');
        }

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

        // Both providers failed or unavailable
        return {
            success: false,
            error: this.geminiAvailable
                ? 'Both Gemini and OpenAI failed to generate content'
                : 'OpenAI failed to generate content (Gemini not configured)',
            provider: this.openaiAvailable ? 'openai' : 'gemini'
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
        model: string = 'gemini-2.0-flash'
    ): Promise<ApiKeyResult> {
        // Use the same translation logic as GeminiApiManager but through unified manager
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
            gemini: this.geminiAvailable,
            openai: this.openaiAvailable
        };
    }

    /**
     * Get Gemini key count (for compatibility with existing code)
     */
    getKeyCount(): number {
        if (this.geminiAvailable && this.geminiManager) {
            return this.geminiManager.getKeyCount();
        }
        if (this.openaiAvailable && this.openaiManager) {
            return this.openaiManager.getKeyCount();
        }
        return 0;
    }

    getCurrentKeyIndex(): number {
        if (this.geminiAvailable && this.geminiManager) {
            return this.geminiManager.getCurrentKeyIndex();
        }
        if (this.openaiAvailable && this.openaiManager) {
            return this.openaiManager.getCurrentKeyIndex();
        }
        return 0;
    }

    getFailedKeyCount(): number {
        if (this.geminiAvailable && this.geminiManager) {
            return this.geminiManager.getFailedKeyCount();
        }
        if (this.openaiAvailable && this.openaiManager) {
            return this.openaiManager.getFailedKeyCount();
        }
        return 0;
    }
}
