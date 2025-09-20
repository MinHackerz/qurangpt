# Google Maps API Setup Guide

This guide will help you set up Google Maps API for the Qibla Finder and Mosque Finder components.

## Quick Start

If you're getting API errors, you need to set up Google Maps API:

1. **Get API Key**: Visit [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**: Maps JavaScript API, Places API, Directions API
3. **Add to .env.local**:
   ```bash
   GOOGLE_MAPS_API_KEY=your_api_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
4. **Restart** your development server

## Detailed Setup

## Getting a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required for interactive maps)
   - **Places API** (required for mosque finder)
   - **Directions API** (required for navigation directions)
   - **Geocoding API** (optional, for address lookup)
   - **Maps Embed API** (optional, for embedded maps)
4. Go to "Credentials" and create an API key
5. Restrict your API key for security:
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain(s) (e.g., `localhost:3000/*`, `yourdomain.com/*`)
   - Under "API restrictions", select "Restrict key" and choose the APIs you enabled

## Environment Variable Setup

Add your Google Maps API key to your environment variables:

### For Development (.env.local)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Note**: You need both variables:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for client-side map display
- `GOOGLE_MAPS_API_KEY` for server-side Places API calls

### For Production
Set the environment variable in your hosting platform:
- **Vercel**: Add in Project Settings > Environment Variables
- **Netlify**: Add in Site Settings > Environment Variables
- **Other platforms**: Follow their specific instructions

## Example .env.local file
```bash
# Existing variables
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
GOOGLE_MAPS_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

## Features Enabled

With Google Maps API, both Qibla Finder and Mosque Finder components include:

### Qibla Finder:
- **Interactive Map**: Shows your current location and Qibla direction
- **Custom Styling**: Minimalistic map design that matches the app theme
- **Qibla Direction Line**: Visual line pointing to the Kaaba
- **Mosque Icon**: Custom mosque icon marking the Qibla direction
- **Location Marker**: Blue dot showing your current position
- **Modern Markers**: Uses AdvancedMarkerElement API with fallback to traditional markers
- **Performance Optimized**: Async loading with proper error handling

### Mosque Finder:
- **Interactive Map**: Displays nearby mosques with custom markers
- **Real-time Directions**: Shows driving directions to selected mosques
- **Mosque Details**: Phone numbers, websites, ratings, and opening hours
- **Search Radius**: Adjustable search distance (1-20km)
- **Smart Highlighting**: Nearest mosque highlighted in green
- **Professional Design**: Clean, minimalist interface with detailed mosque information
- **Google Places Integration**: Rich data from Google Places API with photos and reviews

## Security Notes

- Always restrict your API key to specific domains
- Monitor your API usage in the Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- The API key is safe to expose in client-side code when properly restricted

## Troubleshooting

### Common Errors and Solutions:

#### **ApiNotActivatedMapError**
- **Cause**: The Maps JavaScript API is not enabled for your project
- **Solution**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Select your project
  3. Go to "APIs & Services" > "Library"
  4. Search for "Maps JavaScript API"
  5. Click on it and press "Enable"
  6. Wait a few minutes for the API to be activated

#### **InvalidKey Error**
- **Cause**: API key is missing, invalid, or not properly configured
- **Solution**: 
  1. Verify your API key in `.env.local`
  2. Check API key restrictions in Google Cloud Console
  3. Ensure the key has the correct APIs enabled

#### **Map not loading**
- **Cause**: API key not set or Maps JavaScript API not enabled
- **Solution**: Check if the API key is correctly set and the Maps JavaScript API is enabled

#### **CORS errors**
- **Cause**: Domain not added to API key restrictions
- **Solution**: Ensure your domain is added to the API key restrictions

#### **Quota exceeded**
- **Cause**: API usage limits reached
- **Solution**: Check your usage in the Google Cloud Console and consider upgrading your quota

## Cost Information

- Google Maps JavaScript API has a free tier with generous limits
- Most personal/small projects will stay within the free tier
- Check [Google Maps Pricing](https://developers.google.com/maps/billing-and-pricing) for current rates
