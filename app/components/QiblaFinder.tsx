'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';


interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface QiblaInfo {
  direction: number;
  distance: number;
  bearing: number;
}

// Advanced Mosque Icon Component
const MosqueIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 0 64 64" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="43.5" cy="8.5" r="1.5"/>
    <circle cx="47" cy="16" r="1"/>
    <line x1="54" y1="8.463" x2="54" y2="9.878" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="54" y1="14.122" x2="54" y2="15.537" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="50.463" y1="12" x2="51.878" y2="12" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="56.122" y1="12" x2="57.537" y2="12" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <path d="M55.689,39.588A13.8,13.8,0,0,0,57,33.636c0-6.326-9-11.454-9-11.454a24.758,24.758,0,0,0-2.146,1.425" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <path d="M20.846,19a12.891,12.891,0,0,0,1.287-5.714C22.133,7.605,14.5,3,14.5,3S6.867,7.605,6.867,13.286A12.891,12.891,0,0,0,8.154,19Z" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <path d="M44,31.533a9.9,9.9,0,0,0,2-5.9c0-6.326-14-11.454-14-11.454S18,19.31,18,25.636a9.888,9.888,0,0,0,2,5.9" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <path d="M44.389,40H56.5A1.5,1.5,0,0,1,58,41.5h0A1.5,1.5,0,0,1,56.5,43H44.324" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <rect x="17" y="32" width="30" height="3" rx="1.5" ry="1.5" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <polyline points="29 60.554 29 43 32 40 35 43 35 60.554" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="32" y1="14" x2="32" y2="10" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <path d="M32.191,4.66a3,3,0,0,0,3.166,5.1" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <path d="M19.564,44H8.5A1.5,1.5,0,0,0,7,45.5H7A1.5,1.5,0,0,0,8.5,47H19.637" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="51" y1="43" x2="51" y2="48" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="48" y1="43" x2="48" y2="48" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="39" y1="35" x2="39" y2="50" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="25" y1="35" x2="25" y2="50" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="13" y1="47.364" x2="13" y2="52" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="16" y1="47.364" x2="16" y2="52" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="13" y1="39" x2="13" y2="43.564" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="16" y1="39" x2="16" y2="43.564" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="60" y1="61" x2="4" y2="61" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="9" y1="44" x2="9" y2="19" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="20" y1="21" x2="20" y2="20" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="55" y1="43" x2="55" y2="61" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="9" y1="47" x2="9" y2="61" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="20" y1="61" x2="20" y2="35" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
    <line x1="44" y1="61" x2="44" y2="35" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
  </svg>
);

