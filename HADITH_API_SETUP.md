# Hadith API Setup Guide

This guide explains how to set up the Hadith API integration for QuranGPT.

## Overview

The Hadith API integration allows QuranGPT to display **only Sahih (authentic) hadiths** from the five main collections:
- Sahih Bukhari
- Sahih Muslim  
- Jami' at-Tirmidhi
- Sunan Abu Dawood
- Sunan an-Nasa'i

**Important**: Only hadiths with "Sahih" status are displayed to ensure authenticity and reliability.

## API Setup

### 1. Get API Key

1. Visit [hadithapi.com](https://www.hadithapi.com)
2. Register for an account
3. Generate your API key from the dashboard

### 2. Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
HADITH_API_KEY=your_api_key

```

### 3. API Features

The Hadith API provides:
- **Search Functionality**: Search hadiths by keywords, topics, or specific terms (Sahih only)
- **Specific Hadith Retrieval**: Fetch hadiths by book and number (Sahih only)
- **Multilingual Support**: Hadiths available in Arabic, English, and Urdu
- **Authenticity Filtering**: Only displays hadiths with "Sahih" status for maximum reliability

## How It Works

### 1. Automatic Detection
The system automatically detects hadith references in AI responses using patterns like:
- "Sahih Bukhari 1234"
- "Muslim 5678"
- "Tirmidhi, Book 1, Hadith 1234"

### 2. Intelligent Search
When no specific hadith references are found, the system performs intelligent search based on:
- Key Islamic terms from the user's query
- Topics mentioned in the AI response
- Religious concepts and practices

### 3. Display Format
Hadiths are displayed in styled boxes similar to ayah boxes with:
- Book name and hadith number
- "Sahih" authenticity status badge (all hadiths are guaranteed authentic)
- Language toggle (English/Arabic/Urdu)
- Copy functionality
- Responsive design

## API Endpoints

### Search Hadiths
```
GET /api/hadith?query=search_term&limit=5
```

### Specific Hadith
```
GET /api/hadith?hadithNumber=1234&bookSlug=bukhari
```

## Configuration

### Rate Limits
The API has rate limits. The system is configured to:
- Search up to 5 hadiths per query
- Use intelligent caching
- Handle errors gracefully

### Fallback Behavior
If the API is unavailable or returns no results:
- Specific hadith references show as styled badges
- Intelligent search results are hidden
- No error messages are shown to users

## Testing

To test the integration:

1. Set up your API key
2. Ask questions about Islamic topics
3. Look for hadith boxes in responses
4. Test language toggles and copy functionality

## Troubleshooting

### Common Issues

1. **No hadiths showing**: Check API key configuration
2. **API errors**: Verify API key is valid and has credits
3. **Styling issues**: Ensure CSS is properly loaded

### Debug Mode

Enable debug logging by checking browser console for:
- Hadith search queries
- API responses
- Error messages

## Security

- API key is stored securely in environment variables
- No sensitive data is logged
- Rate limiting prevents abuse
- Graceful error handling

## Support

For API-related issues:
- Check [hadithapi.com documentation](https://hadithapi.com)
- Verify API key and account status
- Check rate limits and usage

For integration issues:
- Review console logs
- Check environment variables
- Verify API endpoint responses
