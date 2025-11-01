import { NextRequest, NextResponse } from 'next/server';

interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    published_date?: string;
    score?: number;
  }>;
  query: string;
  response_time: number;
}

interface ContextRequest {
  type: 'ayah' | 'hadith';
  reference: string; // e.g., "1:1" for ayah or "Bukhari 1" for hadith
  surahName?: string;
  ayahNumber?: string;
  surahNumber?: string;
  bookName?: string;
  hadithNumber?: string;
}

interface BatchContextRequest {
  batch: Array<{
    type: 'ayah' | 'hadith';
    reference: string;
    surahName?: string;
    ayahNumber?: string;
    surahNumber?: string;
    bookName?: string;
    hadithNumber?: string;
    bookSlug?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContextRequest | BatchContextRequest = await request.json();
    
    // Check if this is a batch request
    if ('batch' in body && Array.isArray(body.batch)) {
      return handleBatchRequest(body.batch);
    }
    
    // Handle single request (backward compatibility)
    const { type, reference, surahName, ayahNumber, surahNumber, bookName, hadithNumber } = body as ContextRequest;

    // Validate request
    if (!type || !reference) {
      return NextResponse.json(
        { error: 'Type and reference are required' },
        { status: 400 }
      );
    }

    // Check for TAVILY_API_KEY
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.error('Tavily API key not found in environment variables');
      // Return success with empty contexts so frontend can show a message
      return NextResponse.json({
        success: true,
        contexts: [],
        query: '',
        type,
        reference,
        error: 'TAVILY_API_KEY is missing',
      });
    }

    // Build highly specific search query based on type
    let searchQuery = '';
    
