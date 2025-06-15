import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  listings: Array<{
    id: string;
    title: string;
    latitude?: number;
    longitude?: number;
    price: number;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ listings, center = { lat: 40.7128, lng: -74.0060 }, zoom = 10 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
        return;
      }

      try {
        const loader = new Loader({
          apiKey,
          version: 'weekly',
        });

        const { Map } = await loader.importLibrary('maps');
        const { AdvancedMarkerElement } = await loader.importLibrary('marker');

        if (mapRef.current) {
          const map = new Map(mapRef.current, {
            center,
            zoom,
            mapId: 'DEMO_MAP_ID',
          });

          mapInstanceRef.current = map;

          // Add markers for listings with coordinates
          listings.forEach((listing) => {
            if (listing.latitude && listing.longitude) {
              const marker = new AdvancedMarkerElement({
                map,
                position: { lat: listing.latitude, lng: listing.longitude },
                title: listing.title,
              });

              // Create info window
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div class="p-2">
                    <h3 class="font-semibold text-gray-900">${listing.title}</h3>
                    <p class="text-blue-600 font-medium">$${listing.price}/night</p>
                  </div>
                `,
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, [listings, center, zoom]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default Map;