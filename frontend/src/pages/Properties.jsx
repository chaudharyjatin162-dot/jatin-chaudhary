import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, Users, Filter, X, ChevronDown, Building2, Home as HomeIcon, Mountain } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { propertiesAPI, formatPrice } from '../lib/api';

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    loadProperties();
  }, [searchParams]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const params = {};
      const q = searchParams.get('q');
      const type = searchParams.get('type');
      
      if (q) params.city = q;
      if (type) params.property_type = type;
      
      const res = await propertiesAPI.getAll(params);
      let data = res.data;
      
      // Apply price filter
      data = data.filter(p => p.price_per_night >= priceRange[0] && p.price_per_night <= priceRange[1]);
      
      // Apply sorting
      if (sortBy === 'price_low') {
        data.sort((a, b) => a.price_per_night - b.price_per_night);
      } else if (sortBy === 'price_high') {
        data.sort((a, b) => b.price_per_night - a.price_per_night);
      } else {
        data.sort((a, b) => b.rating - a.rating);
      }
      
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleTypeFilter = (type) => {
    const params = new URLSearchParams(searchParams);
    if (type && type !== 'all') {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    setSearchParams(params);
    setPropertyType(type);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setPropertyType('');
    setPriceRange([0, 20000]);
  };

  const propertyTypes = [
    { value: 'all', label: 'All Types', icon: null },
    { value: 'hotel', label: 'Hotels', icon: Building2 },
    { value: 'homestay', label: 'Homestays', icon: HomeIcon },
    { value: 'adventure', label: 'Adventures', icon: Mountain },
  ];

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Property Type</h4>
        <div className="space-y-2">
          {propertyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeFilter(type.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                propertyType === type.value || (!propertyType && type.value === 'all')
                  ? 'bg-[#FF5A1F] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid={`filter-type-${type.value}`}
            >
              {type.icon && <type.icon className="w-5 h-5" />}
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Price Range</h4>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={20000}
            step={500}
            className="mb-4"
            data-testid="price-slider"
          />
          <div className="flex justify-between text-sm text-slate-600">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      <Button onClick={loadProperties} className="w-full bg-[#FF5A1F] hover:bg-[#FF5A1F]/90" data-testid="apply-filters-btn">
        Apply Filters
      </Button>
      
      <Button variant="outline" onClick={clearFilters} className="w-full" data-testid="clear-filters-btn">
        Clear All
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/list-property">
                <Button variant="outline" className="rounded-full border-[#FF5A1F] text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white" data-testid="list-property-btn">
                  List Your Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by city, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="h-12 px-6 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90" data-testid="search-btn">
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-12 rounded-xl" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-12 px-4 rounded-xl" data-testid="mobile-filter-btn">
                  <Filter className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters */}
        {(searchParams.get('q') || searchParams.get('type')) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchParams.get('q') && (
              <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                <MapPin className="w-3 h-3" />
                {searchParams.get('q')}
                <button onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('q');
                  setSearchParams(params);
                  setSearchQuery('');
                }}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {searchParams.get('type') && (
              <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                {searchParams.get('type').charAt(0).toUpperCase() + searchParams.get('type').slice(1)}
                <button onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('type');
                  setSearchParams(params);
                  setPropertyType('');
                }}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-lg mb-6">Filters</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Properties Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600" data-testid="results-count">
                {properties.length} properties found
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-[350px]" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search or filters</p>
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property, idx) => (
                  <Link
                    key={property.id}
                    to={`/property/${property.id}`}
                    className="group card-hover animate-fadeIn"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    data-testid={`property-card-${property.id}`}
                  >
                    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
                      <div className="relative img-zoom">
                        <div className="aspect-[16/10]">
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
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{property.description}</p>
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
        </div>
      </div>
    </div>
  );
};

export default Properties;
