// CDN Health Check Utility

export interface CDNHealthResult {
  isHealthy: boolean;
  responseTime: number;
  status: 'healthy' | 'error';
  message: string;
}

export const checkCDNHealth = async (): Promise<CDNHealthResult> => {
  const startTime = Date.now();
  
  try {
    // In development, test through the proxy API to avoid CORS issues
    const testUrl = process.env.NODE_ENV === 'development' 
      ? '/api/audio-proxy?url=https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3'
      : 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3';
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: process.env.NODE_ENV === 'development' ? 'cors' : 'no-cors',
      cache: 'no-cache'
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok || response.status === 200) {
      return {
        isHealthy: true,
        responseTime,
        status: 'healthy',
        message: 'CDN is healthy'
      };
    } else {
      return {
        isHealthy: false,
        responseTime,
        status: 'error',
        message: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      isHealthy: false,
      responseTime,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
