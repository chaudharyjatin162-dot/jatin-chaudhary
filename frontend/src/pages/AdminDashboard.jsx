import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Clock, CheckCircle2, XCircle, Users, LogOut, Eye, Check, X, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { adminAPI, formatPrice } from '../lib/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('travo_user');
    const token = localStorage.getItem('travo_token');
    
    if (!storedUser || !token) {
      navigate('/list-property');
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
      return;
    }
    
    setUser(parsedUser);
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [propertiesRes, statsRes] = await Promise.all([
        adminAPI.getProperties(),
        adminAPI.getStats()
      ]);
      setProperties(propertiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/list-property');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (propertyId, action) => {
    try {
      await adminAPI.propertyAction({
        property_id: propertyId,
        action: action,
        reason: action === 'reject' ? rejectReason : null
      });
      toast.success(`Property ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedProperty(null);
      loadData();
    } catch (error) {
      toast.error(`Failed to ${action} property`);
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
        return <Badge className="status-pending">Pending</Badge>;
      case 'approved':
        return <Badge className="status-approved">Approved</Badge>;
      case 'rejected':
        return <Badge className="status-rejected">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.owner_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
              <Badge className="bg-[#0F172A] text-white">Admin</Badge>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 hidden sm:block">Admin: {user.name}</span>
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900" data-testid="admin-title">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Manage property approvals and platform statistics</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900" data-testid="admin-stats-total">{stats.total_properties}</p>
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
                    <p className="text-2xl font-bold text-slate-900" data-testid="admin-stats-pending">{stats.pending}</p>
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
                    <p className="text-2xl font-bold text-slate-900" data-testid="admin-stats-approved">{stats.approved}</p>
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
                    <p className="text-2xl font-bold text-slate-900" data-testid="admin-stats-rejected">{stats.rejected}</p>
                    <p className="text-sm text-slate-500">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900" data-testid="admin-stats-owners">{stats.total_owners}</p>
                    <p className="text-sm text-slate-500">Owners</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by property name, city, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl"
              data-testid="admin-search"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="all" className="rounded-lg" data-testid="tab-all">
              All ({properties.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg" data-testid="tab-pending">
              Pending ({properties.filter(p => p.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg" data-testid="tab-approved">
              Approved ({properties.filter(p => p.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg" data-testid="tab-rejected">
              Rejected ({properties.filter(p => p.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-white animate-pulse h-[120px]" />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-600">Try adjusting your search or filter</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <Card key={property.id} className="border-0 shadow-lg overflow-hidden" data-testid={`admin-property-${property.id}`}>
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                        <img
                          src={property.images[0]}
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-6 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-slate-900">{property.name}</h3>
                              {getStatusBadge(property.status)}
                            </div>
                            <p className="text-slate-600 text-sm mb-2">{property.city}, {property.state}</p>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-3">{property.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <span className="text-slate-600">
                                <strong>Owner:</strong> {property.owner_name}
                              </span>
                              <span className="text-slate-600">
                                <strong>Type:</strong> {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
                              </span>
                              <span className="font-semibold text-[#FF5A1F]" data-testid={`admin-price-${property.id}`}>
                                {formatPrice(property.price_per_night)}/night
                              </span>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2">
                            <Link to={`/property/${property.id}`} className="flex-1 sm:flex-none">
                              <Button variant="outline" size="sm" className="w-full rounded-lg" data-testid={`admin-view-${property.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            {property.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                                  onClick={() => handleAction(property.id, 'approve')}
                                  data-testid={`admin-approve-${property.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 sm:flex-none text-red-600 hover:bg-red-50 rounded-lg"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setShowRejectDialog(true);
                                  }}
                                  data-testid={`admin-reject-${property.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedProperty?.name}"
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="reject-reason-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleAction(selectedProperty?.id, 'reject')}
              data-testid="confirm-reject-btn"
            >
              Reject Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
