import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';

export const PropertyCard = ({ property }) => {
  const typeColors = {
    hotel: 'bg-blue-100 text-blue-800',
    homestay: 'bg-green-100 text-green-800',
    adventure: 'bg-orange-100 text-orange-800'
  };

  return (
    <Link
      to={`/properties/${property.id}`}
      className="group block bg-white border border-border/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
      data-testid={`property-card-${property.id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden img-zoom">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
          alt={property.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${typeColors[property.property_type]}`}>
            {property.property_type}
          </span>
        </div>
        {property.is_featured && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
          <MapPin className="w-4 h-4" />
          <span>{property.location}, {property.state}</span>
        </div>
        
        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {property.name}
        </h3>
        
        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
          {property.description}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{property.rating}</span>
            <span className="text-muted-foreground text-sm">({property.reviews_count})</span>
          </div>
          <div>
            <span className="text-lg font-bold text-primary">₹{property.price_per_night?.toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">/night</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const DestinationCard = ({ destination, index }) => {
  const bgImages = [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600',
    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
  ];

  return (
    <Link
      to={`/properties?state=${encodeURIComponent(destination.state)}`}
      className="group relative block rounded-2xl overflow-hidden h-64 img-zoom"
      data-testid={`destination-card-${destination.state}`}
    >
      <img
        src={destination.image || bgImages[index % bgImages.length]}
        alt={destination.location}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-serif text-xl font-semibold text-white mb-1">
          {destination.location}
        </h3>
        <p className="text-white/80 text-sm">{destination.state}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-white/90 text-sm">{destination.properties_count} properties</span>
          <span className="text-white font-medium">From ₹{destination.starting_price?.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
};
