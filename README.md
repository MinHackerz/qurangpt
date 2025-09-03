# Quran GPT - Refactored Component Architecture

## Overview
Quran GPT has been completely refactored with a sophisticated, professional, and Islamic-themed design that's minimalistic yet user-friendly. The application now uses a modular component architecture for better maintainability and code organization.

## Design Philosophy
- **Minimalistic**: Clean, uncluttered interface using only black, white, and light grey colors
- **No Shadows**: Flat design approach without any shadow effects
- **Professional**: Sophisticated layout suitable for Islamic content
- **User-Friendly**: Intuitive navigation and clear visual hierarchy

## Component Architecture

### Core Components

#### 1. HeroSection (`app/components/HeroSection.tsx`)
- Main header with logo and title
- Greeting messages for Ramadan/Eid
- Feature badges (AI-Powered, Quranic Knowledge, Islamic Guidance)
- Responsive design with smooth animations

#### 2. QuickQuestions (`app/components/QuickQuestions.tsx`)
- Grid of popular question suggestions
- Interactive cards with hover effects
- Automatic question insertion into chat
- Three default questions covering key Islamic topics

#### 3. ChatSection (`app/components/ChatSection.tsx`)
- Main question input area
- Error handling and validation
- Action buttons (Ask Quran, Reset)
- Clean, focused interface for user input

#### 4. ResponseSection (`app/components/ResponseSection.tsx`)
- Displays AI-generated answers
- Copy functionality for responses
- **Automatic ayah extraction and display**
- Integration with AyahBox components

#### 5. AyahBox (`app/components/AyahBox.tsx`)
- **Individual boxes for each Quranic verse**
- **Audio playback functionality** using Islamic Network CDN
- **Arabic text display** with high-resolution images
- Surah and ayah information
- Play/pause/stop audio controls
- Responsive design for mobile and desktop

#### 7. Footer (`app/components/Footer.tsx`)
- Clean footer with attribution
- Buy Me A Coffee integration
- Responsive layout

## Key Features

### Audio Integration
- **Audio API**: Uses `https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ayah_number}.mp3`
- **Audio Editions**: Supports multiple bitrates (192, 128, 64, 48, 40, 32)
- **Global Ayah Calculation**: Automatically calculates correct ayah numbers for audio
- **Audio Controls**: Play, pause, and stop functionality

### Arabic Text Display
- **Image API**: Uses `https://cdn.islamic.network/quran/images/{surah}_{ayah}.png`
- **High Resolution**: Supports high-resolution images
- **Fallback Handling**: Graceful fallback when images aren't available
- **Responsive Images**: Optimized for all screen sizes

### AI Thinking Process
- **Expandable Interface**: Users can see detailed AI processing steps
- **Real-time Updates**: Shows current processing stage
- **Educational Content**: Explains what the AI is doing
- **Interactive Elements**: Click to expand/collapse

### Ayah Reference Extraction
- **Automatic Parsing**: Extracts ayah references from AI responses
- **Surah Mapping**: Maps surah names to numbers (1-114)
- **Dynamic Generation**: Creates AyahBox components automatically
- **Reference Links**: Maintains original reference links

## Technical Implementation

### State Management
- Centralized state in main page component
- Props passed down to child components
- Clean separation of concerns

### API Integration
- **Gemini API**: For AI responses
- **Islamic Network CDN**: For audio and images
- **Error Handling**: Graceful fallbacks for failed requests

### Responsive Design
- Mobile-first approach
- Tailwind CSS for styling
- Framer Motion for animations
- Dark mode support

### Performance
- Component lazy loading
- Optimized images with Next.js Image
- Efficient state updates
- Minimal re-renders

## File Structure
```
app/
├── components/
│   ├── index.ts              # Component exports
│   ├── HeroSection.tsx       # Main header
│   ├── QuickQuestions.tsx    # Question suggestions
│   ├── ChatSection.tsx       # Input interface

│   ├── ResponseSection.tsx   # Answer display
│   ├── AyahBox.tsx          # Verse display with audio
│   └── Footer.tsx            # Footer component
├── api/
│   └── gemini/
│       └── route.ts          # Gemini API endpoint
├── page.tsx                  # Main page component
├── layout.tsx                # App layout
└── globals.css               # Global styles
```

## Usage

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Dependencies
- Next.js 15.5.0
- React 19.1.1
- Framer Motion 12.23.12
- Heroicons 2.1.1
- Tailwind CSS 3.3.3
- TypeScript 5.2.2

## API Endpoints

### External APIs
- **Audio**: `https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{ayah_number}.mp3`
- **Images**: `https://cdn.islamic.network/quran/images/{surah}_{ayah}.png`
- **High Res**: `https://cdn.islamic.network/quran/images/high-resolution/{surah}_{ayah}.png`

### Internal APIs
- **Gemini**: `/api/gemini` - AI response generation

## Future Enhancements
- Additional audio editions
- Multiple language support
- Offline audio caching
- Advanced ayah search
- User preferences
- Bookmarking system

## Contributing
The component architecture is designed for easy extension and modification. Each component is self-contained with clear interfaces and responsibilities.
