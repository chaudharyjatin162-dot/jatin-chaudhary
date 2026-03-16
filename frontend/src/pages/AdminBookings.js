import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, CalendarCheck, LogOut, Menu, X,
  Search, Filter, Calendar, User, Mail, Phone, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getAdminBookings, updateBookingStatus } from '../services/api';

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      const response = await getAdminBookings(filterStatus || undefined);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking ${newStatus}`);
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.guest_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/properties', label: 'Properties', icon: Building2 },
    { path: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
            <h1 className="font-serif text-xl font-semibold">Bookings Management</h1>
            <div className="text-sm text-muted-foreground">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </div>
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
                placeholder="Search by guest name, email or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="search-bookings"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-white"
                data-testid="filter-status-select"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <div className="divide-y divide-border" data-testid="bookings-list">
                {filteredBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                    data-testid={`booking-row-${booking.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{booking.property_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            booking.property_type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                            booking.property_type === 'homestay' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {booking.property_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {booking.guest_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {booking.guest_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">₹{booking.total_price?.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg animate-scaleIn" data-testid="booking-detail-modal">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Property Info */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedBooking.property_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  selectedBooking.property_type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                  selectedBooking.property_type === 'homestay' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {selectedBooking.property_type}
                </span>
              </div>

              {/* Guest Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Guest Information</h4>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedBooking.guest_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <a href={`mailto:${selectedBooking.guest_email}`} className="text-primary hover:underline">
                    {selectedBooking.guest_email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <a href={`tel:${selectedBooking.guest_phone}`} className="text-primary hover:underline">
                    {selectedBooking.guest_phone}
                  </a>
                </div>
              </div>

              {/* Booking Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Check-in</div>
                    <div className="font-medium">{formatDate(selectedBooking.check_in)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Check-out</div>
                    <div className="font-medium">{formatDate(selectedBooking.check_out)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Guests</div>
                    <div className="font-medium">{selectedBooking.guests}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-bold text-primary text-lg">₹{selectedBooking.total_price?.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider mb-2">Status</h4>
                <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider mb-3">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.status !== 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
                      data-testid="confirm-booking-btn"
                    >
                      Confirm
                    </button>
                  )}
                  {selectedBooking.status !== 'completed' && selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                      data-testid="complete-booking-btn"
                    >
                      Mark Completed
                    </button>
                  )}
                  {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
                      data-testid="cancel-booking-btn"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
