# Advanced Translation System

## Overview

The Quran GPT application now features an advanced translation system powered by Google's Gemma-3-12B-IT model. This system provides high-quality, context-aware translations for Islamic and Quranic content across 30+ languages with intelligent caching, quality scoring, and comprehensive management features.

## Features

### 🌍 Multi-Language Support
- **30+ Languages**: Support for major world languages including Arabic, English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Hindi, Urdu, Persian, Turkish, Indonesian, Malay, Bengali, Tamil, Telugu, Malayalam, Thai, Vietnamese, Swahili, Hausa, Yoruba, Igbo, Amharic, Somali, Kurdish, Pashto, Sindhi, and Uyghur
- **Native Script Support**: Proper rendering for RTL languages (Arabic, Persian, Urdu, etc.)
- **Cultural Context**: Language-specific religious terminology and expressions

### 🤖 AI-Powered Translation
- **Gemma-3-12B-IT Model**: Google's advanced multilingual model optimized for instruction following
- **Context-Aware**: Specialized prompts for Islamic, Quranic, and general content
- **Preserve Formatting**: Maintains HTML structure, verse references, and special markup
- **Quality Scoring**: Confidence ratings for translation accuracy

### ⚡ Smart Caching System
- **Local Storage**: Client-side caching for instant retrieval
- **Intelligent Expiry**: 1-hour cache timeout with access-based refresh
- **Memory Optimization**: Automatic cleanup of expired entries
- **Usage Analytics**: Track cache hits and translation statistics

### 🎨 Advanced UI Components

#### Language Tabs (`LanguageTabs.tsx`)
- **Horizontal Scrolling**: Smooth navigation through available languages
- **Popular Languages First**: Prioritized display of commonly used languages
- **Real-time Translation**: Instant translation on language selection
- **Loading States**: Visual feedback during translation process
- **Quality Indicators**: Confidence scores and cache status
- **RTL Support**: Proper layout for right-to-left languages

#### Translation Manager (`TranslationManager.tsx`)
- **Cache Statistics**: Detailed analytics dashboard
- **Export/Import**: Backup and restore translation cache
- **Cache Management**: Clear, export, and import functionality
- **Recent Translations**: History of translated content
- **Language Overview**: Comprehensive language support information

### 🔧 Developer Features

#### Translation Hook (`useTranslation.ts`)
```typescript
const {
  translate,
  isLoading,
  error,
  cache,
  clearCache,
  getCachedTranslation,
  getTranslationStats,
  detectLanguage,
  getSupportedLanguages
} = useTranslation({
  context: 'islamic', // 'islamic' | 'general' | 'quran'
  preserveFormatting: true,
  cacheTimeout: 60 * 60 * 1000, // 1 hour
  maxRetries: 3,
  retryDelay: 1000
});
```

#### Translation API (`/api/translate`)
```typescript
// POST /api/translate
{
  "text": "Content to translate",
  "targetLanguage": "es",
  "sourceLanguage": "en", // optional, auto-detected
  "context": "islamic", // 'islamic' | 'general' | 'quran'
  "preserveFormatting": true
}

// GET /api/translate
// Returns supported languages and model information
```

## Implementation Details

### Language Detection
Advanced heuristic-based language detection using:
- **Script Analysis**: Unicode ranges for different writing systems
- **Statistical Analysis**: Word frequency patterns for Latin-script languages
- **Pattern Matching**: Language-specific character combinations
- **Fallback Logic**: Default to English for ambiguous content

### Quality Scoring
Translation confidence calculated using:
- **Length Comparison**: Source vs. target text length analysis
- **Model Confidence**: Gemma-3-12B-IT internal confidence scores
- **Context Relevance**: Specialized scoring for Islamic content
- **Historical Performance**: Cache hit rates and user feedback

### Context-Aware Prompting
Specialized prompts for different content types:

#### Islamic Content
- Preserve religious terminology (Allah, Salah, Zakat, Hajj)
- Maintain reverent tone
- Keep Quranic references intact
- Use culturally appropriate expressions

#### Quranic Content
- Utmost reverence and accuracy
- Preserve verse numbering
- Maintain theological meaning
- Use established religious translations
- Keep Arabic terms without direct translations

### Caching Strategy
- **Key Generation**: Text substring + target language + context
- **Storage**: Browser localStorage with JSON serialization
- **Expiry**: Time-based with access refresh
- **Cleanup**: Automatic removal of expired entries
- **Persistence**: Survives browser sessions

## Usage Examples

### Basic Translation
```typescript
// In a React component
const { translate } = useTranslation({ context: 'islamic' });

const handleTranslate = async () => {
  try {
    const result = await translate(
      "In the name of Allah, the Most Gracious, the Most Merciful",
      "ar"
    );
    console.log(result.translatedText); // Arabic translation
    console.log(result.confidence); // Quality score
  } catch (error) {
    console.error('Translation failed:', error);
  }
};
```

### Integration in Components
```tsx
<LanguageTabs
  originalText={responseText}
  onTranslationChange={(translatedText, language) => {
    setDisplayText(translatedText);
    setCurrentLanguage(language);
  }}
  context="islamic"
  preserveFormatting={true}
/>
```

