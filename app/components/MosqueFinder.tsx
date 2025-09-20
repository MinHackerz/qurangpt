'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, PhoneIcon, GlobeAltIcon, ClockIcon, StarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    [key: string]: any; // Allow dynamic property access
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
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  distance?: number;
}

export default function MosqueFinder() {
  const [location, setLocation] = useState<Location | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [directionsInfo, setDirectionsInfo] = useState<{
    duration: string;
    distance: string;
    steps: Array<{
      instructions: string;
      distance: string;
      duration: string;
    }>;
  } | null>(null);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [journeyStartTime, setJourneyStartTime] = useState<Date | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [lastKnownPosition, setLastKnownPosition] = useState<Location | null>(null);
  const [journeyDuration, setJourneyDuration] = useState<number>(0);
  const [isAutoSelected, setIsAutoSelected] = useState<boolean>(false);
  const [showAutoSelectNotification, setShowAutoSelectNotification] = useState<boolean>(false);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if Google Maps is already fully loaded
      if (window.google && window.google.maps && window.google.maps.Map) {
        setGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script is already loading, wait for it
        const checkGoogleLoaded = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            setGoogleMapsLoaded(true);
          } else {
            setTimeout(checkGoogleLoaded, 100);
          }
        };
        checkGoogleLoaded();
        return;
      }

      // Create unique callback name to avoid conflicts
      const callbackName = `initMosqueFinderMap_${Date.now()}`;
      window[callbackName] = () => {
        // Double-check that Google Maps is fully loaded
        if (window.google && window.google.maps && window.google.maps.Map) {
          setGoogleMapsLoaded(true);
        } else {
          console.error('Google Maps API loaded but Map constructor not available');
          setError('Failed to initialize map service. Please try again later.');
        }
        delete window[callbackName]; // Clean up
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=${callbackName}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setError('Failed to load map service. Please try again later.');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps loads and location is available
  useEffect(() => {
    if (googleMapsLoaded && location && mapRef.current && !isMapInitialized) {
      initializeMap();
      setIsMapInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded, location, isMapInitialized]);

  // Update map center when location changes (but don't reinitialize)
  useEffect(() => {
    if (googleMapRef.current && location && isMapInitialized) {
      googleMapRef.current.setCenter({
        lat: location.latitude,
        lng: location.longitude
      });
    }
  }, [location, isMapInitialized]);

  // Update map when mosques change
  useEffect(() => {
    if (googleMapRef.current && mosques.length > 0) {
      updateMapMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mosques]);

  // Create user marker content function
  const createUserMarkerContent = () => {
    const div = document.createElement('div');
    div.style.width = isJourneyActive ? '20px' : '16px';
    div.style.height = isJourneyActive ? '20px' : '16px';
    div.style.borderRadius = '50%';
    div.style.backgroundColor = isJourneyActive ? '#10B981' : '#3B82F6';
    div.style.border = '3px solid #ffffff';
    div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    return div;
  };

  const cleanupMap = () => {
    // Clear all markers
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    }

    // Clear user marker
    if (userMarkerRef.current) {
      if (userMarkerRef.current.setMap) {
        userMarkerRef.current.setMap(null);
      }
      userMarkerRef.current = null;
    }

    // Clear directions renderer
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    // Clear directions service
    directionsServiceRef.current = null;

    // Clear map reference
    googleMapRef.current = null;
    setIsMapInitialized(false);
  };

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !location) return;

    // Additional safety check to ensure Google Maps is fully loaded
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.error('Google Maps API not fully loaded when trying to initialize map');
      setError('Map service not ready. Please try again.');
      return;
    }

    // Clean up any existing map instance
    if (googleMapRef.current) {
      cleanupMap();
    }

    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
    
    const mapOptions = {
      zoom: 14,
      center: { lat: location.latitude, lng: location.longitude },
      // Only apply styles when no mapId is present (styles are controlled via cloud console when mapId exists)
      ...(mapId ? {} : {
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }),
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      // Add mapId for AdvancedMarkerElement support (optional)
      mapId,
    };

    try {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    } catch (error) {
      console.error('Failed to create Google Map:', error);
      setError('Failed to initialize map. Please try again.');
      return;
    }
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: isJourneyActive ? '#10B981' : '#059669',
        strokeWeight: isJourneyActive ? 6 : 4,
        strokeOpacity: 0.8,
      },
      preserveViewport: false,
    });
    directionsRendererRef.current.setMap(googleMapRef.current);

    // Add user location marker using AdvancedMarkerElement with fallback
    try {
      userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: location.latitude, lng: location.longitude },
        map: googleMapRef.current,
        title: isJourneyActive ? 'Your Location (Journey Active)' : 'Your Location',
        content: createUserMarkerContent()
      });
    } catch (error) {
      // Fallback to regular marker if AdvancedMarkerElement fails (no Map ID)
      console.warn('AdvancedMarkerElement not available, using regular marker');
      userMarkerRef.current = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: googleMapRef.current,
        title: isJourneyActive ? 'Your Location (Journey Active)' : 'Your Location',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isJourneyActive]);

  const createMosqueMarkerContent = (mosque: Mosque, index: number) => {
    const isSelected = selectedMosque?.id === mosque.id;
    const isNearest = index === 0;
    
    const div = document.createElement('div');
    div.style.width = isSelected ? '44px' : (isNearest ? '40px' : '36px');
    div.style.height = isSelected ? '44px' : (isNearest ? '40px' : '36px');
    div.style.borderRadius = '50%';
    div.style.backgroundColor = isSelected ? '#059669' : (isNearest ? '#10B981' : '#6B7280');
    div.style.border = isSelected ? '3px solid #ffffff' : '2px solid #ffffff';
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontSize = isSelected ? '18px' : (isNearest ? '16px' : '14px');
    div.style.color = '#ffffff';
    div.style.fontWeight = 'bold';
    div.textContent = '🕌';
    return div;
  };

  const updateMapMarkers = useCallback(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add mosque markers for all mosques in radius
    mosques.forEach((mosque, index) => {
      let marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker;
      try {
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: mosque.latitude, lng: mosque.longitude },
          map: googleMapRef.current,
          title: `${mosque.name} - ${mosque.distance?.toFixed(1)}km away`,
          content: createMosqueMarkerContent(mosque, index),
          zIndex: selectedMosque?.id === mosque.id ? 1000 : (index === 0 ? 999 : 100 + index),
        });
      } catch (error) {
        // Fallback to regular marker if AdvancedMarkerElement fails (no Map ID)
        const isSelected = selectedMosque?.id === mosque.id;
        const isNearest = index === 0;
        marker = new window.google.maps.Marker({
          position: { lat: mosque.latitude, lng: mosque.longitude },
          map: googleMapRef.current,
          title: `${mosque.name} - ${mosque.distance?.toFixed(1)}km away`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 10 : (isNearest ? 8 : 6),
            fillColor: isSelected ? '#10B981' : (isNearest ? '#059669' : '#6B7280'),
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: selectedMosque?.id === mosque.id ? 1000 : (index === 0 ? 999 : 100 + index),
        });
      }

      marker.addListener('click', () => {
        setSelectedMosque(mosque);
        setIsAutoSelected(false); // Reset auto-selected flag when manually selecting
        if (location) {
          showDirectionsOnMap(mosque);
        }
      });

      // Add hover effects (only for AdvancedMarkerElement)
      if (marker instanceof window.google.maps.marker.AdvancedMarkerElement) {
        const advancedMarker = marker as google.maps.marker.AdvancedMarkerElement;
        advancedMarker.addListener('mouseover', () => {
          if (selectedMosque?.id !== mosque.id) {
            advancedMarker.content = createMosqueMarkerContent(mosque, index);
          }
        });

        advancedMarker.addListener('mouseout', () => {
          if (selectedMosque?.id !== mosque.id) {
            advancedMarker.content = createMosqueMarkerContent(mosque, index);
          }
        });
      }

      markersRef.current.push(marker);
    });

    // Add radius circle to show search area
    if (location && googleMapRef.current) {
      const radiusCircle = new window.google.maps.Circle({
        strokeColor: '#059669',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: '#059669',
        fillOpacity: 0.05,
        map: googleMapRef.current,
        center: { lat: location.latitude, lng: location.longitude },
        radius: searchRadius, // in meters
      });
      
      // Store radius circle reference for cleanup
      markersRef.current.push(radiusCircle);
    }

    // Auto-select nearest mosque if none selected
    if (mosques.length > 0 && !selectedMosque) {
      setSelectedMosque(mosques[0]);
      if (location) {
        showDirectionsOnMap(mosques[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mosques, selectedMosque, location, searchRadius]);

  const showDirectionsOnMap = (mosque: Mosque) => {
    if (!location || !directionsServiceRef.current || !directionsRendererRef.current) return;
    showDirectionsOnMapFromLocation(mosque, location);
  };

  const showDirectionsOnMapFromLocation = (mosque: Mosque, fromLocation: Location) => {
    if (!fromLocation || !directionsServiceRef.current || !directionsRendererRef.current) return;

    directionsServiceRef.current.route({
      origin: { lat: fromLocation.latitude, lng: fromLocation.longitude },
      destination: { lat: mosque.latitude, lng: mosque.longitude },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result: any, status: any) => {
      if (status === 'OK' && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result);
        
        // Extract directions information
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setDirectionsInfo({
          duration: leg.duration.text,
          distance: leg.distance.text,
          steps: leg.steps.map((step: any) => ({
            instructions: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: step.distance.text,
            duration: step.duration.text,
          }))
        });
      }
    });
  };

  const getDirectionsToMosque = () => {
    if (selectedMosque) {
      if (!directionsInfo || !showDirectionsPanel) {
        // Show directions
        setShowDirectionsPanel(true);
        showDirectionsOnMap(selectedMosque);
      } else {
        // Hide directions
        setShowDirectionsPanel(false);
      }
    }
  };

  const calculateDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateUserMarkerIcon = useCallback(() => {
    if (userMarkerRef.current) {
      if (userMarkerRef.current.content !== undefined) {
        // AdvancedMarkerElement
        userMarkerRef.current.content = createUserMarkerContent();
      } else if (userMarkerRef.current.setIcon) {
        // Regular Marker
        userMarkerRef.current.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isJourneyActive ? 10 : 8,
          fillColor: isJourneyActive ? '#10B981' : '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        });
      }
      userMarkerRef.current.title = isJourneyActive ? 'Your Location (Journey Active)' : 'Your Location';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJourneyActive]);

  const updateDirectionsRendererStyle = useCallback(() => {
    if (directionsRendererRef.current && directionsInfo) {
      // Only update the style options if directions are already present
      // This prevents clearing existing directions
      directionsRendererRef.current.setOptions({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: isJourneyActive ? '#10B981' : '#059669',
          strokeWeight: isJourneyActive ? 6 : 4,
          strokeOpacity: 0.8,
        },
        preserveViewport: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJourneyActive, directionsInfo]);

  const updateUserLocationOnMap = (newLocation: Location) => {
    if (userMarkerRef.current && googleMapRef.current) {
      // Update user marker position - handle both AdvancedMarkerElement and regular Marker
      if (userMarkerRef.current.setPosition) {
        // Regular Marker
        userMarkerRef.current.setPosition({
          lat: newLocation.latitude,
          lng: newLocation.longitude
        });
      } else if (userMarkerRef.current.position) {
        // AdvancedMarkerElement - update position property
        userMarkerRef.current.position = {
          lat: newLocation.latitude,
          lng: newLocation.longitude
        };
      }
      
      // Update marker icon based on journey status
      updateUserMarkerIcon();
      
      // Always update directions if journey is active and mosque is selected
      if (isJourneyActive && selectedMosque) {
        // Recalculate directions from new position
        showDirectionsOnMapFromLocation(selectedMosque, newLocation);
      }
      
      // Calculate distance traveled if journey is active
      if (isJourneyActive && lastKnownPosition) {
        const distance = calculateDistanceBetweenPoints(
          lastKnownPosition.latitude,
          lastKnownPosition.longitude,
          newLocation.latitude,
          newLocation.longitude
        );
        setDistanceTraveled(prev => prev + distance);
      }
      
      setLastKnownPosition(newLocation);
    }
  };

  const openGoogleMaps = () => {
    if (!selectedMosque) {
      setError('No mosque selected. Please select a mosque first.');
      return;
    }

    if (!location) {
      setError('Location not available. Please refresh your location.');
      return;
    }

    // Create Google Maps URL with directions
    const origin = `${location.latitude},${location.longitude}`;
    const destination = `${selectedMosque.latitude},${selectedMosque.longitude}`;
    const mapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    
    // Try to open in Google Maps app first, fallback to web
    const appUrl = `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`;
    
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Google Maps app first
      window.location.href = appUrl;
      
      // Fallback to web version after a short delay if app doesn't open
      setTimeout(() => {
        window.open(mapsUrl, '_blank');
      }, 1000);
    } else {
      // On desktop, open in new tab
      window.open(mapsUrl, '_blank');
    }
  };

  const startJourney = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    // Auto-select nearest mosque if none selected
    if (!selectedMosque && mosques.length > 0) {
      const nearestMosque = mosques[0];
      console.log('Auto-selecting nearest mosque:', nearestMosque.name, `(${nearestMosque.distance?.toFixed(1)}km away)`);
      setSelectedMosque(nearestMosque);
      setIsAutoSelected(true);
      setShowAutoSelectNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowAutoSelectNotification(false), 3000);
    } else {
      setIsAutoSelected(false);
    }
    
    if (!selectedMosque) {
      setError('No mosques found nearby. Please try refreshing your location.');
      return;
    }

    // Get the mosque to use for journey (either selected or auto-selected nearest)
    const mosqueForJourney = selectedMosque || mosques[0];
    
    console.log('Starting journey to:', mosqueForJourney.name, `(${mosqueForJourney.distance?.toFixed(1)}km away)`);

    // Ensure directions are shown on the map first
    if (location && mosqueForJourney) {
      showDirectionsOnMap(mosqueForJourney);
      // Ensure directions panel is visible during journey
      setShowDirectionsPanel(true);
      
      // Wait for directions to be set before starting journey
      setTimeout(() => {
        setIsJourneyActive(true);
      }, 200);
    } else {
      setIsJourneyActive(true);
    }
    setJourneyStartTime(new Date());
    setDistanceTraveled(0);
    setLastKnownPosition(location);
    setError(null);

    // Start watching user's position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { latitude, longitude, accuracy };
        setLocation(newLocation);
        updateUserLocationOnMap(newLocation);
      },
      (error) => {
        console.error('Error tracking location:', error);
        setError('Unable to track your location during journey.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // 5 seconds
      }
    );

    setWatchId(id);
  };

  const stopJourney = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsJourneyActive(false);
    setJourneyStartTime(null);
    setDistanceTraveled(0);
    setLastKnownPosition(null);
  };

  // Update user marker icon and directions renderer when journey status changes
  useEffect(() => {
    updateUserMarkerIcon();
    // Only update directions renderer style if directions are already present
    if (directionsInfo && directionsRendererRef.current) {
      updateDirectionsRendererStyle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJourneyActive, directionsInfo]);

  // Update mosque markers when selected mosque changes
  useEffect(() => {
    if (googleMapRef.current && mosques.length > 0) {
      updateMapMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMosque, searchRadius, mosques.length]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      // Clean up Google Maps instance
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker.setMap) {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
      }
      if (userMarkerRef.current) {
        if (userMarkerRef.current.setMap) {
          userMarkerRef.current.setMap(null);
        }
        userMarkerRef.current = null;
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      directionsServiceRef.current = null;
      googleMapRef.current = null;
    };
  }, [watchId]);

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError(null);
    // Reset map initialization when getting new location
    setIsMapInitialized(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { latitude, longitude, accuracy };
        setLocation(newLocation);
        fetchNearbyMosques(latitude, longitude, searchRadius);
      },
      (error) => {
        setError('Unable to get your location. Please enable location services.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNearbyMosques = async (lat: number, lon: number, radius: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/mosques?lat=${lat}&lon=${lon}&radius=${radius}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to fetch mosques: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMosques(data.mosques || []);
    } catch (error) {
      console.error('Error fetching mosques:', error);
      let errorMessage = 'Failed to fetch nearby mosques';
      
      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = 'Service configuration error. Please contact support.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'Service configuration error. Please contact support.';
        } else {
          errorMessage = 'Unable to find nearby mosques. Please try again later.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadiusChange = useCallback((newRadius: number) => {
    setSearchRadius(newRadius);
    if (location) {
      fetchNearbyMosques(location.latitude, location.longitude, newRadius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const formatRating = (rating: number, total: number) => {
    return `${rating.toFixed(1)} (${total} reviews)`;
  };

  const formatOpeningHours = (hours: string[]) => {
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return hours.find(h => h.startsWith(dayNames[today])) || hours[0] || 'Hours not available';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-[70vh] flex items-start justify-center"
    >
      <div className="w-full mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-mono tracking-wide text-gray-700 dark:text-gray-300">Nearby Mosques</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Find mosques and Islamic centers near you
          </p>
        </div>

        {/* Controls - Single Line Layout */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Radius Selector */}
          <select
            value={searchRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="flex-1 sm:flex-none sm:min-w-[140px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            style={{ backgroundColor: 'transparent' }}
          >
            <option value={1000} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">1 km radius</option>
            <option value={3000} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">3 km radius</option>
            <option value={5000} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">5 km radius</option>
            <option value={10000} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">10 km radius</option>
            <option value={20000} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">20 km radius</option>
          </select>
          
          {/* Mosque Selection */}
          {mosques.length > 0 && (
            <select
              value={selectedMosque?.id || ''}
              onChange={(e) => {
                const mosque = mosques.find(m => m.id === e.target.value);
                if (mosque) {
                  setSelectedMosque(mosque);
                  setIsAutoSelected(false); // Reset auto-selected flag when manually selecting
                  if (location) showDirectionsOnMap(mosque);
                }
              }}
              className="flex-1 sm:flex-none sm:min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              style={{ backgroundColor: 'transparent' }}
            >
              {mosques.map((mosque, index) => (
                <option 
                  key={mosque.id} 
                  value={mosque.id}
                  className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {index === 0 ? '📍 ' : ''}{mosque.name} ({mosque.distance?.toFixed(1)} km)
                </option>
              ))}
            </select>
          )}
          
          {/* Refresh Button */}
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="flex-shrink-0 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Auto-selection notification */}
        {showAutoSelectNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Auto-selected nearest mosque for your journey
              </p>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Map and Mosque Details Grid - Mobile First */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden relative h-full">
                <div 
                  ref={mapRef}
                  className="w-full h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] bg-gray-100 dark:bg-gray-700"
                >
                  {!googleMapsLoaded && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Fading edges overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top fade */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/30 dark:from-gray-800/30 to-transparent"></div>
                  {/* Bottom fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/30 dark:from-gray-800/30 to-transparent"></div>
                  {/* Left fade */}
                  <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white/30 dark:from-gray-800/30 to-transparent"></div>
                  {/* Right fade */}
                  <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white/30 dark:from-gray-800/30 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Mosque Details */}
            <div className="space-y-4 h-full min-h-[400px] lg:min-h-[600px] flex flex-col order-1 lg:order-2">
            {/* Mosque Information Card */}
            {selectedMosque ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-transparent backdrop-blur-sm rounded-2xl border border-gray-300 dark:border-gray-600 p-5 flex-1 flex flex-col"
              >
                {/* Header Section */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <h3 className="text-lg font-mono text-gray-800 dark:text-gray-100 leading-snug tracking-wide">
                        {selectedMosque.name}
                      </h3>
                      {isAutoSelected && (
                        <div className="mt-1 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Auto-selected (nearest)
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedMosque.distance && (
                      <div className="flex-shrink-0 px-2 py-1 bg-gray-100/70 dark:bg-gray-700/50 rounded-full">
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                          {selectedMosque.distance.toFixed(1)}km
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Rating */}
                  {selectedMosque.rating && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedMosque.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({selectedMosque.user_ratings_total || 0})
                      </span>
                    </div>
                  )}
                </div>

                {/* Status */}
                {selectedMosque.opening_hours && (
                  <div className="mb-5">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${selectedMosque.opening_hours.open_now ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedMosque.opening_hours.open_now ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    {selectedMosque.opening_hours.weekday_text && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-4 space-y-0.5">
                        {selectedMosque.opening_hours.weekday_text.slice(0, 2).map((hours, index) => (
                          <div key={index} className="font-mono">{hours}</div>
                        ))}
                        {selectedMosque.opening_hours.weekday_text.length > 2 && (
                          <div className="opacity-60">
                            +{selectedMosque.opening_hours.weekday_text.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {selectedMosque.address && (
                  <div className="mb-4 pb-4 border-b border-gray-300 dark:border-gray-600">
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                        {selectedMosque.address}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Links */}
                <div className="space-y-3 mb-5">
                  {selectedMosque.phone && (
                    <a 
                      href={`tel:${selectedMosque.phone}`}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100/30 dark:hover:bg-gray-700/20 transition-colors group"
                    >
                      <PhoneIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100">
                        {selectedMosque.phone}
                      </span>
                    </a>
                  )}

                  {selectedMosque.website && (
                    <a 
                      href={selectedMosque.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100/30 dark:hover:bg-gray-700/20 transition-colors group"
                    >
                      <GlobeAltIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100">
                        Website
                      </span>
                    </a>
                  )}
                </div>

                {/* Spacer to push buttons down */}
                <div className="flex-grow"></div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!isJourneyActive ? (
                    <>
                      <button
                        onClick={getDirectionsToMosque}
                        className="w-full px-4 py-2.5 bg-gray-900/90 dark:bg-gray-100/90 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 text-sm font-medium tracking-wide"
                      >
                        {directionsInfo && showDirectionsPanel ? 'Hide Directions' : 'Get Directions'}
                      </button>
                      
                      {(directionsInfo || mosques.length > 0) && (
                        <button
                          onClick={openGoogleMaps}
                          className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-all duration-200 text-sm font-medium tracking-wide"
                        >
                          Open in Google Maps
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={stopJourney}
                        className="w-full px-4 py-2.5 bg-red-500/90 text-white rounded-xl hover:bg-red-600 transition-all duration-200 text-sm font-medium tracking-wide"
                      >
                        Stop Journey
                      </button>
                      
                      <div className="p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/30 dark:border-gray-600/30">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 tracking-wide uppercase">Journey Active</span>
                        </div>
                        <div className="mb-3 text-center">
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                            🗺️ Route visible on map
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                              {distanceTraveled.toFixed(2)}km
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Traveled</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                              {journeyStartTime ? Math.floor((Date.now() - journeyStartTime.getTime()) / 60000) : 0}m
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Travel Time Info */}
                {directionsInfo && !isJourneyActive && (
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Time</div>
                        <div className="text-lg font-light text-gray-800 dark:text-gray-200">{directionsInfo.duration}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Distance</div>
                        <div className="text-lg font-light text-gray-800 dark:text-gray-200">{directionsInfo.distance}</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-transparent backdrop-blur-sm rounded-2xl border border-gray-300 dark:border-gray-600 p-8 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100/50 dark:bg-gray-700/50 flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-light">
                  {isLoading ? 'Searching...' : 'Select mosque'}
                </p>
                {!isLoading && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose from dropdown or map
                  </p>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Full-Width Step-by-Step Directions Panel */}
          {showDirectionsPanel && directionsInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-transparent backdrop-blur-sm rounded-2xl border border-gray-300 dark:border-gray-600 p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100/50 dark:bg-gray-700/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-mono text-gray-800 dark:text-gray-100 tracking-wide">
                      Directions
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-light">
                      {selectedMosque?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {directionsInfo.duration}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {directionsInfo.distance}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDirectionsPanel(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Steps Grid - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {directionsInfo.steps.map((step, index) => {
                  // Extract direction from instructions
                  const getDirectionIcon = (instruction: string) => {
                    const lowerInstruction = instruction.toLowerCase();
                    if (lowerInstruction.includes('turn right') || lowerInstruction.includes('right turn')) {
                      return '→';
                    } else if (lowerInstruction.includes('turn left') || lowerInstruction.includes('left turn')) {
                      return '←';
                    } else if (lowerInstruction.includes('straight') || lowerInstruction.includes('continue')) {
                      return '↑';
                    } else if (lowerInstruction.includes('u-turn') || lowerInstruction.includes('u turn')) {
                      return '↩';
                    } else if (lowerInstruction.includes('slight right')) {
                      return '↗';
                    } else if (lowerInstruction.includes('slight left')) {
                      return '↖';
                    } else if (lowerInstruction.includes('merge')) {
                      return '⤴';
                    } else if (lowerInstruction.includes('exit')) {
                      return '↳';
                    } else if (lowerInstruction.includes('roundabout')) {
                      return '↻';
                    } else {
                      return '●';
                    }
                  };

                  return (
                    <div key={index} className="bg-gray-50/30 dark:bg-gray-700/20 rounded-xl p-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-100/40 dark:hover:bg-gray-600/30 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 text-center">
                          <div className="w-7 h-7 bg-gray-200/50 dark:bg-gray-600/50 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center text-xs font-mono mb-2">
                            {index + 1}
                          </div>
                          <div className="text-xl text-gray-600 dark:text-gray-400">
                            {getDirectionIcon(step.instructions)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed font-light">
                            {step.instructions}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 rounded-md bg-gray-200/50 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300 text-xs font-mono">
                              {step.distance}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-gray-200/50 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300 text-xs font-mono">
                              {step.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}