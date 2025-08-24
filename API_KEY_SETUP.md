# API Key Setup Guide

## Multiple Gemini API Keys Configuration

This application now supports multiple Gemini API keys for enhanced reliability and load distribution. When one API key fails or exceeds its quota, the system automatically switches to the next available key.

### Environment Variable Setup

Set your `GEMINI_API_KEY` environment variable with multiple keys separated by commas:

```bash
# Single key (legacy support)
GEMINI_API_KEY=your_single_api_key_here

# Multiple keys (recommended for production)
GEMINI_API_KEY=key1,key2,key3,key4

# Keys with spaces (automatically trimmed)
GEMINI_API_KEY= key1 , key2 , key3
```

### Example Configuration

```bash
# .env.local file
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz,AIzaSyB0987654321zyxwvutsrqponmlkjihgfedcba,AIzaSyB11223344556677889900aabbccddeeff001122
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash
```

### How It Works

1. **Automatic Fallback**: If one API key fails or exceeds its quota, the system automatically switches to the next available key
2. **Smart Key Selection**: Keys are selected in round-robin fashion, with failed keys temporarily excluded
3. **Quota Management**: Keys that hit rate limits or quota limits are automatically marked as failed and won't be used until reset
4. **Transparent Operation**: Users don't need to manually switch keys - the system handles everything automatically

### Getting API Keys

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Repeat for additional keys if needed

### Best Practices

- **Production Use**: Use at least 2-3 API keys for redundancy
- **Key Rotation**: Consider rotating keys periodically for security
- **Monitoring**: Check console logs to see which key is being used
- **Quota Management**: Monitor usage across all keys to avoid hitting limits

### Troubleshooting

- **No Keys Working**: Ensure all API keys are valid and have sufficient quota
- **Rate Limiting**: The system automatically handles rate limits by switching keys
- **Quota Exceeded**: Failed keys are automatically excluded until other keys are exhausted

### Console Logging

The system logs which API key is being used for each request:

```
Using 3 API keys for content generation
Attempting API call with key 1 (attempt 1)
```

This helps with monitoring and debugging key usage.
