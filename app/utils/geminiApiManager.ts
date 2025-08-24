interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

interface ApiKeyResult {
  success: boolean;
  data?: GeminiApiResponse;
  error?: string;
  statusCode?: number;
}

export class GeminiApiManager {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private failedKeys: Set<number> = new Set();

  constructor() {
    const apiKeyEnv = process.env.GEMINI_API_KEY;
    if (!apiKeyEnv) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    
    // Split by comma and trim whitespace
    this.apiKeys = apiKeyEnv.split(',').map(key => key.trim()).filter(key => key.length > 0);
    
    if (this.apiKeys.length === 0) {
      throw new Error('No valid API keys found in GEMINI_API_KEY');
    }
  }

  private async makeApiCall(apiKey: string, url: string, body: any): Promise<ApiKeyResult> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data,
          error: data.error?.message || 'API request failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
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

  private markKeyAsFailed(keyIndex: number, reason: string) {
    this.failedKeys.add(keyIndex);
    console.warn(`API key ${keyIndex + 1} marked as failed: ${reason}`);
  }

  async generateContent(prompt: string, model: string = 'gemini-2.0-flash'): Promise<ApiKeyResult> {
    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    // Try each available key
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      const apiKey = this.getNextAvailableKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'All API keys have been exhausted'
        };
      }

      const keyIndex = this.currentKeyIndex;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      console.log(`Attempting API call with key ${keyIndex + 1} (attempt ${attempt + 1})`);
      
      const result = await this.makeApiCall(apiKey, apiUrl, body);
      
      if (result.success) {
        // Reset failed keys on success
        this.failedKeys.clear();
        return result;
      }

      // Check if this is a key-specific failure that should mark the key as failed
      if (result.statusCode === 429 || // Rate limit
          result.statusCode === 403 || // Quota exceeded
          result.statusCode === 400 || // Bad request (often quota related)
          (result.data?.error?.message?.toLowerCase().includes('quota')) ||
          (result.data?.error?.message?.toLowerCase().includes('rate limit'))) {
        this.markKeyAsFailed(keyIndex, result.error || 'API limit exceeded');
      } else {
        // For other errors, don't mark the key as failed (might be temporary)
        console.warn(`API call failed with key ${keyIndex + 1}: ${result.error}`);
      }

      // Move to next key for next attempt
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    }

    return {
      success: false,
      error: 'All API keys failed after multiple attempts'
    };
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en',
    context: string = 'general',
    preserveFormatting: boolean = true,
    model: string = 'gemini-2.0-flash'
  ): Promise<ApiKeyResult> {
    // Optimize prompt for faster translation
    const prompt = this.createOptimizedTranslationPrompt(
      text,
      targetLanguage,
      sourceLanguage,
      context,
      preserveFormatting
    );

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent translations
        topK: 1, // Reduce options for faster response
        topP: 0.8, // Optimize for speed
        maxOutputTokens: Math.min(text.length * 3, 8000), // Optimize token limit
        stopSequences: [] // No stop sequences for faster completion
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Try each available key with optimized retry logic
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      const apiKey = this.getNextAvailableKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'All API keys have been exhausted'
        };
      }

      const keyIndex = this.currentKeyIndex;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      console.log(`Attempting translation with key ${keyIndex + 1} (attempt ${attempt + 1})`);
      
      const result = await this.makeApiCall(apiKey, apiUrl, body);
      
      if (result.success) {
        // Reset failed keys on success
        this.failedKeys.clear();
        return result;
      }

      // Check if this is a key-specific failure
      if (result.statusCode === 429 || // Rate limit
          result.statusCode === 403 || // Quota exceeded
          result.statusCode === 400 || // Bad request (often quota related)
          (result.data?.error?.message?.toLowerCase().includes('quota')) ||
          (result.data?.error?.message?.toLowerCase().includes('rate limit'))) {
        this.markKeyAsFailed(keyIndex, result.error || 'API limit exceeded');
      } else {
        console.warn(`Translation failed with key ${keyIndex + 1}: ${result.error}`);
      }

      // Move to next key for next attempt
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    }

    return {
      success: false,
      error: 'All API keys failed after multiple attempts'
    };
  }

  private createTranslationPrompt(
    text: string,
    targetLanguage: string,
    sourceLanguage: string,
    context?: string,
    preserveFormatting?: boolean
  ): string {
    let prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}`;
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    
    if (preserveFormatting) {
      prompt += `\n\nImportant: Preserve the exact formatting, line breaks, and structure of the original text.`;
    }
    
    prompt += `\n\nText to translate:\n${text}`;
    
    return prompt;
  }

  private createOptimizedTranslationPrompt(
    text: string,
    targetLanguage: string,
    sourceLanguage: string,
    context?: string,
    preserveFormatting?: boolean
  ): string {
    // Optimized prompt for faster translation
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
