import { NextRequest, NextResponse } from 'next/server';
import { GeminiApiManager } from '../../utils/geminiApiManager';

// Simple in-memory rate limiter with improved caching
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const translationCache = new Map<string, { translation: any; timestamp: number; ttl: number }>();

// Rate limiting configuration - more generous for better performance
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // Increased from 10 to 20 for better performance
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userData = rateLimitMap.get(ip);
  
  if (!userData || now > userData.resetTime) {
    // Reset or create new rate limit data
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (userData.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  userData.count++;
  return false;
}

function getCachedTranslation(text: string, targetLanguage: string, context: string): any | null {
  const cacheKey = `${text.substring(0, 200)}_${targetLanguage}_${context}`;
  const cached = translationCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.translation;
  }
  
  // Remove expired cache entry
  if (cached) {
    translationCache.delete(cacheKey);
  }
  
  return null;
}

function setCachedTranslation(text: string, targetLanguage: string, context: string, translation: any): void {
  const cacheKey = `${text.substring(0, 200)}_${targetLanguage}_${context}`;
  translationCache.set(cacheKey, {
    translation,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  });
  
  // Clean up old cache entries if cache gets too large
  if (translationCache.size > 1000) {
    const entries = Array.from(translationCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 200 entries
    entries.slice(0, 200).forEach(([key]) => translationCache.delete(key));
  }
}

function getClientIP(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return 'unknown';
}

interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: 'islamic' | 'general' | 'quran';
  preserveFormatting?: boolean;
}

interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  translationId: string;
}

