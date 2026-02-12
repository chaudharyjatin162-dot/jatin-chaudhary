import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Clock, CheckCircle2, XCircle, Plus, Edit, Trash2, Eye, LogOut, IndianRupee } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { ownerAPI, propertiesAPI, formatPrice } from '../lib/api';
import { toast } from 'sonner';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem('travo_user');
    const token = localStorage.getItem('travo_token');
    
    if (!storedUser || !token) {
      navigate('/list-property');
      return;
    }
    
    setUser(JSON.parse(storedUser));
    loadProperties();
  }, [navigate]);

  const loadProperties = async () => {
    try {
      const res = await ownerAPI.getProperties();
      setProperties(res.data);
      
      // Calculate stats
      const s = res.data.reduce((acc, p) => {
        acc.total++;
        acc[p.status]++;
        return acc;
      }, { total: 0, pending: 0, approved: 0, rejected: 0 });
      setStats(s);
    } catch (error) {
      console.error('Error loading properties:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('travo_token');
        localStorage.removeItem('travo_user');
        navigate('/list-property');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    try {
      await propertiesAPI.delete(propertyId);
      toast.success('Property deleted successfully');
      loadProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('travo_token');
    localStorage.removeItem('travo_user');
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="status-pending">Pending Review</Badge>;
      case 'approved':
        return <Badge className="status-approved">Approved</Badge>;
      case 'rejected':
        return <Badge className="status-rejected">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 hidden sm:block">Welcome, {user.name}</span>
              <Button variant="ghost" onClick={handleLogout} className="text-slate-600" data-testid="logout-btn">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900" data-testid="dashboard-title">
              My Properties
            </h1>
            <p className="text-slate-600 mt-1">Manage your listed properties</p>
          </div>
          <Link to="/list-property">
            <Button className="bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 rounded-full btn-glow" data-testid="add-property-btn">
              <Plus className="w-5 h-5 mr-2" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-testid="stats-total">{stats.total}</p>
                  <p className="text-sm text-slate-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-testid="stats-pending">{stats.pending}</p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-testid="stats-approved">{stats.approved}</p>
                  <p className="text-sm text-slate-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-testid="stats-rejected">{stats.rejected}</p>
                  <p className="text-sm text-slate-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-white animate-pulse h-[200px]" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties yet</h3>
              <p className="text-slate-600 mb-6">Start by listing your first property on Travo</p>
              <Link to="/list-property">
                <Button className="bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 rounded-full" data-testid="empty-add-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="border-0 shadow-lg overflow-hidden card-hover" data-testid={`owner-property-${property.id}`}>
                <div className="flex">
                  <div className="w-40 h-40 flex-shrink-0">
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">{property.name}</h3>
                        <p className="text-sm text-slate-500">{property.city}, {property.state}</p>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>
                    <p className="text-lg font-bold text-[#FF5A1F] mb-2" data-testid={`owner-price-${property.id}`}>
                      {formatPrice(property.price_per_night)}
                      <span className="text-sm text-slate-500 font-normal"> /night</span>
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                      <Link to={`/property/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full rounded-lg" data-testid={`view-btn-${property.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50" data-testid={`delete-btn-${property.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Property</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{property.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(property.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
