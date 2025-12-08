'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

declare global {
  interface Window {
    google: any;
  }
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface Mosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  types: string[];
  distance?: number;
}

type TravelMode = 'DRIVING' | 'WALKING';

// Calculate bearing/direction between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;

  // Convert to cardinal direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Get direction arrow emoji
function getDirectionArrow(direction: string): string {
  const arrows: { [key: string]: string } = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
  };
  return arrows[direction] || '→';
}

export default function MosqueFinder() {
  const [location, setLocation] = useState<Location | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        return;
      }

      const callbackName = `initMosqueFinderMap_${Date.now()}`;
      (window as any)[callbackName] = () => {
        setGoogleMapsLoaded(true);
        delete (window as any)[callbackName];
      };

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!existingScript) {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setMapError('Google Maps API key is not configured');
          return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=places,marker&loading=async`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setMapError('Failed to load Google Maps');
        document.head.appendChild(script);
      } else {
        if (window.google && window.google.maps) setGoogleMapsLoaded(true);
      }
    };
    loadGoogleMaps();
  }, []);

  // Get User Location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchNearbyMosques(latitude, longitude);
      },
      (error) => {
        console.error(error);
        if (error.code === error.PERMISSION_DENIED) {
          setError('Location permission denied. Please enable location access.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setError('Location information is unavailable.');
        } else {
          setError('Unable to retrieve your location.');
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Fetch Mosques
  const fetchNearbyMosques = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/mosques?lat=${lat}&lon=${lng}&radius=5000`);
      if (response.ok) {
        const data = await response.json();
        // Calculate distance and direction for each mosque
        const mosquesWithDirection = (data.mosques || []).map((mosque: Mosque) => ({
          ...mosque,
          direction: calculateBearing(lat, lng, mosque.latitude, mosque.longitude)
        }));
        setMosques(mosquesWithDirection);
      } else {
        // Generate mock data for demonstration
        const mockMosques = [
          { id: '1', name: 'Al-Nur Mosque', latitude: lat + 0.002, longitude: lng + 0.002, address: 'Near City Center', rating: 4.8, user_ratings_total: 120, distance: 0.5, types: ['mosque'], opening_hours: { open_now: true, weekday_text: [] } },
          { id: '2', name: 'Islamic Center', latitude: lat - 0.003, longitude: lng - 0.001, address: 'Main Street', rating: 4.5, user_ratings_total: 85, distance: 1.2, types: ['mosque'], opening_hours: { open_now: true, weekday_text: [] } },
          { id: '3', name: 'Downtown Masjid', latitude: lat + 0.005, longitude: lng - 0.005, address: 'Downtown Area', rating: 4.9, user_ratings_total: 210, distance: 2.1, types: ['mosque'], opening_hours: { open_now: false, weekday_text: [] } },
        ].map(mosque => ({
          ...mosque,
          direction: calculateBearing(lat, lng, mosque.latitude, mosque.longitude)
        }));
        setMosques(mockMosques);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch nearby mosques');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (googleMapsLoaded && location && mapRef.current && !isMapInitialized) {
      try {
        const mapOptions = {
          center: { lat: location.latitude, lng: location.longitude },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };

        googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // User Marker (blue)
        new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: googleMapRef.current,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          }
        });

        setIsMapInitialized(true);
        setMapError(null);
      } catch (e) {
        console.error('Map initialization error:', e);
        setMapError('Failed to initialize map');
      }
    }
  }, [googleMapsLoaded, location, isMapInitialized]);

  // Update Markers
  useEffect(() => {
    if (googleMapRef.current && mosques.length > 0) {
      markersRef.current.forEach(m => m.setMap && m.setMap(null));
      markersRef.current = [];

      mosques.forEach(mosque => {
        const marker = new window.google.maps.Marker({
          position: { lat: mosque.latitude, lng: mosque.longitude },
          map: googleMapRef.current,
          title: mosque.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }
        });

        marker.addListener('click', () => {
          setSelectedMosque(mosque);
          googleMapRef.current.panTo({ lat: mosque.latitude, lng: mosque.longitude });
          googleMapRef.current.setZoom(16);
        });

        markersRef.current.push(marker);
      });
    }
  }, [mosques]);

  // Initialize Directions Service
  useEffect(() => {
    if (googleMapsLoaded && googleMapRef.current && !directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#10B981',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    }
  }, [googleMapsLoaded, isMapInitialized]);

  // Display route
  const displayRoute = useCallback((mosque: Mosque) => {
    if (!location || !directionsServiceRef.current || !directionsRendererRef.current) return;

    setIsLoadingRoute(true);
    setDirections([]);
    setRouteInfo(null);

    const request = {
      origin: { lat: location.latitude, lng: location.longitude },
      destination: { lat: mosque.latitude, lng: mosque.longitude },
      travelMode: window.google.maps.TravelMode[travelMode],
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      setIsLoadingRoute(false);
      if (status === 'OK' && result) {
        directionsRendererRef.current.setDirections(result);

        const route = result.routes[0];
        if (route && route.legs[0]) {
          const leg = route.legs[0];
          setRouteInfo({
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || '',
          });

          const steps = leg.steps?.map((step: any) => ({
            instruction: step.instructions?.replace(/<[^>]*>/g, '') || '',
            distance: step.distance?.text || '',
            duration: step.duration?.text || '',
            maneuver: step.maneuver || '',
          })) || [];
          setDirections(steps);
        }

        if (route?.bounds) {
          googleMapRef.current.fitBounds(route.bounds);
        }
      }
    });
  }, [location, travelMode]);

  useEffect(() => {
    if (selectedMosque && isMapInitialized) {
      displayRoute(selectedMosque);
    } else {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      setDirections([]);
      setRouteInfo(null);
    }
  }, [selectedMosque, isMapInitialized, displayRoute]);

  const openGoogleMapsDirections = (mosque: Mosque) => {
    if (!location) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode.toLowerCase()}`;
    window.open(url, '_blank');
  };

  const getManeuverIcon = (maneuver: string) => {
    if (maneuver.includes('left')) return '↰';
    if (maneuver.includes('right')) return '↱';
    if (maneuver.includes('straight') || maneuver.includes('continue')) return '↑';
    if (maneuver.includes('uturn')) return '↩';
    return '•';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-transparent"
    >
      <div className="max-w-4xl mx-auto px-6 py-12 sm:px-8">
        <div className="space-y-8">
          {/* Header */}
          <header className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-gray-50 mb-2 tracking-tight">
              Nearest Mosques
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-light text-lg">
              Find places of worship near your location
            </p>
          </header>

          {/* Location Status Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${location ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <MapPinIcon className={`w-6 h-6 ${location ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {location ? 'Location Found' : isLoading ? 'Finding your location...' : 'Location Required'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {location
                      ? `${mosques.length} mosques found within 5km radius`
                      : error || 'Enable location to find nearby mosques'}
                  </p>
                </div>
              </div>
              <button
                onClick={getUserLocation}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Searching...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Travel Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTravelMode('WALKING')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${travelMode === 'WALKING'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              🚶 Walking
            </button>
            <button
              onClick={() => setTravelMode('DRIVING')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${travelMode === 'DRIVING'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              🚗 Driving
            </button>
          </div>

          {/* Mosque List */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium tracking-wide text-emerald-600 dark:text-emerald-400 uppercase">
              {mosques.length > 0 ? `${mosques.length} Mosques Found` : 'Nearby Mosques'}
            </h2>

            {mosques.length === 0 && !isLoading ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <MapPinIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No mosques found nearby</p>
                <p className="text-sm mt-1">Try refreshing your location</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mosques.map((mosque: any) => (
                  <div
                    key={mosque.id}
                    onClick={() => setSelectedMosque(selectedMosque?.id === mosque.id ? null : mosque)}
                    className={`group p-5 rounded-xl border transition-all cursor-pointer ${selectedMosque?.id === mosque.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-200 dark:hover:border-emerald-800'
                      }`}
                  >
                    {/* Mosque Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {mosque.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-light mt-1">
                          {mosque.address || 'Address not available'}
                        </p>
                      </div>

                      {/* Distance & Direction Badge */}
                      {mosque.distance && (
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-2xl" title={`Direction: ${mosque.direction}`}>
                            {getDirectionArrow(mosque.direction)}
                          </span>
                          <div className="text-right">
                            <span className="block text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                              {typeof mosque.distance === 'number' ? mosque.distance.toFixed(1) : mosque.distance}
                              <span className="text-xs font-normal text-gray-400 ml-0.5">km</span>
                            </span>
                            <span className="text-xs text-gray-400">{mosque.direction}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mosque Info Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-4">
                        {mosque.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <StarIcon className="w-4 h-4 text-amber-400" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{mosque.rating}</span>
                            {mosque.user_ratings_total && (
                              <span className="text-gray-400 text-xs">({mosque.user_ratings_total})</span>
                            )}
                          </div>
                        )}
                        {mosque.opening_hours?.open_now !== undefined && (
                          <span className={`text-sm font-medium ${mosque.opening_hours.open_now ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {mosque.opening_hours.open_now ? '● Open Now' : '○ Closed'}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMapsDirections(mosque);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Directions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Directions Panel */}
          <AnimatePresence>
            {directions.length > 0 && selectedMosque && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-emerald-500" />
                    Step-by-Step Directions to {selectedMosque.name}
                  </h3>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {isLoadingRoute ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {directions.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg font-medium">
                            {getManeuverIcon(step.maneuver)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">{step.instruction}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-400">{step.distance}</span>
                              {step.duration && <span className="text-xs text-gray-400">• {step.duration}</span>}
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-xs font-mono text-gray-300 dark:text-gray-600">{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <button
                    onClick={() => openGoogleMapsDirections(selectedMosque)}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Open in Google Maps for Navigation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}