export default function QiblaFinder() {
  const [location, setLocation] = useState<Location | null>(null);
  const [qiblaInfo, setQiblaInfo] = useState<QiblaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compassRotation, setCompassRotation] = useState(0);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [compassSupported, setCompassSupported] = useState(false);
  const [compassCalibrated, setCompassCalibrated] = useState(false);
  const [compassError, setCompassError] = useState<string | null>(null);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const compassRef = useRef<HTMLDivElement>(null);
  const orientationHistoryRef = useRef<number[]>([]);

  // Kaaba coordinates
  const KAABA_LAT = 21.4225;
  const KAABA_LON = 39.8262;


  // Compass smoothing function
  const smoothOrientation = useCallback((newOrientation: number) => {
    orientationHistoryRef.current.push(newOrientation);
    if (orientationHistoryRef.current.length > 10) {
      orientationHistoryRef.current.shift();
    }
    
    // Calculate average of recent readings for smoothing
    const sum = orientationHistoryRef.current.reduce((a, b) => a + b, 0);
    return sum / orientationHistoryRef.current.length;
  }, []);

  // Check compass support
  const checkCompassSupport = useCallback(() => {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // Check if we can request permission (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setCompassSupported(true);
      } else {
        // For other browsers, check if orientation is available
        setCompassSupported(true);
      }
    } else {
      setCompassSupported(false);
    }
  }, []);

  // Request compass permission (iOS 13+)
  const requestCompassPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setCompassError(null);
          return true;
        } else {
          setCompassError('Compass permission denied. Please enable in browser settings.');
          return false;
        }
      } catch (error) {
        setCompassError('Failed to request compass permission.');
        return false;
      }
    }
    return true; // No permission needed for other browsers
  }, []);

  // Initialize compass
  const initializeCompass = useCallback(async () => {
    if (!compassSupported) return;
    
    const hasPermission = await requestCompassPermission();
    if (!hasPermission) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.alpha !== undefined) {
        const smoothedOrientation = smoothOrientation(event.alpha);
        setDeviceOrientation(smoothedOrientation);
        
        // Auto-calibrate after a few readings
        if (orientationHistoryRef.current.length >= 5 && !compassCalibrated) {
          setCompassCalibrated(true);
        }
      }
    };

    // Add event listener with proper error handling
    try {
      window.addEventListener('deviceorientation', handleOrientation, true);
      setCompassError(null);
    } catch (error) {
      setCompassError('Failed to access device orientation.');
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [compassSupported, compassCalibrated, requestCompassPermission, smoothOrientation]);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check compass support
    checkCompassSupport();
    
    // Request location permission and get current position
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocation({ latitude, longitude, accuracy });
          
          // Calculate Qibla using the API route
          try {
            const response = await fetch('/api/qibla', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ latitude, longitude }),
            });
            
            if (response.ok) {
              const qiblaData = await response.json();
              setQiblaInfo({
                direction: qiblaData.direction,
                distance: qiblaData.distance,
                bearing: qiblaData.bearing,
              });
            } else {
              // Fallback to client-side calculation
              calculateQibla(latitude, longitude);
            }
          } catch (error) {
            console.error('Error fetching Qibla data:', error);
            // Fallback to client-side calculation
            calculateQibla(latitude, longitude);
          }
          
          setIsLoading(false);
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (qiblaInfo && compassCalibrated) {
      // Calculate the rotation needed to point to Qibla
      // deviceOrientation is the device's current heading (0° = North)
      // qiblaInfo.direction is the bearing to Qibla from North
      // We need to rotate the compass so the Qibla direction aligns with device heading
      const rotation = qiblaInfo.direction - deviceOrientation;
      setCompassRotation(rotation);
    }
  }, [qiblaInfo, deviceOrientation, compassCalibrated]);

  const calculateQibla = useCallback((lat: number, lon: number) => {
    // Convert to radians
    const lat1 = (lat * Math.PI) / 180;
    const lon1 = (lon * Math.PI) / 180;
    const lat2 = (KAABA_LAT * Math.PI) / 180;
    const lon2 = (KAABA_LON * Math.PI) / 180;

    // Calculate bearing using the formula
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    // Calculate distance
    const R = 6371; // Earth's radius in kilometers
    const dLat = lat2 - lat1;
    const dLon2 = lon2 - lon1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon2 / 2) * Math.sin(dLon2 / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    setQiblaInfo({
      direction: bearing,
      distance: distance,
      bearing: bearing,
    });
  }, []);


  const getDirectionName = (degrees: number): string => {
    const directions = [
      'North', 'NNE', 'NE', 'ENE',
      'East', 'ESE', 'SE', 'SSE',
      'South', 'SSW', 'SW', 'WSW',
      'West', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Manual compass initialization (requires user gesture)
  const initializeCompassManually = useCallback(async () => {
    if (!compassSupported) {
      setCompassError('Compass not supported on this device.');
      return;
    }
    
    setCompassEnabled(true);
    await initializeCompass();
  }, [compassSupported, initializeCompass]);

  const requestLocation = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocation({ latitude, longitude, accuracy });
          
          // Calculate Qibla using the API route
          try {
            const response = await fetch('/api/qibla', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ latitude, longitude }),
            });
            
            if (response.ok) {
              const qiblaData = await response.json();
              setQiblaInfo({
                direction: qiblaData.direction,
                distance: qiblaData.distance,
                bearing: qiblaData.bearing,
              });
            } else {
              // Fallback to client-side calculation
              calculateQibla(latitude, longitude);
            }
          } catch (error) {
            console.error('Error fetching Qibla data:', error);
            // Fallback to client-side calculation
            calculateQibla(latitude, longitude);
          }
          
          setIsLoading(false);
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, [calculateQibla]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-[70vh] flex items-start justify-center"
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Minimal Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-xl font-mono tracking-wide text-gray-700 dark:text-gray-300">Qibla Direction</h2>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Find the direction to the Kaaba in Mecca
              </div>
            </div>
            
            {/* Location Status */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg flex-1 sm:flex-none">
                <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {location ? (
                    <span>
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      {location.accuracy && (
                        <span className="text-xs text-gray-400 ml-1 hidden sm:inline">
                          (±{Math.round(location.accuracy)}m)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>Location unavailable</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={requestLocation}
                disabled={isLoading}
                className="p-2 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg disabled:opacity-50 touch-manipulation"
                title="Update location"
              >
                <ArrowPathIcon className={`w-4 h-4 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-transparent border border-red-200/50 dark:border-red-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {qiblaInfo ? (
          <div>
            {!compassEnabled ? (
              /* Minimalistic Enable Compass Button */
              <div className="flex items-center justify-center min-h-[40vh]">
                <button
                  onClick={initializeCompassManually}
                  className="inline-flex items-center space-x-2 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors touch-manipulation"
                >
                  <MosqueIcon className="w-4 h-4" />
                  <span>{compassSupported ? "Enable Compass" : "Show Direction"}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Enhanced Compass - Takes up 2 columns on large screens */}
                <div className="lg:col-span-2 bg-transparent rounded-2xl border border-gray-300 dark:border-gray-600 p-3 sm:p-4 lg:p-6 xl:p-8">
                <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Qibla Compass</div>
                  <div className="text-3xl font-mono text-gray-900 dark:text-gray-100">
                    {qiblaInfo.direction.toFixed(1)}°
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {getDirectionName(qiblaInfo.direction)}
                  </div>
                  
                  {/* Compass Status */}
                  <div className="mt-3 flex items-center justify-center space-x-2">
                    {compassSupported ? (
                      compassCalibrated ? (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs">Compass Active</span>
                        </div>
                      ) : orientationHistoryRef.current.length > 0 && orientationHistoryRef.current.length < 5 ? (
                        <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-xs">Calibrating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs">Compass Unavailable</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Compass Error */}
                  {compassError && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {compassError}
                    </div>
                  )}
                </div>
                
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 mx-auto">
                  {/* Compass Background */}
                  <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    {/* Compass Markings */}
                    {[...Array(8)].map((_, i) => {
                      const angle = i * 45;
                      const isCardinal = [0, 90, 180, 270].includes(angle);
                      return (
                        <div
                          key={i}
                          className="absolute inset-0"
                          style={{ transform: `rotate(${angle}deg)` }}
                        >
                          <div className={`absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 w-0.5 ${
                            isCardinal ? 'h-3 sm:h-5 bg-gray-600 dark:bg-gray-300' : 'h-2 sm:h-3 bg-gray-400 dark:bg-gray-500'
                          }`}></div>
                        </div>
                      );
                    })}
                    
                    {/* Cardinal Directions - Outside the circle */}
                    <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-sm sm:text-lg font-mono font-medium text-gray-600 dark:text-gray-300">N</div>
                    <div className="absolute -right-6 sm:-right-8 top-1/2 transform -translate-y-1/2 text-sm sm:text-lg font-mono font-medium text-gray-600 dark:text-gray-300">E</div>
                    <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 text-sm sm:text-lg font-mono font-medium text-gray-600 dark:text-gray-300">S</div>
                    <div className="absolute -left-6 sm:-left-8 top-1/2 transform -translate-y-1/2 text-sm sm:text-lg font-mono font-medium text-gray-600 dark:text-gray-300">W</div>
                  </div>

                  {/* Qibla Direction Indicator - Mosque Icon Outside Circle */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: compassCalibrated ? compassRotation : qiblaInfo.direction }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    <div className="relative w-full h-full">
                      {/* Mosque Icon positioned outside the circle at the top */}
                      <div className="absolute -top-12 sm:-top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                        <div className="bg-white dark:bg-gray-800 rounded-full p-2 sm:p-3 shadow-lg border-2 border-red-500">
                          <MosqueIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                        </div>
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-2 sm:px-3 py-1 rounded shadow mt-1 sm:mt-2">
                          QIBLA
                        </div>
                      </div>
                      
                      {/* Direction line from center to mosque icon */}
                      <div className="absolute top-0 left-1/2 w-0.5 h-32 sm:h-40 bg-red-500 transform -translate-x-1/2 opacity-60"></div>
                    </div>
                  </motion.div>

                  {/* Center Dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-800 dark:bg-white rounded-full border-2 border-white dark:border-gray-800 shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* Information Panel - Single column */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Distance Card */}
                <div className="bg-transparent rounded-2xl border border-gray-300 dark:border-gray-600 p-3 sm:p-4 lg:p-6">
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Distance to Kaaba</div>
                    <div className="text-2xl font-mono text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                      {qiblaInfo.distance.toFixed(0)} km
                    </div>
                    <div className="p-2 sm:p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-xl mx-auto w-fit">
                      <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-transparent rounded-2xl border border-amber-300 dark:border-amber-600 p-3 sm:p-4 lg:p-6">
                  <div className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200 mb-2 sm:mb-3">
                    How to Use
                  </div>
                  <ul className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 space-y-1.5 sm:space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      <span>The mosque icon shows the exact Qibla direction</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      <span>Face the direction where the mosque icon points</span>
                    </li>
                    {isMobile && compassSupported ? (
                      <>
                        <li className="flex items-start space-x-2">
                          <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">•</span>
                          <span>Hold your device flat and rotate to align with compass</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">•</span>
                          <span>Tap "Enable Compass" for real-time direction</span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start space-x-2">
                        <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">•</span>
                        <span>Use with a physical compass for best accuracy</span>
                      </li>
                    )}
                    {!isMobile && (
                      <li className="flex items-start space-x-2">
                        <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">•</span>
                        <span>Mobile devices provide better accuracy than desktop</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            )}
          </div>
        ) : !isLoading && !error ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              <MosqueIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Location Required
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 px-4">
              Enable location services to find the Qibla direction
            </p>
            <button
              onClick={requestLocation}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Get My Location
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}