// Comprehensive language mapping with native names and RTL support (125+ languages)
const SUPPORTED_LANGUAGES = {
  // Major World Languages (Popular First)
  'en': { name: 'English', nativeName: 'English', rtl: false, code: 'en' },
  'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true, code: 'ar' },
  'ur': { name: 'Urdu', nativeName: 'اردو', rtl: true, code: 'ur' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', rtl: false, code: 'hi' },
  'bn': { name: 'Bengali', nativeName: 'বাংলা', rtl: false, code: 'bn' },
  'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false, code: 'id' },
  'ms': { name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false, code: 'ms' },
  'tr': { name: 'Turkish', nativeName: 'Türkçe', rtl: false, code: 'tr' },
  'fa': { name: 'Persian', nativeName: 'فارسی', rtl: true, code: 'fa' },
  'es': { name: 'Spanish', nativeName: 'Español', rtl: false, code: 'es' },
  'fr': { name: 'French', nativeName: 'Français', rtl: false, code: 'fr' },
  'de': { name: 'German', nativeName: 'Deutsch', rtl: false, code: 'de' },
  'ru': { name: 'Russian', nativeName: 'Русский', rtl: false, code: 'ru' },
  'zh': { name: 'Chinese', nativeName: '中文', rtl: false, code: 'zh' },
  'ja': { name: 'Japanese', nativeName: '日本語', rtl: false, code: 'ja' },
  'ko': { name: 'Korean', nativeName: '한국어', rtl: false, code: 'ko' },
  'it': { name: 'Italian', nativeName: 'Italiano', rtl: false, code: 'it' },
  'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false, code: 'pt' },
  'ta': { name: 'Tamil', nativeName: 'தமிழ்', rtl: false, code: 'ta' },
  'te': { name: 'Telugu', nativeName: 'తెలుగు', rtl: false, code: 'te' },
  'ml': { name: 'Malayalam', nativeName: 'മലയാളം', rtl: false, code: 'ml' },
  'th': { name: 'Thai', nativeName: 'ไทย', rtl: false, code: 'th' },
  'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false, code: 'vi' },
  'sw': { name: 'Swahili', nativeName: 'Kiswahili', rtl: false, code: 'sw' },
  'ha': { name: 'Hausa', nativeName: 'Hausa', rtl: false, code: 'ha' },
  'yo': { name: 'Yoruba', nativeName: 'Yorùbá', rtl: false, code: 'yo' },
  'ig': { name: 'Igbo', nativeName: 'Igbo', rtl: false, code: 'ig' },
  'am': { name: 'Amharic', nativeName: 'አማርኛ', rtl: false, code: 'am' },
  'so': { name: 'Somali', nativeName: 'Soomaali', rtl: false, code: 'so' },
  'ku': { name: 'Kurdish', nativeName: 'کوردی', rtl: true, code: 'ku' },
  'ps': { name: 'Pashto', nativeName: 'پښتو', rtl: true, code: 'ps' },
  'sd': { name: 'Sindhi', nativeName: 'سنڌي', rtl: true, code: 'sd' },
  'ug': { name: 'Uyghur', nativeName: 'ئۇيغۇرچە', rtl: true, code: 'ug' },

  // European Languages
  'nl': { name: 'Dutch', nativeName: 'Nederlands', rtl: false, code: 'nl' },
  'pl': { name: 'Polish', nativeName: 'Polski', rtl: false, code: 'pl' },
  'sv': { name: 'Swedish', nativeName: 'Svenska', rtl: false, code: 'sv' },
  'da': { name: 'Danish', nativeName: 'Dansk', rtl: false, code: 'da' },
  'no': { name: 'Norwegian', nativeName: 'Norsk', rtl: false, code: 'no' },
  'fi': { name: 'Finnish', nativeName: 'Suomi', rtl: false, code: 'fi' },
  'is': { name: 'Icelandic', nativeName: 'Íslenska', rtl: false, code: 'is' },
  'cs': { name: 'Czech', nativeName: 'Čeština', rtl: false, code: 'cs' },
  'sk': { name: 'Slovak', nativeName: 'Slovenčina', rtl: false, code: 'sk' },
  'hu': { name: 'Hungarian', nativeName: 'Magyar', rtl: false, code: 'hu' },
  'ro': { name: 'Romanian', nativeName: 'Română', rtl: false, code: 'ro' },
  'bg': { name: 'Bulgarian', nativeName: 'Български', rtl: false, code: 'bg' },
  'hr': { name: 'Croatian', nativeName: 'Hrvatski', rtl: false, code: 'hr' },
  'sr': { name: 'Serbian', nativeName: 'Српски', rtl: false, code: 'sr' },
  'bs': { name: 'Bosnian', nativeName: 'Bosanski', rtl: false, code: 'bs' },
  'sl': { name: 'Slovenian', nativeName: 'Slovenščina', rtl: false, code: 'sl' },
  'mk': { name: 'Macedonian', nativeName: 'Македонски', rtl: false, code: 'mk' },
  'sq': { name: 'Albanian', nativeName: 'Shqip', rtl: false, code: 'sq' },
  'el': { name: 'Greek', nativeName: 'Ελληνικά', rtl: false, code: 'el' },
  'lv': { name: 'Latvian', nativeName: 'Latviešu', rtl: false, code: 'lv' },
  'lt': { name: 'Lithuanian', nativeName: 'Lietuvių', rtl: false, code: 'lt' },
  'et': { name: 'Estonian', nativeName: 'Eesti', rtl: false, code: 'et' },
  'mt': { name: 'Maltese', nativeName: 'Malti', rtl: false, code: 'mt' },
  'ga': { name: 'Irish', nativeName: 'Gaeilge', rtl: false, code: 'ga' },
  'cy': { name: 'Welsh', nativeName: 'Cymraeg', rtl: false, code: 'cy' },
  'eu': { name: 'Basque', nativeName: 'Euskera', rtl: false, code: 'eu' },
  'ca': { name: 'Catalan', nativeName: 'Català', rtl: false, code: 'ca' },
  'gl': { name: 'Galician', nativeName: 'Galego', rtl: false, code: 'gl' },

  // Asian Languages
  'zh-cn': { name: 'Chinese (Simplified)', nativeName: '简体中文', rtl: false, code: 'zh-cn' },
  'zh-tw': { name: 'Chinese (Traditional)', nativeName: '繁體中文', rtl: false, code: 'zh-tw' },
  'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false, code: 'kn' },
  'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false, code: 'gu' },
  'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false, code: 'pa' },
  'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', rtl: false, code: 'or' },
  'as': { name: 'Assamese', nativeName: 'অসমীয়া', rtl: false, code: 'as' },
  'mr': { name: 'Marathi', nativeName: 'मराठी', rtl: false, code: 'mr' },
  'ne': { name: 'Nepali', nativeName: 'नेपाली', rtl: false, code: 'ne' },
  'si': { name: 'Sinhala', nativeName: 'සිංහල', rtl: false, code: 'si' },
  'my': { name: 'Myanmar', nativeName: 'မြန်မာ', rtl: false, code: 'my' },
  'km': { name: 'Khmer', nativeName: 'ខ្មែរ', rtl: false, code: 'km' },
  'lo': { name: 'Lao', nativeName: 'ລາວ', rtl: false, code: 'lo' },
  'ka': { name: 'Georgian', nativeName: 'ქართული', rtl: false, code: 'ka' },
  'hy': { name: 'Armenian', nativeName: 'Հայերեն', rtl: false, code: 'hy' },
  'az': { name: 'Azerbaijani', nativeName: 'Azərbaycan', rtl: false, code: 'az' },
  'kk': { name: 'Kazakh', nativeName: 'Қазақша', rtl: false, code: 'kk' },
  'ky': { name: 'Kyrgyz', nativeName: 'Кыргызча', rtl: false, code: 'ky' },
  'uz': { name: 'Uzbek', nativeName: 'O\'zbek', rtl: false, code: 'uz' },
  'tk': { name: 'Turkmen', nativeName: 'Türkmen', rtl: false, code: 'tk' },
  'tg': { name: 'Tajik', nativeName: 'Тоҷикӣ', rtl: false, code: 'tg' },
  'mn': { name: 'Mongolian', nativeName: 'Монгол', rtl: false, code: 'mn' },

  // Middle Eastern & Semitic Languages
  'he': { name: 'Hebrew', nativeName: 'עברית', rtl: true, code: 'he' },
  'yi': { name: 'Yiddish', nativeName: 'ייִדיש', rtl: true, code: 'yi' },
  'ar-eg': { name: 'Arabic (Egyptian)', nativeName: 'العربية المصرية', rtl: true, code: 'ar-eg' },
  'ar-sa': { name: 'Arabic (Saudi)', nativeName: 'العربية السعودية', rtl: true, code: 'ar-sa' },
  'ckb': { name: 'Central Kurdish', nativeName: 'کوردیی ناوەندی', rtl: true, code: 'ckb' },

  // African Languages
  'af': { name: 'Afrikaans', nativeName: 'Afrikaans', rtl: false, code: 'af' },
  'zu': { name: 'Zulu', nativeName: 'IsiZulu', rtl: false, code: 'zu' },
  'xh': { name: 'Xhosa', nativeName: 'IsiXhosa', rtl: false, code: 'xh' },
  'st': { name: 'Sotho', nativeName: 'Sesotho', rtl: false, code: 'st' },
  'tn': { name: 'Tswana', nativeName: 'Setswana', rtl: false, code: 'tn' },
  'ss': { name: 'Swati', nativeName: 'SiSwati', rtl: false, code: 'ss' },
  've': { name: 'Venda', nativeName: 'Tshivenda', rtl: false, code: 've' },
  'ts': { name: 'Tsonga', nativeName: 'Xitsonga', rtl: false, code: 'ts' },
  'nr': { name: 'Ndebele', nativeName: 'IsiNdebele', rtl: false, code: 'nr' },
  'rw': { name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', rtl: false, code: 'rw' },
  'rn': { name: 'Kirundi', nativeName: 'Ikirundi', rtl: false, code: 'rn' },
  'lg': { name: 'Luganda', nativeName: 'Luganda', rtl: false, code: 'lg' },
  'ak': { name: 'Akan', nativeName: 'Akan', rtl: false, code: 'ak' },
  'tw': { name: 'Twi', nativeName: 'Twi', rtl: false, code: 'tw' },
  'ff': { name: 'Fulah', nativeName: 'Fulfulde', rtl: false, code: 'ff' },
  'wo': { name: 'Wolof', nativeName: 'Wolof', rtl: false, code: 'wo' },
  'bm': { name: 'Bambara', nativeName: 'Bamanankan', rtl: false, code: 'bm' },
  'dyu': { name: 'Dyula', nativeName: 'Dyula', rtl: false, code: 'dyu' },
  'ee': { name: 'Ewe', nativeName: 'Eʋegbe', rtl: false, code: 'ee' },
  'gaa': { name: 'Ga', nativeName: 'Gã', rtl: false, code: 'gaa' },
  'ti': { name: 'Tigrinya', nativeName: 'ትግርኛ', rtl: false, code: 'ti' },
  'om': { name: 'Oromo', nativeName: 'Afaan Oromoo', rtl: false, code: 'om' },

  // Native American Languages
  'qu': { name: 'Quechua', nativeName: 'Runasimi', rtl: false, code: 'qu' },
  'gn': { name: 'Guarani', nativeName: 'Avañe\'ẽ', rtl: false, code: 'gn' },
  'nah': { name: 'Nahuatl', nativeName: 'Nahuatl', rtl: false, code: 'nah' },
  'ay': { name: 'Aymara', nativeName: 'Aymar aru', rtl: false, code: 'ay' },

  // Pacific Languages
  'mi': { name: 'Maori', nativeName: 'Te Reo Māori', rtl: false, code: 'mi' },
  'sm': { name: 'Samoan', nativeName: 'Gagana Samoa', rtl: false, code: 'sm' },
  'to': { name: 'Tongan', nativeName: 'Lea Fakatonga', rtl: false, code: 'to' },
  'fj': { name: 'Fijian', nativeName: 'Na Vosa Vakaviti', rtl: false, code: 'fj' },
  'haw': { name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', rtl: false, code: 'haw' },

  // Additional Languages
  'eo': { name: 'Esperanto', nativeName: 'Esperanto', rtl: false, code: 'eo' },
  'la': { name: 'Latin', nativeName: 'Latina', rtl: false, code: 'la' },
  'jv': { name: 'Javanese', nativeName: 'Basa Jawa', rtl: false, code: 'jv' },
  'su': { name: 'Sundanese', nativeName: 'Basa Sunda', rtl: false, code: 'su' },
  'ceb': { name: 'Cebuano', nativeName: 'Sinugbuanong Binisaya', rtl: false, code: 'ceb' },
  'tl': { name: 'Filipino', nativeName: 'Filipino', rtl: false, code: 'tl' },
  'hmn': { name: 'Hmong', nativeName: 'Hmoob', rtl: false, code: 'hmn' },
  'co': { name: 'Corsican', nativeName: 'Corsu', rtl: false, code: 'co' },
  'fy': { name: 'Frisian', nativeName: 'Frysk', rtl: false, code: 'fy' },
  'ht': { name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', rtl: false, code: 'ht' },
  'lb': { name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', rtl: false, code: 'lb' },
  'mg': { name: 'Malagasy', nativeName: 'Malagasy', rtl: false, code: 'mg' },
  'ny': { name: 'Chichewa', nativeName: 'Chichewa', rtl: false, code: 'ny' },
  'sn': { name: 'Shona', nativeName: 'ChiShona', rtl: false, code: 'sn' },
  'be': { name: 'Belarusian', nativeName: 'Беларуская', rtl: false, code: 'be' },
  'uk': { name: 'Ukrainian', nativeName: 'Українська', rtl: false, code: 'uk' }
};

// Generate translation ID
function generateTranslationId(): string {
  return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Detect source language from text (simplified heuristic)
function detectLanguage(text: string): string {
  const arabicPattern = /[\u0600-\u06FF]/;
  const chinesePattern = /[\u4e00-\u9fff]/;
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanPattern = /[\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;
  const devanagariPattern = /[\u0900-\u097F]/;
  const bengaliPattern = /[\u0980-\u09FF]/;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  const thaiPattern = /[\u0E00-\u0E7F]/;

  if (arabicPattern.test(text)) return 'ar';
  if (chinesePattern.test(text)) return 'zh';
  if (japanesePattern.test(text)) return 'ja';
  if (koreanPattern.test(text)) return 'ko';
  if (cyrillicPattern.test(text)) return 'ru';
  if (devanagariPattern.test(text)) return 'hi';
  if (bengaliPattern.test(text)) return 'bn';
  if (tamilPattern.test(text)) return 'ta';
  if (thaiPattern.test(text)) return 'th';
  
  return 'en'; // Default to English
}

// Create context-aware translation prompt
function createTranslationPrompt(
  text: string,
  targetLang: string,
  sourceLang: string,
  context: string = 'general',
  preserveFormatting: boolean = true
): string {
  const targetLanguageInfo = SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES];
  const sourceLanguageInfo = SUPPORTED_LANGUAGES[sourceLang as keyof typeof SUPPORTED_LANGUAGES];
  
  let contextInstructions = '';
  
  switch (context) {
    case 'islamic':
      contextInstructions = `
This text contains Islamic content including Quranic references, religious terminology, and spiritual concepts. 
Please:
- Preserve Islamic terminology accuracy (e.g., Allah, Salah, Zakat, Hajj)
- Maintain reverent tone appropriate for religious content
- Keep Quranic verse references intact (e.g., Surah Al-Fatiha 1:1)
- Use culturally appropriate religious expressions
- Preserve the spiritual meaning and context`;
      break;
    case 'quran':
      contextInstructions = `
This text contains Quranic verses and commentary. Please:
- Treat Quranic content with utmost reverence and accuracy
- Preserve verse numbering and references exactly
- Maintain the spiritual and theological meaning
- Use established religious translations when available
- Keep Arabic terms that have no direct translation
- Preserve any HTML formatting for verse display`;
      break;
    default:
      contextInstructions = `
This is general text that may contain various topics. Please provide an accurate and natural translation.`;
  }

  const formattingInstructions = preserveFormatting 
    ? `
IMPORTANT: Preserve ALL HTML formatting, tags, and structure exactly as they appear. This includes:
- HTML tags like <div>, <span>, <p>, <strong>, <em>, etc.
- CSS classes and attributes
- Audio player placeholders and data attributes
- Any special formatting or markup
- Line breaks and spacing

Only translate the actual text content within the HTML tags, not the HTML structure itself.`
    : `
Provide a clean text translation without HTML formatting.`;

  return `You are a professional translator. Your ONLY task is to translate the existing content provided below.

TRANSLATE FROM: ${sourceLanguageInfo?.name || sourceLang}
TRANSLATE TO: ${targetLanguageInfo?.name || targetLang}

IMPORTANT RULES:
- ONLY translate the existing text content
- Do NOT generate new content or add explanations
- Do NOT modify the meaning or add interpretations
${context === 'islamic' ? '- Preserve Islamic terminology and religious references exactly' : ''}
${preserveFormatting ? '- Keep ALL HTML tags and formatting exactly as provided' : ''}

EXISTING CONTENT TO TRANSLATE:
${text}

Provide ONLY the translated version of the above content. Nothing else.`;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIP = getClientIP(request);
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many translation requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body: TranslationRequest = await request.json();
    const { text, targetLanguage, sourceLanguage, context = 'general', preserveFormatting = true } = body;

    // Validation
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required for translation' },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      );
    }

    if (!(targetLanguage in SUPPORTED_LANGUAGES)) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLanguage}` },
        { status: 400 }
      );
    }

    // Detect source language if not provided
    const detectedSourceLang = sourceLanguage || detectLanguage(text);
    
    // Skip translation if source and target are the same
    if (detectedSourceLang === targetLanguage) {
      return NextResponse.json({
        translatedText: text,
        sourceLanguage: detectedSourceLang,
        targetLanguage,
        confidence: 1.0,
        translationId: generateTranslationId()
      });
    }

    // Check cache first
    const cachedTranslation = getCachedTranslation(text, targetLanguage, context);
    if (cachedTranslation) {
      // Cache hit - returning cached translation
      return NextResponse.json({
        translatedText: cachedTranslation.translatedText,
        sourceLanguage: detectedSourceLang,
        targetLanguage,
        confidence: cachedTranslation.confidence,
        translationId: cachedTranslation.translationId
      });
    }

    // Initialize Gemini API Manager for translation
    let apiManager: GeminiApiManager;
    try {
      apiManager = new GeminiApiManager();
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Translation service is not configured' },
        { status: 500 }
      );
    }

    // Using API keys for translation

    const translationResult = await apiManager.translateText(
      text,
      targetLanguage,
      detectedSourceLang,
      context,
      preserveFormatting,
      'gemini-2.0-flash'
    );

    if (!translationResult.success) {
      // Translation API error - silent fail for security
      
      // Handle specific error types
      if (translationResult.statusCode === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (translationResult.statusCode === 403) {
        return NextResponse.json(
          { error: 'Translation quota exceeded. Please try again later.' },
          { status: 403 }
        );
      }
      
      if (translationResult.statusCode === 400) {
        return NextResponse.json(
          { error: 'Translation failed due to invalid request' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: translationResult.error || 'Translation failed' },
        { status: 500 }
      );
    }

    const data = translationResult.data;
    if (!data) {
      return NextResponse.json(
        { error: 'Translation returned invalid data' },
        { status: 500 }
      );
    }

    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!translatedText.trim()) {
      return NextResponse.json(
        { error: 'Translation returned empty result' },
        { status: 500 }
      );
    }

    // Calculate confidence score based on response quality
    const confidence = Math.min(0.95, Math.max(0.7, 
      1 - (Math.abs(text.length - translatedText.length) / Math.max(text.length, translatedText.length))
    ));

    const translationResponse: TranslationResponse = {
      translatedText: translatedText.trim(),
      sourceLanguage: detectedSourceLang,
      targetLanguage,
      confidence,
      translationId: generateTranslationId()
    };

    // Cache the translation result
    setCachedTranslation(text, targetLanguage, context, {
      translatedText: translatedText.trim(),
      confidence,
      translationId: generateTranslationId()
    });

    return NextResponse.json(translationResponse);

  } catch (error) {
    // Error handling for unexpected issues
    return NextResponse.json(
      { error: 'Failed to process translation request' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve supported languages
export async function GET() {
  try {
    return NextResponse.json({
      supportedLanguages: SUPPORTED_LANGUAGES,
      totalLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
      model: 'gemini-1.5-pro'
    });
  } catch (error) {
    // Error handling for unexpected issues
    return NextResponse.json(
      { error: 'Failed to fetch supported languages' },
      { status: 500 }
    );
  }
}