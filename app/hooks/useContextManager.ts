import { useEffect } from 'react';

interface ContextItem {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export const useContextManager = () => {
  useEffect(() => {
    const fetchedContexts = new Set<string>(); // Track which contexts have been fetched

    const fetchContexts = async (element: HTMLElement, type: 'ayah' | 'hadith') => {
      // Get context identifier
      const contextAttr = type === 'ayah' ? 'data-ayah-context' : 'data-hadith-context';
      const contextKey = element.getAttribute(contextAttr);
      
      if (!contextKey || fetchedContexts.has(contextKey)) {
        return; // Already fetched or no key
      }

      fetchedContexts.add(contextKey);

      // Find the loading indicator and context list
      const loadingIndicator = element.querySelector(
        type === 'ayah' ? '.ayah-context-loading' : '.hadith-context-loading'
      ) as HTMLElement;
      const contextList = element.querySelector(
        type === 'ayah' ? '.ayah-context-list' : '.hadith-context-list'
      ) as HTMLElement;

      if (!loadingIndicator || !contextList) {
        console.warn(`Missing ${type} context elements:`, { loadingIndicator, contextList });
        return;
      }

      // Show loading state immediately (it's already visible by default)
      // Ensure context section is visible
      element.style.display = 'block';

      try {
        // Build request body based on type
        let requestBody: any = {
          type,
          reference: contextKey,
        };

        if (type === 'ayah') {
          // Get ayah details from the ayah box
          const ayahBox = element.closest('.stylish-ayah-reference');
          if (ayahBox) {
            requestBody.surahName = ayahBox.getAttribute('data-surah-name');
            requestBody.ayahNumber = ayahBox.getAttribute('data-ayah-number');
            requestBody.surahNumber = ayahBox.getAttribute('data-surah-number');
          }
        } else if (type === 'hadith') {
          // Get hadith details from the hadith box
          const hadithBox = element.closest('.stylish-hadith-reference');
          if (hadithBox) {
            requestBody.bookName = hadithBox.getAttribute('data-book-name') || '';
            const hadithNum = hadithBox.getAttribute('data-hadith-number');
            // Extract book slug and hadith number from contextKey (format: "bukhari-123")
            const parts = contextKey.split('-');
            if (parts.length >= 2) {
              requestBody.bookSlug = parts[0];
              requestBody.hadithNumber = parts.slice(1).join('-') || hadithNum || '';
            } else {
              requestBody.hadithNumber = hadithNum || '';
            }
          } else {
            // Fallback: parse from contextKey
            const parts = contextKey.split('-');
            if (parts.length >= 2) {
              requestBody.bookSlug = parts[0];
              requestBody.hadithNumber = parts.slice(1).join('-');
            }
          }
        }

        // Fetch contexts from API
        console.log('Calling /api/context with:', requestBody);
        const response = await fetch('/api/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('Context API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log(`Context fetch successful for ${type}:`, data.contexts?.length || 0, 'contexts found');
        
        if (data.success && data.contexts && data.contexts.length > 0) {
          // Hide loading indicator
          if (loadingIndicator) loadingIndicator.classList.add('hidden');

          // Render contexts directly - no heading needed
          contextList.innerHTML = data.contexts
            .map((context: ContextItem) => `
              <a 
                href="${context.url}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="block p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-0.5">
                    <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1 line-clamp-2">
                      ${context.title}
                    </h5>
                    <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      ${context.snippet}
                    </p>
                    <div class="mt-1.5 flex items-center gap-2">
                      <span class="text-xs text-gray-400 dark:text-gray-500 truncate">
                        ${new URL(context.url).hostname.replace('www.', '')}
                      </span>
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            `)
            .join('');
        } else {
          // No contexts found or error from API - hide the section entirely
          console.log(`No contexts found for ${type}:`, contextKey, data.error || 'No error');
          // Hide the entire context section if no contexts found
          element.style.display = 'none';
        }
      } catch (error) {
        // Hide the entire section on error
        console.error(`Error fetching contexts for ${type}:`, error, contextKey);
        element.style.display = 'none';
      }
    };

    // Function to process context sections
    const processContextSections = () => {
      // Process ayah contexts
      const ayahContextSections = document.querySelectorAll('.ayah-context-section');
      console.log('🔍 Processing ayah contexts:', ayahContextSections.length);
      
      if (ayahContextSections.length === 0) {
        console.warn('⚠️ No ayah context sections found in DOM');
      }
      
      ayahContextSections.forEach((section, index) => {
        const element = section as HTMLElement;
        const contextKey = element.getAttribute('data-ayah-context');
        console.log(`📖 Ayah ${index + 1}:`, contextKey, 'already fetched?', fetchedContexts.has(contextKey || ''));
        
        if (contextKey && !fetchedContexts.has(contextKey)) {
          console.log('🚀 Fetching context for ayah:', contextKey);
          fetchContexts(element, 'ayah').catch(err => {
            console.error('❌ Failed to fetch ayah context:', err);
          });
        }
      });

      // Process hadith contexts
      const hadithContextSections = document.querySelectorAll('.hadith-context-section');
      console.log('🔍 Processing hadith contexts:', hadithContextSections.length);
      
      if (hadithContextSections.length === 0) {
        console.warn('⚠️ No hadith context sections found in DOM');
      }
      
      hadithContextSections.forEach((section, index) => {
        const element = section as HTMLElement;
        const contextKey = element.getAttribute('data-hadith-context');
        console.log(`📚 Hadith ${index + 1}:`, contextKey, 'already fetched?', fetchedContexts.has(contextKey || ''));
        
        if (contextKey && !fetchedContexts.has(contextKey)) {
          console.log('🚀 Fetching context for hadith:', contextKey);
          fetchContexts(element, 'hadith').catch(err => {
            console.error('❌ Failed to fetch hadith context:', err);
          });
        }
      });
    };

    // Process immediately for existing content - multiple attempts
    const processImmediate = () => {
      processContextSections();
    };
    
    // Immediate processing
    processImmediate();
    
    // Process with delays to catch content loaded at different times
    setTimeout(processImmediate, 100);
    setTimeout(processImmediate, 500);
    setTimeout(processImmediate, 1000);
    setTimeout(processImmediate, 2000);
    setTimeout(processImmediate, 3000);

    // Listen for content updates
    const handleContentUpdate = () => {
      console.log('Content update event received');
      setTimeout(() => {
        processContextSections();
      }, 200);
    };
    
    window.addEventListener('content-updated', handleContentUpdate);

    // Also add periodic checking for context sections (every 2 seconds for first 10 seconds)
    let checkCount = 0;
    const maxChecks = 5;
    const periodicCheck = setInterval(() => {
      if (checkCount < maxChecks) {
        processContextSections();
        checkCount++;
      } else {
        clearInterval(periodicCheck);
      }
    }, 2000);

    // Set up mutation observer to detect new context sections
    const mutationObserver = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if the added node contains context sections
              if (
                element.querySelector?.('.ayah-context-section, .hadith-context-section') ||
                element.classList.contains('ayah-context-section') ||
                element.classList.contains('hadith-context-section')
              ) {
                shouldProcess = true;
              }
            }
          });
        }
      });

      if (shouldProcess) {
        // Process immediately and with delay
        processContextSections();
        setTimeout(() => {
          processContextSections();
        }, 300);
      }
    });

    // Observe the document body for changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      mutationObserver.disconnect();
      window.removeEventListener('content-updated', handleContentUpdate);
      clearInterval(periodicCheck);
      fetchedContexts.clear();
    };
  }, []);
};

