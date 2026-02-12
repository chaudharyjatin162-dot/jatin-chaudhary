import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Home as HomeIcon, Mountain, Mail, Lock, User, Phone, ArrowRight, ArrowLeft, MapPin, IndianRupee, Image, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { authAPI, propertiesAPI } from '../lib/api';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const propertySchema = z.object({
  name: z.string().min(3, 'Property name must be at least 3 characters'),
  property_type: z.string().min(1, 'Please select property type'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.string().min(3, 'Location is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  address: z.string().min(10, 'Full address is required'),
  price_per_night: z.number().min(100, 'Price must be at least ₹100'),
  rooms: z.number().min(1, 'At least 1 room required'),
  max_guests: z.number().min(1, 'At least 1 guest required'),
});

const ListProperty = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' }
  });

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const propertyForm = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '', property_type: '', description: '', location: '',
      city: '', state: '', address: '', price_per_night: 0, rooms: 1, max_guests: 2
    }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('travo_user');
    const token = localStorage.getItem('travo_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleRegister = async (data) => {
    try {
      setIsSubmitting(true);
      const res = await authAPI.register({ ...data, role: 'owner' });
      localStorage.setItem('travo_token', res.data.access_token);
      localStorage.setItem('travo_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      toast.success('Registration successful! Now list your property.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (data) => {
    try {
      setIsSubmitting(true);
      const res = await authAPI.login(data);
      localStorage.setItem('travo_token', res.data.access_token);
      localStorage.setItem('travo_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePropertySubmit = async (data) => {
    if (!selectedType) {
      toast.error('Please select a property type');
      return;
    }
    if (selectedAmenities.length === 0) {
      toast.error('Please select at least one amenity');
      return;
    }
    if (imageUrls.filter(url => url.trim()).length === 0) {
      toast.error('Please add at least one image URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const propertyData = {
        ...data,
        property_type: selectedType,
        amenities: selectedAmenities,
        images: imageUrls.filter(url => url.trim()),
      };
      await propertiesAPI.create(propertyData);
      toast.success('Property submitted for approval! Our team will review it shortly.');
      navigate('/owner/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypes = [
    { value: 'hotel', label: 'Hotel', icon: Building2, description: 'Hotels, resorts, and lodges' },
    { value: 'homestay', label: 'Homestay', icon: HomeIcon, description: 'Home stays and guest houses' },
    { value: 'adventure', label: 'Adventure', icon: Mountain, description: 'Camps, trekking, and activities' },
  ];

  const amenitiesList = [
    'WiFi', 'AC', 'Parking', 'Pool', 'Restaurant', 'Spa', 'Gym', 'Bar',
    'Room Service', 'Beach Access', 'Mountain View', 'Garden', 'Kitchen',
    'TV', 'Hot Water', 'Laundry', 'Bonfire', 'Breakfast'
  ];

  const addImageUrl = () => {
    if (imageUrls.length < 5) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const updateImageUrl = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  // If not logged in, show auth form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2" data-testid="logo">
                <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-slate-900 mb-2" data-testid="auth-title">
              List Your Property
            </h1>
            <p className="text-slate-600">Sign in or create an account to get started</p>
          </div>

          <Card className="border-0 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10 h-12 rounded-xl"
                          {...loginForm.register('email')}
                          data-testid="login-email"
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-12 rounded-xl"
                          {...loginForm.register('password')}
                          data-testid="login-password"
                        />
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 btn-glow"
                      disabled={isSubmitting}
                      data-testid="login-submit"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div>
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-name"
                          placeholder="John Doe"
                          className="pl-10 h-12 rounded-xl"
                          {...registerForm.register('name')}
                          data-testid="register-name"
                        />
                      </div>
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10 h-12 rounded-xl"
                          {...registerForm.register('email')}
                          data-testid="register-email"
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-phone"
                          placeholder="9876543210"
                          className="pl-10 h-12 rounded-xl"
                          {...registerForm.register('phone')}
                          data-testid="register-phone"
                        />
                      </div>
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-12 rounded-xl"
                          {...registerForm.register('password')}
                          data-testid="register-password"
                        />
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 btn-glow"
                      disabled={isSubmitting}
                      data-testid="register-submit"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Property listing form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <span className="text-2xl font-display font-bold text-[#FF5A1F]">Travo</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-600">Welcome, {user.name}</span>
              <Link to="/owner/dashboard">
                <Button variant="outline" className="rounded-full" data-testid="dashboard-link">
                  My Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s ? 'bg-[#FF5A1F] text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-[#FF5A1F]' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={propertyForm.handleSubmit(handlePropertySubmit)}>
          {/* Step 1: Property Type */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-slate-900" data-testid="step1-title">
                  What type of property?
                </h2>
                <p className="text-slate-600 mt-2">Select the category that best describes your property</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      selectedType === type.value
                        ? 'border-[#FF5A1F] bg-[#FF5A1F]/5'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    data-testid={`property-type-${type.value}`}
                  >
                    <type.icon className={`w-10 h-10 mb-4 ${selectedType === type.value ? 'text-[#FF5A1F]' : 'text-slate-400'}`} />
                    <h3 className="font-semibold text-slate-900">{type.label}</h3>
                    <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>

              <Button
                type="button"
                onClick={() => selectedType && setStep(2)}
                disabled={!selectedType}
                className="w-full h-12 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90"
                data-testid="next-step-btn"
              >
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-slate-900" data-testid="step2-title">
                  Property Details
                </h2>
                <p className="text-slate-600 mt-2">Tell us more about your property</p>
              </div>

              <Card className="border-0 shadow-lg rounded-2xl mb-6">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="name">Property Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Luxury Beach Villa"
                      className="mt-1 h-12 rounded-xl"
                      {...propertyForm.register('name')}
                      data-testid="property-name-input"
                    />
                    {propertyForm.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">{propertyForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your property, amenities, and what makes it special..."
                      className="mt-1 rounded-xl min-h-[120px]"
                      {...propertyForm.register('description')}
                      data-testid="property-description-input"
                    />
                    {propertyForm.formState.errors.description && (
                      <p className="text-sm text-red-500 mt-1">{propertyForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Area/Locality *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Calangute Beach"
                        className="mt-1 h-12 rounded-xl"
                        {...propertyForm.register('location')}
                        data-testid="property-location-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Goa"
                        className="mt-1 h-12 rounded-xl"
                        {...propertyForm.register('city')}
                        data-testid="property-city-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="e.g., Goa"
                        className="mt-1 h-12 rounded-xl"
                        {...propertyForm.register('state')}
                        data-testid="property-state-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Full Address *</Label>
                      <Input
                        id="address"
                        placeholder="Complete address"
                        className="mt-1 h-12 rounded-xl"
                        {...propertyForm.register('address')}
                        data-testid="property-address-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Price per Night (₹) *</Label>
                      <div className="relative mt-1">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="5000"
                          className="pl-10 h-12 rounded-xl"
                          {...propertyForm.register('price_per_night', { valueAsNumber: true })}
                          data-testid="property-price-input"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="rooms">Rooms *</Label>
                      <Input
                        id="rooms"
                        type="number"
                        min="1"
                        className="mt-1 h-12 rounded-xl"
                        {...propertyForm.register('rooms', { valueAsNumber: true })}
                        data-testid="property-rooms-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guests">Max Guests *</Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        className="mt-1 h-12 rounded-xl"
                        {...propertyForm.register('max_guests', { valueAsNumber: true })}
                        data-testid="property-guests-input"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl"
                  data-testid="prev-step-btn"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90"
                  data-testid="next-step-btn"
                >
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Amenities & Images */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-slate-900" data-testid="step3-title">
                  Amenities & Images
                </h2>
                <p className="text-slate-600 mt-2">What does your property offer?</p>
              </div>

              <Card className="border-0 shadow-lg rounded-2xl mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Amenities</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          setSelectedAmenities(prev =>
                            prev.includes(amenity)
                              ? prev.filter(a => a !== amenity)
                              : [...prev, amenity]
                          );
                        }}
                        className={`px-4 py-2 rounded-full border transition-all ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-[#FF5A1F] text-white border-[#FF5A1F]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`amenity-${amenity}`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-2xl mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Property Images</CardTitle>
                  <CardDescription>Add image URLs (max 5)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="relative flex-1">
                        <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={url}
                          onChange={(e) => updateImageUrl(idx, e.target.value)}
                          className="pl-10 h-12 rounded-xl"
                          data-testid={`image-url-${idx}`}
                        />
                      </div>
                      {imageUrls.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeImageUrl(idx)}
                          className="h-12 px-4 rounded-xl"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  {imageUrls.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addImageUrl}
                      className="w-full h-12 rounded-xl"
                      data-testid="add-image-btn"
                    >
                      + Add Another Image
                    </Button>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 rounded-xl"
                  data-testid="prev-step-btn"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 btn-glow"
                  disabled={isSubmitting}
                  data-testid="submit-property-btn"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Submit for Approval</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ListProperty;
