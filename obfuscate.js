const fs = require('fs');
const crypto = require('crypto');

const API_KEY = 'AIzaSyBq6CK24S5pm6mPdc_dfdbbPBpiSb_kvYo'; // Replace with your actual API key

const obfuscatedKey = crypto.createHash('sha256').update(API_KEY).digest('hex');

const indexHtml = fs.readFileSync('dist/index.html', 'utf8');
const obfuscatedHtml = indexHtml.replace('const API_KEY = undefined;', `const API_KEY = '${obfuscatedKey}';`);

fs.writeFileSync('dist/index.html', obfuscatedHtml);
