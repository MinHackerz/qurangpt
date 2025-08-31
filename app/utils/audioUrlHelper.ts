/**
 * Audio URL Helper Utilities
 * 
 * This file provides helper functions to handle audio URLs and avoid CORS issues
 * by using a proxy API route in development mode and production mode.
 */

/**
 * Converts a CDN audio URL to a proxy URL in both development and production modes
 * @param cdnUrl - The original CDN URL
 * @returns The proxy URL for both development and production
 */
export const getAudioUrl = (cdnUrl: string): string => {
  if (cdnUrl.includes('cdn.islamic.network')) {
    return `/api/audio-proxy?url=${encodeURIComponent(cdnUrl)}`;
  }
  return cdnUrl;
};

/**
 * Creates a proxy URL for testing purposes
 * @param cdnUrl - The original CDN URL
 * @returns The proxy URL
 */
export const createProxyUrl = (cdnUrl: string): string => {
  return `/api/audio-proxy?url=${encodeURIComponent(cdnUrl)}`;
};

/**
 * Checks if a URL should use the proxy (CDN URL)
 * @param url - The URL to check
 * @returns True if the URL should use the proxy
 */
export const shouldUseProxy = (url: string): boolean => {
  return url.includes('cdn.islamic.network');
};

/**
 * Gets the appropriate fetch mode for a URL
 * @param url - The URL to check
 * @returns 'cors' for proxy URLs, 'no-cors' for direct CDN URLs
 */
export const getFetchMode = (url: string): RequestMode => {
  return shouldUseProxy(url) ? 'cors' : 'no-cors';
};
