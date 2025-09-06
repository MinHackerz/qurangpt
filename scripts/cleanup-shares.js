#!/usr/bin/env node

/**
 * Manual cleanup script for expired shared content
 * Run this script to clean up expired shares
 * 
 * Usage:
 * node scripts/cleanup-shares.js
 * 
 * Or with environment variables:
 * NETLIFY_SITE_ID=your-site-id node scripts/cleanup-shares.js
 */

const https = require('https');

const BASE_URL = process.env.CLEANUP_URL || 'https://quran-gpt.netlify.app';

async function cleanupShares() {
  try {
    console.log('🧹 Starting manual cleanup of expired shares...');
    console.log(`📍 Target URL: ${BASE_URL}/api/share`);
    
    const response = await fetch(`${BASE_URL}/api/share`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cleanup completed successfully!');
      console.log('📊 Result:', result);
    } else {
      const error = await response.text();
      console.error('❌ Cleanup failed:', response.status, error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupShares();
