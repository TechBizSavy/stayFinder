import React from 'react';
import { Link } from 'react-router-dom';

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  host: {
    name: string;
  };
}

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const defaultImage = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800';
  const imageUrl = listing.images && listing.images.length > 0 
    ? (listing.images[0].startsWith('http') ? listing.images[0] : `http://localhost:3001${listing.images[0]}`)
    : defaultImage;

  return (
    <Link to={`/listing/${listing.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultImage;
            }}
          />
          <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-sm font-semibold text-gray-900">
            ${listing.price}/night
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2">{listing.location}</p>
          <p className="text-gray-500 text-sm mb-3">Hosted by {listing.host.name}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>{listing.maxGuests} guests</span>
              <span>{listing.bedrooms} bedrooms</span>
              <span>{listing.bathrooms} bathrooms</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;