### Cache Management
```typescript
const { 
  cache, 
  clearCache, 
  getTranslationStats, 
  getCachedTranslation 
} = useTranslation();

// Get statistics
const stats = getTranslationStats();
console.log(`Total translations: ${stats.totalTranslations}`);
console.log(`Cache hits: ${stats.cacheHits}`);
console.log(`Average confidence: ${stats.averageConfidence}`);

// Check cache
const cached = getCachedTranslation(text, 'es');
if (cached) {
  console.log('Found in cache:', cached.translatedText);
}

// Clear cache
clearCache();
```

## Configuration

### Environment Variables
```env
# Multiple API keys can be provided, separated by commas
# The system will automatically fallback to the next key if one fails or exceeds limits
GEMINI_API_KEY=your_first_gemini_api_key,your_second_gemini_api_key,your_third_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL=gemma-3-12b-it
```

### Supported Languages Configuration
The system supports 30+ languages defined in the `SUPPORTED_LANGUAGES` object in `/api/translate/route.ts`. Each language includes:
- Native name and English name
- RTL (right-to-left) indicator
- Language code (ISO 639-1)

### Performance Optimization
- **Parallel Requests**: Multiple translations can run simultaneously
- **Request Cancellation**: Abort previous requests when new ones are made
- **Retry Logic**: Automatic retry with exponential backoff
- **Memory Management**: Efficient cache storage and cleanup
- **API Key Fallback**: Automatic switching between multiple API keys for reliability

## API Key Management

### Multiple API Key Support
The system now supports multiple Gemini API keys for enhanced reliability and load distribution:

- **Automatic Fallback**: If one API key fails or exceeds its quota, the system automatically switches to the next available key
- **Smart Key Selection**: Keys are selected in round-robin fashion, with failed keys temporarily excluded
- **Quota Management**: Keys that hit rate limits or quota limits are automatically marked as failed and won't be used until reset
- **Transparent Operation**: Users don't need to manually switch keys - the system handles everything automatically

### Configuration
```env
# Single key (legacy support)
GEMINI_API_KEY=your_single_api_key

# Multiple keys (recommended for production)
GEMINI_API_KEY=key1,key2,key3,key4

# Keys with spaces (automatically trimmed)
GEMINI_API_KEY= key1 , key2 , key3
```

### Key Rotation Strategy
- **Round-Robin**: Keys are used in sequence for load distribution
- **Failure Detection**: Keys are marked as failed based on error responses
- **Auto-Recovery**: Failed keys are automatically retried after other keys have been attempted
- **Monitoring**: Console logs show which key is being used for each request

## Error Handling

### Translation Errors
- **Network Issues**: Automatic retry with backoff
- **API Limits**: Graceful degradation with user feedback
- **Invalid Languages**: Validation and error messages
- **Empty Content**: Input validation and user guidance

### Cache Errors
- **Storage Limits**: Automatic cleanup of old entries
- **Corrupted Data**: Fallback to fresh translations
- **Import/Export**: File format validation and error recovery

## Security Considerations

- **Input Sanitization**: Text content validation before translation
- **Rate Limiting**: Client-side request throttling
- **API Key Protection**: Server-side API key management
- **Content Filtering**: Safety settings for translation model
- **XSS Prevention**: Proper HTML sanitization for translated content

## Future Enhancements

### Planned Features
- **Voice Translation**: Text-to-speech for translated content
- **Offline Mode**: Local translation models for basic functionality
- **User Preferences**: Customizable language priorities and settings
- **Translation History**: Persistent history across sessions
- **Collaborative Translation**: User-contributed improvements
- **Advanced Analytics**: Detailed usage and performance metrics

### Model Improvements
- **Fine-tuning**: Islamic-specific model training
- **Custom Terminology**: User-defined translation dictionaries
- **Quality Feedback**: User rating system for translations
- **Contextual Learning**: Adaptive translation based on usage patterns

## Troubleshooting

### Common Issues

#### Translation Not Working
1. Check internet connection
2. Verify API key configuration
3. Check browser console for errors
4. Clear translation cache

#### Slow Performance
1. Check cache utilization
2. Reduce concurrent translations
3. Clear old cache entries
4. Optimize network conditions

#### Quality Issues
1. Verify correct source language detection
2. Check context setting (islamic/quran/general)
3. Review translation confidence scores
4. Report issues for model improvement

### Debug Tools
- Translation Manager for cache inspection
- Browser developer tools for network analysis
- Console logging for translation flow
- Error boundaries for graceful failure handling

## Contributing

To contribute to the translation system:

1. **Language Support**: Add new languages to `SUPPORTED_LANGUAGES`
2. **Quality Improvements**: Enhance detection algorithms
3. **UI Enhancements**: Improve user interface components
4. **Performance**: Optimize caching and request handling
5. **Testing**: Add comprehensive test coverage

## License

This translation system is part of the Quran GPT project and follows the same licensing terms.

---

*This advanced translation system brings the wisdom of the Quran to speakers of all languages, maintaining the reverence and accuracy that Islamic content deserves while providing a modern, efficient user experience.*
