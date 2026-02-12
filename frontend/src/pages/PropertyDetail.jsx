import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Users, Bed, Wifi, Car, Utensils, Waves, Mountain, ArrowLeft, Heart, Share2, Check, Navigation } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { propertiesAPI, formatPrice } from '../lib/api';

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Restaurant': Utensils,
  'Pool': Waves,
  'Mountain View': Mountain,
  'AC': Waves,
  'Beach Access': Waves,
  'Spa': Waves,
};

const PropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const [propertyRes, nearbyRes] = await Promise.all([
        propertiesAPI.getById(id),
        propertiesAPI.getNearby(id)
      ]);
      setProperty(propertyRes.data);
      setNearbyPlaces(nearbyRes.data);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="w-64 h-8 bg-slate-200 rounded" />
          <div className="w-48 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Property not found</h2>
          <Link to="/properties">
            <Button>Back to Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/properties" className="flex items-center gap-2 text-slate-700 hover:text-[#FF5A1F] transition-colors" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsFavorite(!isFavorite)}
                data-testid="favorite-btn"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" data-testid="share-btn">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 animate-fadeIn">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden">
            <img
              src={property.images[selectedImage]}
              alt={property.name}
              className="w-full h-full object-cover"
              data-testid="main-image"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {property.images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-[4/3] rounded-xl overflow-hidden transition-all ${
                  selectedImage === idx ? 'ring-4 ring-[#FF5A1F]' : 'opacity-80 hover:opacity-100'
                }`}
                data-testid={`gallery-image-${idx}`}
              >
                <img src={img} alt={`${property.name} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Section */}
            <div className="animate-fadeIn stagger-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge className="bg-[#FF5A1F]/10 text-[#FF5A1F] border-0">
                  {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
                </Badge>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold text-slate-900">{property.rating}</span>
                  <span className="text-slate-500">({property.reviews_count} reviews)</span>
                </div>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3" data-testid="property-name">
                {property.name}
              </h1>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-5 h-5" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn stagger-2">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Bed className="w-6 h-6 mx-auto mb-2 text-[#FF5A1F]" />
                <p className="font-semibold text-slate-900">{property.rooms}</p>
                <p className="text-sm text-slate-500">Rooms</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-[#FF5A1F]" />
                <p className="font-semibold text-slate-900">{property.max_guests}</p>
                <p className="text-sm text-slate-500">Guests</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-[#FF5A1F]" />
                <p className="font-semibold text-slate-900">{property.rating}</p>
                <p className="text-sm text-slate-500">Rating</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-[#FF5A1F]" />
                <p className="font-semibold text-slate-900">{property.city}</p>
                <p className="text-sm text-slate-500">Location</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="animate-fadeIn stagger-3">
              <TabsList className="w-full justify-start bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="about" className="rounded-lg" data-testid="tab-about">About</TabsTrigger>
                <TabsTrigger value="amenities" className="rounded-lg" data-testid="tab-amenities">Amenities</TabsTrigger>
                <TabsTrigger value="nearby" className="rounded-lg" data-testid="tab-nearby">Nearby Places</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <h3 className="font-semibold text-lg text-slate-900 mb-3">About this property</h3>
                <p className="text-slate-600 leading-relaxed" data-testid="property-description">
                  {property.description}
                </p>
              </TabsContent>

              <TabsContent value="amenities" className="mt-6">
                <h3 className="font-semibold text-lg text-slate-900 mb-4">What this place offers</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, idx) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl" data-testid={`amenity-${idx}`}>
                        <div className="p-2 bg-[#FF5A1F]/10 rounded-lg">
                          <Icon className="w-5 h-5 text-[#FF5A1F]" />
                        </div>
                        <span className="text-slate-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="nearby" className="mt-6">
                <h3 className="font-semibold text-lg text-slate-900 mb-4">Best Places to Visit Nearby</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="nearby-places">
                  {nearbyPlaces.map((place) => (
                    <Card key={place.id} className="overflow-hidden card-hover" data-testid={`nearby-place-${place.id}`}>
                      <div className="flex">
                        <div className="w-24 h-24 flex-shrink-0">
                          <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-3 flex-1">
                          <h4 className="font-semibold text-slate-900 line-clamp-1">{place.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{place.type}</Badge>
                            <span className="text-xs text-slate-500">{place.distance}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-medium text-slate-700">{place.rating}</span>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Mock Map */}
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200" data-testid="property-map">
                  <div className="aspect-video bg-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Map View</p>
                      <p className="text-sm text-slate-500">
                        {property.city}, {property.state}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Lat: {property.latitude?.toFixed(4)}, Long: {property.longitude?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-xl border-0 rounded-2xl overflow-hidden animate-fadeIn">
                <CardHeader className="bg-gradient-to-br from-[#FF5A1F] to-[#FF7A4F] text-white p-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold price-tag" data-testid="booking-price">
                      {formatPrice(property.price_per_night)}
                    </span>
                    <span className="text-white/80">/ night</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-500">Check In</label>
                      <input
                        type="date"
                        className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        data-testid="checkin-date"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Check Out</label>
                      <input
                        type="date"
                        className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        data-testid="checkout-date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500">Guests</label>
                    <select
                      className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                      data-testid="guests-select"
                    >
                      {Array.from({ length: property.max_guests }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="w-full h-14 text-lg rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 btn-glow"
                    data-testid="book-now-btn"
                  >
                    Book Now
                  </Button>
                  <p className="text-center text-sm text-slate-500">
                    You won't be charged yet
                  </p>
                </CardContent>
              </Card>

              {/* Host Info */}
              <Card className="mt-4 border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Hosted by</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FF5A1F] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {property.owner_name?.charAt(0) || 'H'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{property.owner_name || 'Host'}</p>
                      <p className="text-sm text-slate-500">Verified Host</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
