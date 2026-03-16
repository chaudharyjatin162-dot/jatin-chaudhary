import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Hotel, Home, Mountain } from 'lucide-react';
import { Navbar, Footer } from '../components/Layout';
import { PropertyCard } from '../components/PropertyCard';
import { getProperties } from '../services/api';

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    state: searchParams.get('state') || '',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.type) params.property_type = filters.type;
        if (filters.state) params.state = filters.state;
        if (filters.search) params.search = filters.search;
        if (filters.minPrice) params.min_price = filters.minPrice;
        if (filters.maxPrice) params.max_price = filters.maxPrice;

        const response = await getProperties(params);
        setProperties(response.data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (value) {
      searchParams.set(key === 'type' ? 'type' : key, value);
    } else {
      searchParams.delete(key === 'type' ? 'type' : key);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setFilters({ type: '', state: '', search: '', minPrice: '', maxPrice: '' });
    setSearchParams({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const states = ['Rajasthan', 'Himachal Pradesh', 'Kerala', 'Goa', 'Uttarakhand', 'Ladakh', 'Karnataka', 'Tamil Nadu'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary py-16 px-6" data-testid="properties-header">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground">
            {filters.type ? `${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}s` : 'All Properties'}
          </h1>
          <p className="text-primary-foreground/80 mt-4">
            {filters.state ? `Explore stays in ${filters.state}` : 'Discover your perfect stay across India'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search properties..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="search-properties-input"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-white"
            data-testid="toggle-filters-btn"
          >
            <Filter className="w-5 h-5" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-border">
              <button
                onClick={() => handleFilterChange('type', '')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !filters.type ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('type', 'hotel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.type === 'hotel' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                data-testid="filter-hotels"
              >
                <Hotel className="w-4 h-4" /> Hotels
              </button>
              <button
                onClick={() => handleFilterChange('type', 'homestay')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.type === 'homestay' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                data-testid="filter-homestays"
              >
                <Home className="w-4 h-4" /> Homestays
              </button>
              <button
                onClick={() => handleFilterChange('type', 'adventure')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.type === 'adventure' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                data-testid="filter-adventures"
              >
                <Mountain className="w-4 h-4" /> Adventures
              </button>
            </div>

            {/* State Filter */}
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="filter-state"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                data-testid="clear-filters-btn"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="md:hidden mb-8 p-6 bg-white rounded-2xl border border-border animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Property Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['', 'hotel', 'homestay', 'adventure'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange('type', type)}
                    className={`py-2 px-4 rounded-lg border text-sm ${
                      filters.type === type 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">State</label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border"
                />
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="w-full py-2 text-destructive border border-destructive rounded-lg"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          {loading ? 'Loading...' : `${properties.length} properties found`}
        </p>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No properties found</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="properties-grid">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
