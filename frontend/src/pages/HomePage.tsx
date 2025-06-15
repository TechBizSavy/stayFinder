import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import Map from '../components/Map';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  latitude?: number;
  longitude: number;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  host: {
    id: string;
    name: string;
    email: string;
  };
}

const HomePage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async (filters?: any) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.location) params.append('location', filters.location);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.guests) params.append('guests', filters.guests);
      }

      const response = await axios.get(`http://localhost:3001/api/listings?${params}`);
      setListings(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: any) => {
    fetchListings(filters);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Stay
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover unique accommodations around the world, from cozy apartments to luxury villas.
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {listings.length} {listings.length === 1 ? 'Property' : 'Properties'} Available
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMap(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showMap
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setShowMap(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showMap
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      {showMap ? (
        <div className="h-96 bg-gray-200 rounded-lg">
          <Map listings={listings} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 text-lg">
                No properties found matching your criteria.
              </div>
              <p className="text-gray-400 mt-2">
                Try adjusting your search filters or browse all available properties.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;