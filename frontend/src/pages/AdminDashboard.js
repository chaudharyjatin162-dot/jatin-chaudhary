import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, CalendarCheck, LogOut, Menu, X,
  Hotel, Home, Mountain, TrendingUp, Users, DollarSign, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/properties', label: 'Properties', icon: Building2 },
    { path: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  ];

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
      }`} data-testid="admin-sidebar">
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
                data-testid={`nav-${item.label.toLowerCase()}`}
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
              data-testid="logout-btn"
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
            <h1 className="font-serif text-xl font-semibold">Dashboard</h1>
            <Link to="/" className="text-sm text-primary hover:underline">
              View Site →
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6" data-testid="dashboard-content">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-border" data-testid="stat-properties">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">{stats?.total_properties || 0}</div>
                  <div className="text-muted-foreground text-sm">Total Properties</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-border" data-testid="stat-bookings">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <CalendarCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stats?.total_bookings || 0}</div>
                  <div className="text-muted-foreground text-sm">Total Bookings</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-border" data-testid="stat-pending">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats?.pending_bookings || 0}</div>
                  <div className="text-muted-foreground text-sm">Pending Bookings</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-border" data-testid="stat-revenue">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">₹{(stats?.total_revenue || 0).toLocaleString()}</div>
                  <div className="text-muted-foreground text-sm">Total Revenue</div>
                </div>
              </div>

              {/* Property Types & Recent Bookings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Types */}
                <div className="bg-white rounded-xl p-6 border border-border">
                  <h2 className="font-serif text-lg font-semibold mb-6">Properties by Type</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Hotel className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Hotels</span>
                          <span>{stats?.properties_by_type?.hotel || 0}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${((stats?.properties_by_type?.hotel || 0) / (stats?.total_properties || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Home className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Homestays</span>
                          <span>{stats?.properties_by_type?.homestay || 0}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${((stats?.properties_by_type?.homestay || 0) / (stats?.total_properties || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Mountain className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Adventures</span>
                          <span>{stats?.properties_by_type?.adventure || 0}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${((stats?.properties_by_type?.adventure || 0) / (stats?.total_properties || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-lg font-semibold">Recent Bookings</h2>
                    <Link to="/admin/bookings" className="text-sm text-primary hover:underline">
                      View All
                    </Link>
                  </div>
                  
                  {stats?.recent_bookings?.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recent_bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{booking.guest_name}</div>
                            <div className="text-sm text-muted-foreground">{booking.property_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{booking.total_price?.toLocaleString()}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No bookings yet</p>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
