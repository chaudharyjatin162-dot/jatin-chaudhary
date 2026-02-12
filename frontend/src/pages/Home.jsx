import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Building2, Home as HomeIcon, Mountain, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { propertiesAPI, destinationsAPI, formatPrice, seedData } from '../lib/api';
import { toast } from 'sonner';

const Home = () => {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Seed data first
      await seedData();
      
      const [propertiesRes, destinationsRes] = await Promise.all([
        propertiesAPI.getFeatured(),
        destinationsAPI.getAll()
      ]);
      setFeaturedProperties(propertiesRes.data);
      setDestinations(destinationsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const storedUser = localStorage.getItem('travo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/properties');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('travo_token');
    localStorage.removeItem('travo_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const propertyTypes = [
    { icon: Building2, label: 'Hotels', count: '500+' },
    { icon: HomeIcon, label: 'Homestays', count: '300+' },
    { icon: Mountain, label: 'Adventures', count: '150+' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/properties" className="nav-link text-slate-700 hover:text-[#FF5A1F] font-medium transition-colors" data-testid="nav-properties">
                Properties
              </Link>
              <Link to="/properties?type=hotel" className="nav-link text-slate-700 hover:text-[#FF5A1F] font-medium transition-colors" data-testid="nav-hotels">
                Hotels
              </Link>
              <Link to="/properties?type=homestay" className="nav-link text-slate-700 hover:text-[#FF5A1F] font-medium transition-colors" data-testid="nav-homestays">
                Homestays
              </Link>
              <Link to="/properties?type=adventure" className="nav-link text-slate-700 hover:text-[#FF5A1F] font-medium transition-colors" data-testid="nav-adventures">
                Adventures
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/list-property">
                <Button variant="outline" className="rounded-full border-[#FF5A1F] text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white" data-testid="list-property-btn">
                  List Your Property
                </Button>
              </Link>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full" data-testid="user-menu-btn">
                      <User className="w-5 h-5 mr-2" />
                      {user.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(user.role === 'admin' ? '/admin' : '/owner/dashboard')} data-testid="dashboard-link">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-btn">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/list-property">
                  <Button className="rounded-full bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 btn-glow" data-testid="sign-in-btn">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} data-testid="mobile-menu-btn">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 animate-fadeIn">
            <div className="px-4 py-4 space-y-3">
              <Link to="/properties" className="block py-2 text-slate-700 font-medium">Properties</Link>
              <Link to="/properties?type=hotel" className="block py-2 text-slate-700 font-medium">Hotels</Link>
              <Link to="/properties?type=homestay" className="block py-2 text-slate-700 font-medium">Homestays</Link>
              <Link to="/properties?type=adventure" className="block py-2 text-slate-700 font-medium">Adventures</Link>
              <Link to="/list-property" className="block py-2 text-[#FF5A1F] font-medium">List Your Property</Link>
              {user && (
                <Link to={user.role === 'admin' ? '/admin' : '/owner/dashboard'} className="block py-2 text-slate-700 font-medium">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1723013148149-af0151b81bbf?w=1920&q=80" 
            alt="Travel" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-overlay" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight animate-fadeIn" data-testid="hero-title">
            Discover India's <br />
            <span className="text-[#FF5A1F]">Hidden Gems</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-fadeIn stagger-1" data-testid="hero-subtitle">
            From luxury resorts to cozy homestays, find your perfect stay across incredible India
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="glass rounded-2xl p-4 md:p-6 max-w-4xl mx-auto animate-scaleIn stagger-2" data-testid="search-form">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Where do you want to go?" 
                  className="pl-12 h-14 rounded-xl border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-location"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  type="date" 
                  className="pl-12 h-14 rounded-xl border-slate-200"
                  data-testid="search-date"
                />
              </div>
              <Button 
                type="submit"
                className="h-14 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white font-semibold btn-glow"
                data-testid="search-btn"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fadeIn stagger-3">
            {propertyTypes.map((type, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                  <type.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{type.count}</p>
                  <p className="text-sm text-white/70">{type.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" data-testid="destinations-title">
                Popular Destinations
              </h2>
              <p className="text-slate-600 mt-2">Explore the most loved places across India</p>
            </div>
            <Link to="/properties" className="hidden sm:flex items-center gap-2 text-[#FF5A1F] font-medium hover:gap-3 transition-all" data-testid="view-all-destinations">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {destinations.map((dest, idx) => (
              <Link 
                key={dest.id} 
                to={`/properties?q=${dest.name}`}
                className={`group relative rounded-2xl overflow-hidden img-zoom animate-fadeIn stagger-${idx + 1}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`destination-${dest.id}`}
              >
                <div className="aspect-[3/4]">
                  <img 
                    src={dest.image} 
                    alt={dest.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-semibold text-lg">{dest.name}</h3>
                  <p className="text-sm text-white/80">{dest.properties_count} properties</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" data-testid="featured-title">
                Featured Stays
              </h2>
              <p className="text-slate-600 mt-2">Handpicked properties for an unforgettable experience</p>
            </div>
            <Link to="/properties" className="hidden sm:flex items-center gap-2 text-[#FF5A1F] font-medium hover:gap-3 transition-all" data-testid="view-all-properties">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-[400px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, idx) => (
                <Link 
                  key={property.id} 
                  to={`/property/${property.id}`}
                  className="group card-hover animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.15}s` }}
                  data-testid={`property-card-${property.id}`}
                >
                  <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
                    <div className="relative img-zoom">
                      <div className="aspect-[4/3]">
                        <img 
                          src={property.images[0]} 
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge className="absolute top-4 left-4 bg-white/90 text-slate-700 backdrop-blur-sm">
                        {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                          {property.name}
                        </h3>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium text-slate-700">{property.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{property.city}, {property.state}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <p className="price-tag text-xl text-[#FF5A1F]" data-testid={`property-price-${property.id}`}>
                          {formatPrice(property.price_per_night)}
                          <span className="text-sm text-slate-500 font-normal"> /night</span>
                        </p>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{property.max_guests} guests</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6" data-testid="cta-title">
            Own a Property?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            List your hotel, homestay, or adventure business on Travo and reach thousands of travelers looking for their next destination.
          </p>
          <Link to="/list-property">
            <Button size="lg" className="rounded-full bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 px-10 py-6 text-lg btn-glow" data-testid="cta-btn">
              List Your Property
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-display text-2xl font-bold text-[#FF5A1F] mb-4">Travo</h3>
              <p className="text-slate-400 text-sm">
                Your gateway to discovering India's most beautiful destinations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/properties" className="hover:text-white transition-colors">All Properties</Link></li>
                <li><Link to="/properties?type=hotel" className="hover:text-white transition-colors">Hotels</Link></li>
                <li><Link to="/properties?type=homestay" className="hover:text-white transition-colors">Homestays</Link></li>
                <li><Link to="/properties?type=adventure" className="hover:text-white transition-colors">Adventures</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Owners</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/list-property" className="hover:text-white transition-colors">List Property</Link></li>
                <li><Link to="/owner/dashboard" className="hover:text-white transition-colors">Owner Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>© 2024 Travo. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
