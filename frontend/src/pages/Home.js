import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Hotel, Home, Mountain, ArrowRight, ChevronRight } from 'lucide-react';
import { Navbar, Footer } from '../components/Layout';
import { PropertyCard, DestinationCard } from '../components/PropertyCard';
import { getFeaturedProperties, getDestinations, getStats } from '../services/api';

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({ hotels: 0, homestays: 0, adventures: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, destRes, statsRes] = await Promise.all([
          getFeaturedProperties(),
          getDestinations(),
          getStats()
        ]);
        setFeaturedProperties(featuredRes.data);
        setDestinations(destRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/properties?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[85vh] overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
            alt="Beautiful mountain landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <span className="text-white/80 uppercase tracking-[0.3em] text-sm mb-4 animate-fadeIn">
            Discover India
          </span>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tight max-w-4xl leading-tight animate-fadeIn" style={{animationDelay: '0.1s'}}>
            Find Your Perfect<br />
            <span className="text-secondary">Stay</span> in India
          </h1>
          <p className="text-white/80 text-lg md:text-xl mt-6 max-w-2xl animate-fadeIn" style={{animationDelay: '0.2s'}}>
            From luxury hotels to cozy homestays and thrilling adventures. Discover handpicked accommodations across incredible India.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-10 w-full max-w-2xl animate-fadeIn" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-2xl">
              <Search className="w-5 h-5 text-muted-foreground ml-4" />
              <input
                type="text"
                placeholder="Search destinations, hotels, homestays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                data-testid="hero-search-input"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                data-testid="hero-search-btn"
              >
                Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center gap-8 md:gap-16 mt-12 animate-fadeIn" style={{animationDelay: '0.4s'}}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-white">
                <Hotel className="w-5 h-5" />
                <span className="text-3xl font-bold">{stats.hotels}+</span>
              </div>
              <p className="text-white/70 text-sm mt-1">Hotels</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-white">
                <Home className="w-5 h-5" />
                <span className="text-3xl font-bold">{stats.homestays}+</span>
              </div>
              <p className="text-white/70 text-sm mt-1">Homestays</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-white">
                <Mountain className="w-5 h-5" />
                <span className="text-3xl font-bold">{stats.adventures}+</span>
              </div>
              <p className="text-white/70 text-sm mt-1">Adventures</p>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section className="py-20 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto" data-testid="destinations-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium">Explore</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">Popular Destinations</h2>
          </div>
          <Link
            to="/properties"
            className="hidden md:flex items-center gap-2 text-primary hover:underline font-medium"
            data-testid="view-all-destinations"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {destinations.slice(0, 4).map((dest, index) => (
              <DestinationCard key={`${dest.state}-${dest.location}`} destination={dest} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Properties Section */}
      <section className="py-20 bg-muted/50" data-testid="featured-section">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium">Handpicked</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">Featured Stays</h2>
            </div>
            <Link
              to="/properties"
              className="hidden md:flex items-center gap-2 text-primary hover:underline font-medium"
              data-testid="view-all-properties"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
              {featuredProperties.slice(0, 6).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Property Types Section */}
      <section className="py-20 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium">Categories</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">Explore by Type</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            to="/properties?type=hotel"
            className="group relative block rounded-2xl overflow-hidden h-72 img-zoom"
            data-testid="category-hotels"
          >
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
              alt="Hotels"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Hotel className="w-8 h-8 text-white mb-2" />
              <h3 className="font-serif text-2xl font-semibold text-white">Hotels</h3>
              <p className="text-white/80 mt-1">Luxury & comfort stays</p>
              <div className="flex items-center gap-2 mt-4 text-white group-hover:translate-x-2 transition-transform">
                <span>Explore</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link
            to="/properties?type=homestay"
            className="group relative block rounded-2xl overflow-hidden h-72 img-zoom"
            data-testid="category-homestays"
          >
            <img
              src="https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"
              alt="Homestays"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Home className="w-8 h-8 text-white mb-2" />
              <h3 className="font-serif text-2xl font-semibold text-white">Homestays</h3>
              <p className="text-white/80 mt-1">Authentic local experiences</p>
              <div className="flex items-center gap-2 mt-4 text-white group-hover:translate-x-2 transition-transform">
                <span>Explore</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link
            to="/properties?type=adventure"
            className="group relative block rounded-2xl overflow-hidden h-72 img-zoom"
            data-testid="category-adventures"
          >
            <img
              src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"
              alt="Adventures"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Mountain className="w-8 h-8 text-white mb-2" />
              <h3 className="font-serif text-2xl font-semibold text-white">Adventures</h3>
              <p className="text-white/80 mt-1">Thrilling experiences</p>
              <div className="flex items-center gap-2 mt-4 text-white group-hover:translate-x-2 transition-transform">
                <span>Explore</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary" data-testid="cta-section">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground">
            Own a Property?
          </h2>
          <p className="text-primary-foreground/80 text-lg mt-4 max-w-2xl mx-auto">
            List your hotel, homestay, or adventure business on PropertyHub and reach thousands of travelers looking for their next destination.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/90 transition-colors"
            data-testid="list-property-btn"
          >
            List Your Property <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
