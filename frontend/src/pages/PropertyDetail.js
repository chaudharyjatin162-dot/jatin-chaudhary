import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Wifi, Car, Coffee, Utensils, Dumbbell, Waves, ArrowLeft, Calendar, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar, Footer } from '../components/Layout';
import { getProperty, createBooking } from '../services/api';

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Breakfast': Coffee,
  'Restaurant': Utensils,
  'Gym': Dumbbell,
  'Pool': Waves,
  'Spa': Waves,
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    guests: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await getProperty(id);
        setProperty(response.data);
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Property not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const calculateNights = () => {
    if (!booking.check_in || !booking.check_out) return 0;
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const diff = checkOut - checkIn;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const totalPrice = calculateNights() * (property?.price_per_night || 0);

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (calculateNights() < 1) {
      toast.error('Please select valid dates');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        property_id: id,
        ...booking
      });
      setBookingSuccess(true);
      toast.success('Booking request submitted successfully!');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-2xl mb-8" />
            <div className="h-8 bg-muted rounded w-1/2 mb-4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Property not found</h1>
          <Link to="/properties" className="mt-4 inline-block text-primary hover:underline">
            Browse all properties
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-8">
        {/* Back Link */}
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          data-testid="back-to-properties"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="rounded-2xl overflow-hidden mb-8" data-testid="property-image">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
                alt={property.name}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Property Info */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  property.property_type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                  property.property_type === 'homestay' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {property.property_type}
                </span>
                {property.is_featured && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="property-name">
                {property.name}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{property.location}, {property.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">{property.rating}</span>
                  <span>({property.reviews_count} reviews)</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-4">About This Property</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="property-description">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="property-amenities">
                {property.amenities?.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div key={amenity} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <Icon className="w-5 h-5 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-border rounded-2xl p-6 shadow-lg" data-testid="booking-form">
              {bookingSuccess ? (
                <div className="text-center py-8 animate-scaleIn">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">Booking Submitted!</h3>
                  <p className="text-muted-foreground mb-6">
                    We've received your booking request. You'll hear from us soon!
                  </p>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="text-primary hover:underline"
                  >
                    Make another booking
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-primary">₹{property.price_per_night?.toLocaleString()}</span>
                    <span className="text-muted-foreground">/night</span>
                  </div>

                  <form onSubmit={handleBooking} className="space-y-4">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Check-in</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="date"
                            required
                            value={booking.check_in}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setBooking({ ...booking, check_in: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            data-testid="booking-checkin"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Check-out</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="date"
                            required
                            value={booking.check_out}
                            min={booking.check_in || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setBooking({ ...booking, check_out: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            data-testid="booking-checkout"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Guests</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                          value={booking.guests}
                          onChange={(e) => setBooking({ ...booking, guests: parseInt(e.target.value) })}
                          className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          data-testid="booking-guests"
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Guest Details */}
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={booking.guest_name}
                        onChange={(e) => setBooking({ ...booking, guest_name: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="John Doe"
                        data-testid="booking-name"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={booking.guest_email}
                        onChange={(e) => setBooking({ ...booking, guest_email: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="john@example.com"
                        data-testid="booking-email"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        value={booking.guest_phone}
                        onChange={(e) => setBooking({ ...booking, guest_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="+91 98765 43210"
                        data-testid="booking-phone"
                      />
                    </div>

                    {/* Price Summary */}
                    {calculateNights() > 0 && (
                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>₹{property.price_per_night?.toLocaleString()} × {calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                          <span>₹{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      data-testid="submit-booking-btn"
                    >
                      {submitting ? 'Submitting...' : 'Request Booking'}
                    </button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    You won't be charged yet
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
