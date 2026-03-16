import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { loginAdmin } from '../services/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginAdmin(email, password);
      const { id, email: adminEmail, name, token } = response.data;
      login({ id, email: adminEmail, name }, token);
      toast.success(`Welcome back, ${name}!`);
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-serif">PropertyHub</span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Admin Login
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to manage your properties and bookings
          </p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="admin-login-form">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="admin@propertyhub.com"
                  data-testid="admin-email-input"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your password"
                  data-testid="admin-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              data-testid="admin-login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-8 p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground">
              <strong>Demo credentials:</strong><br />
              Email: admin@propertyhub.com<br />
              Password: admin123
            </p>
          </div>

          <p className="mt-8 text-center text-muted-foreground">
            <a href="/" className="text-primary hover:underline">
              ← Back to Homepage
            </a>
          </p>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200"
          alt="Luxury hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <h2 className="font-serif text-4xl font-bold mb-4">
              Manage Your Properties
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              Add new listings, track bookings, and grow your hospitality business with PropertyHub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
