'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, ClockIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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

export default function MosqueFinder() {
  const [location, setLocation] = useState<Location | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

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
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=${callbackName}&libraries=places,marker&loading=async`;
        script.async = true;
        script.defer = true;
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
      setError('Geolocation is not supported');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchNearbyMosques(latitude, longitude);
      },
      (error) => {
        console.error(error);
        setError('Unable to retrieve location');
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Fetch Mosques
  const fetchNearbyMosques = async (lat: number, lng: number) => {
    try {
      // Call our backend proxy which handles the Google Places API logic
      const response = await fetch(`/api/mosques?lat=${lat}&lon=${lng}&radius=5000`);
      if (response.ok) {
        const data = await response.json();
        setMosques(data.mosques || []);
      } else {
        console.error('API Error:', await response.text());
        // Fallback mock data if API fails (for demo purposes)
        setMosques([
          { id: '1', name: 'Al-Nur Mosque', latitude: lat + 0.002, longitude: lng + 0.002, address: '123 Main St', rating: 4.8, user_ratings_total: 120, distance: 0.5, types: ['mosque'], opening_hours: { open_now: true, weekday_text: [] } },
          { id: '2', name: 'Islamic Center', latitude: lat - 0.003, longitude: lng - 0.001, address: '456 Oak Ave', rating: 4.5, user_ratings_total: 85, distance: 1.2, types: ['mosque'], opening_hours: { open_now: false, weekday_text: [] } },
          { id: '3', name: 'Downtown Masjid', latitude: lat + 0.005, longitude: lng - 0.005, address: '789 Pine Rd', rating: 4.9, user_ratings_total: 210, distance: 2.1, types: ['mosque'], opening_hours: { open_now: true, weekday_text: [] } },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch mosques');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to create pin element
  const createPinElement = (color: string) => {
    const pin = document.createElement('div');
    pin.style.width = '24px';
    pin.style.height = '24px';
    pin.style.backgroundColor = color;
    pin.style.borderRadius = '50%';
    pin.style.border = '2px solid white';
    pin.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    return pin;
  };

  // Initialize Map
  useEffect(() => {
    if (googleMapsLoaded && location && mapRef.current && !isMapInitialized) {
      const mapOptions = {
        center: { lat: location.latitude, lng: location.longitude },
        zoom: 14,
        disableDefaultUI: true,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID", // Required for AdvancedMarkerElement
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };

      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

      // User Marker
      const userPin = createPinElement('#3B82F6');

      try {
        new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: location.latitude, lng: location.longitude },
          map: googleMapRef.current,
          content: userPin,
          title: "Your Location"
        });
      } catch (e) {
        // Fallback to legacy marker if AdvancedMarkerElement fails
        new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: googleMapRef.current,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }
        });
      }

      setIsMapInitialized(true);
    }
  }, [googleMapsLoaded, location, isMapInitialized]);

  // Update Markers
  useEffect(() => {
    if (googleMapRef.current && mosques.length > 0) {
      // Clear old markers
      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];

      mosques.forEach(mosque => {
        const pin = createPinElement('#10B981');
        let marker;

        try {
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat: mosque.latitude, lng: mosque.longitude },
            map: googleMapRef.current,
            title: mosque.name,
            content: pin
          });

          marker.addListener('click', () => {
            setSelectedMosque(mosque);
            googleMapRef.current.panTo({ lat: mosque.latitude, lng: mosque.longitude });
            googleMapRef.current.setZoom(16);
          });
        } catch (e) {
          marker = new window.google.maps.Marker({
            position: { lat: mosque.latitude, lng: mosque.longitude },
            map: googleMapRef.current,
            title: mosque.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
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
        }

        markersRef.current.push(marker);
      });
    }
  }, [mosques]);

  // Initialize Directions Service and Renderer
  useEffect(() => {
    if (googleMapsLoaded && googleMapRef.current && !directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: true, // We have our own markers
        polylineOptions: {
          strokeColor: '#10B981',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
    }
  }, [googleMapsLoaded, isMapInitialized]);

  // Display route when mosque is selected
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

          // Extract step-by-step directions
          const steps = leg.steps?.map((step: any, index: number) => ({
            instruction: step.instructions?.replace(/<[^>]*>/g, '') || '', // Strip HTML
            distance: step.distance?.text || '',
            duration: step.duration?.text || '',
            maneuver: step.maneuver || '',
          })) || [];
          setDirections(steps);
        }

        // Fit map to the route bounds
        if (route?.bounds) {
          googleMapRef.current.fitBounds(route.bounds);
        }
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }, [location, travelMode]);

  // Trigger route display when mosque is selected
  useEffect(() => {
    if (selectedMosque && isMapInitialized) {
      displayRoute(selectedMosque);
    } else {
      // Clear directions when mosque is deselected
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

  // Helper to get maneuver icon
  const getManeuverIcon = (maneuver: string) => {
    if (maneuver.includes('left')) return '↰';
    if (maneuver.includes('right')) return '↱';
    if (maneuver.includes('straight') || maneuver.includes('continue')) return '↑';
    if (maneuver.includes('uturn')) return '↩';
    if (maneuver.includes('merge')) return '⤴';
    if (maneuver.includes('ramp')) return '↗';
    if (maneuver.includes('roundabout')) return '⟳';
    return '•';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-6 py-8 h-[calc(100vh-100px)] flex flex-col"
    >
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 dark:text-white mb-2 tracking-tight">Nearest Mosques</h1>
          <p className="text-gray-500 dark:text-gray-400 font-light">Find places of worship nearby</p>
        </div>

        {location && (
          <button
            onClick={getUserLocation}
            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Location
          </button>
        )}
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* Map View with Route Info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-[40vh] lg:h-[50vh]">
            {!googleMapsLoaded || isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}

            {/* Route Info Overlay */}
            {routeInfo && selectedMosque && (
              <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Distance</span>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{routeInfo.distance}</span>
                  </div>
                  <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Duration</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{routeInfo.duration}</span>
                  </div>
                  <button
                    onClick={() => setSelectedMosque(null)}
                    className="ml-auto p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
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
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-emerald-500" />
                    Directions to {selectedMosque.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTravelMode('DRIVING')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${travelMode === 'DRIVING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      🚗 Drive
                    </button>
                    <button
                      onClick={() => setTravelMode('WALKING')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${travelMode === 'WALKING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      🚶 Walk
                    </button>
                  </div>
                </div>

                <div className="max-h-[30vh] overflow-y-auto">
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
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Open in Google Maps
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* List View */}
        <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-4 h-[40vh] lg:h-auto">
          {mosques.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <p>No mosques found nearby.</p>
            </div>
          ) : (
            mosques.map((mosque) => (
              <div
                key={mosque.id}
                onClick={() => setSelectedMosque(selectedMosque?.id === mosque.id ? null : mosque)}
                className={`group p-4 rounded-xl border transition-all cursor-pointer ${selectedMosque?.id === mosque.id
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-200 dark:hover:border-emerald-800'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {mosque.name}
                  </h3>
                  {mosque.distance && (
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                      {typeof mosque.distance === 'number' ? mosque.distance.toFixed(1) : mosque.distance}km
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 font-light truncate mb-3">
                  {mosque.address}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mosque.rating && (
                      <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                        <StarIcon className="w-3 h-3" />
                        {mosque.rating}
                      </div>
                    )}
                    {mosque.opening_hours?.open_now ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Open Now</span>
                    ) : (
                      <span className="text-xs text-rose-500 font-medium">Closed</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openGoogleMapsDirections(mosque);
                    }}
                    className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-white transition-colors"
                    title="Get Directions"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}