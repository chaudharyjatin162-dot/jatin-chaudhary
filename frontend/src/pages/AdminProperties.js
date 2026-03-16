import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, CalendarCheck, LogOut, Menu, X,
  Plus, Edit2, Trash2, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getAdminProperties, createProperty, updateProperty, deleteProperty } from '../services/api';

export default function AdminPropertiesPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    property_type: 'hotel',
    location: '',
    state: '',
    price_per_night: '',
    description: '',
    amenities: [],
    images: [''],
    is_featured: false
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await getAdminProperties();
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const openAddModal = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      property_type: 'hotel',
      location: '',
      state: '',
      price_per_night: '',
      description: '',
      amenities: [],
      images: [''],
      is_featured: false
    });
    setShowModal(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      property_type: property.property_type,
      location: property.location,
      state: property.state,
      price_per_night: property.price_per_night,
      description: property.description,
      amenities: property.amenities || [],
      images: property.images?.length > 0 ? property.images : [''],
      is_featured: property.is_featured
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      price_per_night: parseFloat(formData.price_per_night),
      images: formData.images.filter(img => img.trim() !== '')
    };

    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, data);
        toast.success('Property updated successfully');
      } else {
        await createProperty(data);
        toast.success('Property created successfully');
      }
      setShowModal(false);
      fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(error.response?.data?.detail || 'Failed to save property');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await deleteProperty(id);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || p.property_type === filterType;
    return matchesSearch && matchesType;
  });

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/properties', label: 'Properties', icon: Building2 },
    { path: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  ];

  const amenityOptions = ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'AC', 'Breakfast', 'Room Service', 'Lake View', 'Mountain View', 'Beach Access', 'Garden', 'Bonfire'];
  const states = ['Rajasthan', 'Himachal Pradesh', 'Kerala', 'Goa', 'Uttarakhand', 'Ladakh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'West Bengal'];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-foreground text-background z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif font-bold">PropertyHub</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-background/70 hover:text-background"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-background/70 hover:bg-background/10 hover:text-background'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="border-t border-background/20 pt-6">
            <div className="text-sm text-background/70 mb-2">{admin?.name}</div>
            <div className="text-xs text-background/50 mb-4">{admin?.email}</div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-background/70 hover:text-background transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-border px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-serif text-xl font-semibold">Properties Management</h1>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="add-property-btn"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="search-admin-properties"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-white"
                data-testid="filter-type-select"
              >
                <option value="">All Types</option>
                <option value="hotel">Hotels</option>
                <option value="homestay">Homestays</option>
                <option value="adventure">Adventures</option>
              </select>
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No properties found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="properties-table">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">Property</th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">Location</th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">Price/Night</th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-6 py-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr key={property.id} className="border-b border-border hover:bg-muted/30" data-testid={`property-row-${property.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100'}
                              alt={property.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-medium">{property.name}</div>
                              <div className="text-sm text-muted-foreground">{property.rating} rating</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            property.property_type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                            property.property_type === 'homestay' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {property.property_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {property.location}, {property.state}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          ₹{property.price_per_night?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            property.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {property.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {property.is_featured && (
                            <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Featured
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(property)}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              data-testid={`edit-property-${property.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              data-testid={`delete-property-${property.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" data-testid="property-modal">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="text-sm font-medium block mb-2">Property Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., The Grand Palace Hotel"
                  data-testid="property-name-input"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium block mb-2">Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="property-type-select"
                >
                  <option value="hotel">Hotel</option>
                  <option value="homestay">Homestay</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>

              {/* Location & State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Udaipur"
                    data-testid="property-location-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                    data-testid="property-state-select"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-sm font-medium block mb-2">Price per Night (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., 5000"
                  data-testid="property-price-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium block mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Describe the property..."
                  data-testid="property-description-input"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="text-sm font-medium block mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        const newAmenities = formData.amenities.includes(amenity)
                          ? formData.amenities.filter(a => a !== amenity)
                          : [...formData.amenities, amenity];
                        setFormData({ ...formData, amenities: newAmenities });
                      }}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        formData.amenities.includes(amenity)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm font-medium block mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.images[0]}
                  onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://images.unsplash.com/..."
                  data-testid="property-image-input"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  data-testid="property-featured-checkbox"
                />
                <label htmlFor="featured" className="text-sm">Mark as Featured</label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-border rounded-full font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                  data-testid="save-property-btn"
                >
                  {editingProperty ? 'Update Property' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
