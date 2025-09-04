# PWA (Progressive Web App) Setup

This QuranGPT app is now configured as a Progressive Web App (PWA), allowing users to install it on their mobile devices and use it like a native app.

## Features Added

### 1. PWA Manifest (`/public/manifest.json`)
- App name, description, and theme colors
- Icons for different device sizes (16x16 to 512x512)
- Standalone display mode for app-like experience
- Shortcuts for quick access

### 2. Service Worker (`/public/sw.js`)
- Basic offline caching
- Cache management for better performance
- Automatic updates when new versions are available

### 3. Install Prompt Component (`/app/components/InstallPrompt.tsx`)
- Smart install prompt that appears on mobile devices
- Different instructions for iOS and Android
- Automatic detection of install capability
- Dismissible with session storage

### 4. PWA Icons
- Generated icons in all required sizes
- Based on the existing QuranGPT logo
- Optimized for different device types

### 5. Mobile Optimizations
- Safe area support for notched devices
- Touch-friendly interface
- Prevented zoom on input focus (iOS)
- PWA-specific CSS styles

## How It Works

### For Users:
1. **Mobile Users**: When visiting the site on mobile, users will see an install prompt after 3 seconds
2. **iOS Users**: Get instructions to use the "Add to Home Screen" option in Safari
3. **Android Users**: Get a native install button (if supported by their browser)
4. **Installed App**: Opens in standalone mode without browser UI

### For Developers:
1. **Service Worker**: Automatically registers and caches resources
2. **Install Detection**: Uses `beforeinstallprompt` event for Android and manual detection for iOS
3. **Standalone Mode**: Detects when app is running as PWA vs browser
4. **Safe Areas**: Handles device-specific safe areas (notches, home indicators)

## Testing

### Desktop:
- Open Chrome DevTools → Application → Manifest
- Check PWA installability score
- Test service worker registration

### Mobile:
1. Open the site in mobile browser
2. Look for install prompt after 3 seconds
3. Test installation process
4. Open installed app and verify standalone mode

### PWA Audit:
- Use Lighthouse in Chrome DevTools
- Check "Progressive Web App" section
- Ensure all criteria are met

## Files Modified/Created

### New Files:
- `/public/manifest.json` - PWA manifest
- `/public/sw.js` - Service worker
- `/app/components/InstallPrompt.tsx` - Install prompt component
- `/app/components/ServiceWorkerRegistration.tsx` - SW registration
- `/public/icons/` - PWA icons directory

### Modified Files:
- `/app/layout.tsx` - Added PWA meta tags
- `/app/page.tsx` - Added PWA components
- `/app/globals.css` - Added PWA-specific styles
- `/next.config.js` - Added PWA configuration

## Browser Support

- **Chrome/Edge**: Full PWA support with install prompts
- **Safari (iOS)**: Manual "Add to Home Screen" installation
- **Firefox**: Basic PWA support
- **Samsung Internet**: Full PWA support

## Next Steps

1. **Test on real devices** - Deploy and test on various mobile devices
2. **Optimize icons** - Consider creating custom icons for better branding
3. **Add offline functionality** - Enhance service worker for better offline experience
4. **Push notifications** - Add notification support for updates
5. **App store submission** - Consider submitting to app stores using PWA Builder

## Troubleshooting

### Install Prompt Not Showing:
- Check if `beforeinstallprompt` event is firing
- Verify manifest.json is accessible
- Ensure HTTPS is enabled (required for PWA)

### Icons Not Loading:
- Check icon file paths in manifest.json
- Verify icon files exist in `/public/icons/`
- Test icon accessibility via direct URL

### Service Worker Issues:
- Check browser console for SW errors
- Verify SW file is accessible at `/sw.js`
- Clear browser cache and test again