    if (type === 'ayah') {
      // Construct exact ayah reference for precise matching
      const surahDisplay = surahName || `Surah ${surahNumber}`;
      const ayahDisplay = ayahNumber || reference.split(':')[1];
      const exactReference = `${surahNumber}:${ayahDisplay}`;
      
      // Very specific query targeting exact ayah with reference number
      searchQuery = `"${surahDisplay}" "${exactReference}" verse ${ayahDisplay} tafsir explanation Islamic scholar commentary`;
    } else if (type === 'hadith') {
      // Construct exact hadith reference for precise matching
      const bookDisplay = bookName || 'Hadith';
      const hadithDisplay = hadithNumber || reference.split('-').slice(1).join('-') || reference;
      const exactReference = reference.includes('-') ? reference : `${bookDisplay} ${hadithDisplay}`;
      
      // Very specific query targeting exact hadith with book and number
      searchQuery = `"${bookDisplay}" hadith ${hadithDisplay} "${exactReference}" explanation Islamic scholar commentary`;
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "ayah" or "hadith"' },
        { status: 400 }
      );
    }

    // Call Tavily API
    try {
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: searchQuery,
          search_depth: 'advanced',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: 10, // Fetch more to filter for best ones
          include_domains: [], // Empty means search all domains
          exclude_domains: [], // Can exclude specific domains if needed
        }),
      });

      if (!tavilyResponse.ok) {
        const errorText = await tavilyResponse.text();
        console.error('Tavily API error:', errorText);
        // Return success with empty contexts so frontend can still display the section
        return NextResponse.json({
          success: true,
          contexts: [],
          query: searchQuery,
          type,
          reference,
          error: 'Failed to fetch from Tavily API',
        });
      }

      const data: TavilySearchResponse = await tavilyResponse.json();

      // Format results and filter for relevance to exact ayah/hadith
      const exactReference = type === 'ayah' 
        ? `${surahNumber}:${ayahNumber || reference.split(':')[1]}`
        : reference;
      
      const contexts = (data.results || [])
        .map((result) => {
          const content = (result.content || '').toLowerCase();
          const title = (result.title || '').toLowerCase();
          
          // Check if result actually mentions the exact reference (strict matching)
          const ayahNum = ayahNumber || reference.split(':')[1];
          const mentionsReference = 
            // Direct reference match (e.g., "2:255" or "Surah 2:255")
            content.includes(exactReference.toLowerCase()) ||
            title.includes(exactReference.toLowerCase()) ||
            // For ayah: must include surah number AND verse number together
            (type === 'ayah' && (
              content.includes(`${surahNumber}:${ayahNum}`) || 
              content.includes(`verse ${ayahNum}`) ||
              content.includes(`ayat ${ayahNum}`) ||
              (surahName && content.includes(surahName.toLowerCase()) && content.includes(`verse ${ayahNum}`)) ||
              (surahName && content.includes(surahName.toLowerCase()) && content.includes(`ayat ${ayahNum}`))
            )) ||
            // For hadith: must include book name AND hadith number together
            (type === 'hadith' && (
              content.includes(hadithNumber?.toLowerCase() || '') ||
              (bookName && content.includes(bookName.toLowerCase()) && 
               hadithNumber && content.includes(hadithNumber.toLowerCase()))
            ));
          
          return {
            title: result.title || 'Untitled',
            url: result.url || '#',
            snippet: (result.content?.substring(0, 200) || '') + (result.content && result.content.length > 200 ? '...' : ''),
            score: result.score || 0,
            relevance: mentionsReference ? 1 : 0,
          };
        })
        .filter(context => context.relevance > 0); // Only include results that mention the exact reference

      // Prioritize trusted Islamic sources with scoring (only relevant contexts remain)
      const scoredContexts = contexts.map(context => {
        if (!context.url || context.url === '#') return { ...context, trustScore: 0 };
        
        const url = context.url.toLowerCase();
        const title = (context.title || '').toLowerCase();
        let trustScore = 0;
        
        // Highly trusted domains (score: 100)
        const highlyTrustedDomains = [
          'islamqa.info', 'islamqa.org', 'islamqa.com', 'islamweb.net', 
          'islamway.net', 'islamhouse.com', 'dar-alifta.org', 'al-islam.org',
          'quran.com', 'sunnah.com'
        ];
        
        // Medium trusted domains (score: 75)
        const mediumTrustedDomains = [
          'islamicfinder.org', 'muslim.or.id', 'islamreligion.com',
          'islamicity.org', 'islamonline.net', 'discoverislam.com'
        ];
        
        // Check highly trusted first
        if (highlyTrustedDomains.some(domain => url.includes(domain))) {
          trustScore = 100;
        } else if (mediumTrustedDomains.some(domain => url.includes(domain))) {
          trustScore = 75;
        } else if (url.includes('islam') || url.includes('quran') || url.includes('hadith') || 
                   url.includes('tafsir') || url.includes('mufti') || url.includes('sheikh')) {
          trustScore = 50;
        } else if (title.includes('tafsir') || title.includes('explanation') || 
                   title.includes('commentary') || title.includes('islamic scholar')) {
          trustScore = 30;
        } else {
          trustScore = 10;
        }
        
        // Boost score if title is relevant
        if (title.includes('tafsir') || title.includes('explanation')) trustScore += 10;
        
        return { ...context, trustScore };
      });
      
      // Filter out low-trust contexts and sort by trust score + relevance score
      const filteredContexts = scoredContexts
        .filter(context => context.trustScore > 0)
        .sort((a, b) => {
          // Sort by trust score first, then by relevance score
          const scoreDiff = b.trustScore - a.trustScore;
          if (scoreDiff !== 0) return scoreDiff;
          return (b.score || 0) - (a.score || 0);
        });

      // Return top 3 most trusted contexts
      const finalContexts = filteredContexts.slice(0, 3);

      return NextResponse.json({
        success: true,
        contexts: finalContexts,
        query: searchQuery,
        type,
        reference,
      });
    } catch (fetchError) {
      console.error('Error fetching from Tavily API:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch context', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in context API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle batch requests for multiple contexts at once
async function handleBatchRequest(
  batch: Array<{
    type: 'ayah' | 'hadith';
    reference: string;
    surahName?: string;
    ayahNumber?: string;
    surahNumber?: string;
    bookName?: string;
    hadithNumber?: string;
    bookSlug?: string;
  }>
) {
  // Check for TAVILY_API_KEY
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error('Tavily API key not found in environment variables');
    return NextResponse.json({
      success: true,
      results: batch.map(item => ({
        reference: item.reference,
        type: item.type,
        contexts: [],
        error: 'TAVILY_API_KEY is missing',
      })),
    });
  }

  // Process all batch items in parallel
  const results = await Promise.all(
    batch.map(async (item) => {
      try {
        const { type, reference, surahName, ayahNumber, surahNumber, bookName, hadithNumber } = item;
        
        // Build highly specific search query based on type
        let searchQuery = '';
        
        if (type === 'ayah') {
          // Construct exact ayah reference for precise matching
          const surahDisplay = surahName || `Surah ${surahNumber}`;
          const ayahDisplay = ayahNumber || reference.split(':')[1];
          const exactReference = `${surahNumber}:${ayahDisplay}`;
          
          // Very specific query targeting exact ayah with reference number
          searchQuery = `"${surahDisplay}" "${exactReference}" verse ${ayahDisplay} tafsir explanation Islamic scholar commentary`;
        } else if (type === 'hadith') {
          // Construct exact hadith reference for precise matching
          const bookDisplay = bookName || 'Hadith';
          const hadithDisplay = hadithNumber || reference.split('-').slice(1).join('-') || reference;
          const exactReference = reference.includes('-') ? reference : `${bookDisplay} ${hadithDisplay}`;
          
          // Very specific query targeting exact hadith with book and number
          searchQuery = `"${bookDisplay}" hadith ${hadithDisplay} "${exactReference}" explanation Islamic scholar commentary`;
        } else {
          return {
            reference,
            type,
            contexts: [],
            error: 'Invalid type',
          };
        }

        // Call Tavily API
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: apiKey,
            query: searchQuery,
            search_depth: 'advanced',
            include_answer: false,
            include_images: false,
            include_raw_content: false,
            max_results: 10,
            include_domains: [],
            exclude_domains: [],
          }),
        });

        if (!tavilyResponse.ok) {
          return {
            reference,
            type,
            contexts: [],
            error: 'Failed to fetch from Tavily API',
          };
        }

        const data: TavilySearchResponse = await tavilyResponse.json();

        // Format results and filter for relevance to exact ayah/hadith
        const exactReference = type === 'ayah' 
          ? `${surahNumber}:${ayahNumber || reference.split(':')[1]}`
          : reference;
        
        const contexts = (data.results || [])
          .map((result) => {
            const content = (result.content || '').toLowerCase();
            const title = (result.title || '').toLowerCase();
            
            // Check if result actually mentions the exact reference (strict matching)
            const ayahNum = ayahNumber || reference.split(':')[1];
            const mentionsReference = 
              // Direct reference match (e.g., "2:255" or "Surah 2:255")
              content.includes(exactReference.toLowerCase()) ||
              title.includes(exactReference.toLowerCase()) ||
              // For ayah: must include surah number AND verse number together
              (type === 'ayah' && (
                content.includes(`${surahNumber}:${ayahNum}`) || 
                content.includes(`verse ${ayahNum}`) ||
                content.includes(`ayat ${ayahNum}`) ||
                (surahName && content.includes(surahName.toLowerCase()) && content.includes(`verse ${ayahNum}`)) ||
                (surahName && content.includes(surahName.toLowerCase()) && content.includes(`ayat ${ayahNum}`))
              )) ||
              // For hadith: must include book name AND hadith number together
              (type === 'hadith' && (
                content.includes(hadithNumber?.toLowerCase() || '') ||
                (bookName && content.includes(bookName.toLowerCase()) && 
                 hadithNumber && content.includes(hadithNumber.toLowerCase()))
              ));
            
            return {
              title: result.title || 'Untitled',
              url: result.url || '#',
              snippet: (result.content?.substring(0, 200) || '') + (result.content && result.content.length > 200 ? '...' : ''),
              score: result.score || 0,
              relevance: mentionsReference ? 1 : 0,
            };
          })
          .filter(context => context.relevance > 0); // Only include results that mention the exact reference

        // Prioritize trusted sources (only relevant contexts remain from filtering)
        const scoredContexts = contexts.map(context => {
          if (!context.url || context.url === '#') return { ...context, trustScore: 0 };
          
          const url = context.url.toLowerCase();
          const title = (context.title || '').toLowerCase();
          let trustScore = 0;
          
          const highlyTrustedDomains = [
            'islamqa.info', 'islamqa.org', 'islamqa.com', 'islamweb.net', 
            'islamway.net', 'islamhouse.com', 'dar-alifta.org', 'al-islam.org',
            'quran.com', 'sunnah.com'
          ];
          
          const mediumTrustedDomains = [
            'islamicfinder.org', 'muslim.or.id', 'islamreligion.com',
            'islamicity.org', 'islamonline.net', 'discoverislam.com'
          ];
          
          if (highlyTrustedDomains.some(domain => url.includes(domain))) {
            trustScore = 100;
          } else if (mediumTrustedDomains.some(domain => url.includes(domain))) {
            trustScore = 75;
          } else if (url.includes('islam') || url.includes('quran') || url.includes('hadith') || 
                     url.includes('tafsir') || url.includes('mufti') || url.includes('sheikh')) {
            trustScore = 50;
          } else if (title.includes('tafsir') || title.includes('explanation') || 
                     title.includes('commentary') || title.includes('islamic scholar')) {
            trustScore = 30;
          } else {
            trustScore = 10;
          }
          
          if (title.includes('tafsir') || title.includes('explanation')) trustScore += 10;
          
          return { ...context, trustScore };
        });
        
        const filteredContexts = scoredContexts
          .filter(context => context.trustScore > 0)
          .sort((a, b) => {
            const scoreDiff = b.trustScore - a.trustScore;
            if (scoreDiff !== 0) return scoreDiff;
            return (b.score || 0) - (a.score || 0);
          });

        const finalContexts = filteredContexts.slice(0, 3);

        return {
          reference,
          type,
          contexts: finalContexts,
          query: searchQuery,
        };
      } catch (error) {
        console.error(`Error fetching context for ${item.reference}:`, error);
        return {
          reference: item.reference,
          type: item.type,
          contexts: [],
          error: 'Failed to fetch context',
        };
      }
    })
  );

  return NextResponse.json({
    success: true,
    results,
  });
}

