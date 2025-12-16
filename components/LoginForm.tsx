import React, { useState } from 'react';
import { User, Phone, ArrowRight, ChefHat, Store, MapPin, Tag, ArrowLeft, Locate, Loader2, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { registerShopInDatabase } from '../services/shopService';

interface LoginFormProps {
  role: 'customer' | 'owner';
  onSubmit: (profile: UserProfile) => void;
  onBack: () => void;
  initialData?: Partial<UserProfile>;
}

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string; // The display text
  onChange: (val: string) => void;
  onBlur: () => void; // Trigger forward geocoding
  onGetLocation: () => void;
  isLocating: boolean;
  hasCoordinates: boolean;
}

// Extracted component to prevent input focus loss on re-render
const LocationInputField: React.FC<LocationInputProps> = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  onGetLocation, 
  isLocating,
  hasCoordinates
}) => (
  <div>
    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5 flex justify-between">
      <span>{label}</span>
      {hasCoordinates && (
        <span className="text-emerald-600 flex items-center gap-1 text-[10px]">
          <Check className="w-3 h-3" /> GPS Linked
        </span>
      )}
    </label>
    <div className="relative flex gap-2">
      <div className="relative flex-grow">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${hasCoordinates ? 'text-emerald-500' : 'text-stone-400'}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${hasCoordinates ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-300'}`}
          required
        />
      </div>
      <button
        type="button"
        onClick={onGetLocation}
        disabled={isLocating}
        className="px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-colors flex items-center justify-center min-w-[50px]"
        title="Use Current Location"
      >
        {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

const LoginForm: React.FC<LoginFormProps> = ({ role, onSubmit, onBack, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    shopName: initialData?.shopName || '',
    shopType: initialData?.shopType || '',
    location: initialData?.location || '', // Display name (e.g., Mumbai)
    coordinates: initialData?.coordinates || '' // Hidden coords (e.g., 19.07, 72.87)
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to resolve coordinates from string
  const resolveCoordinates = async (loc: string): Promise<string> => {
    // Check if it's already a coordinate pair
    const coordPattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (coordPattern.test(loc)) return loc;

    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(loc)}&limit=1`);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        // Photon returns [lon, lat]
        const [lon, lat] = data.features[0].geometry.coordinates;
        return `${lat}, ${lon}`;
      }
    } catch (e) {
      console.error("Geocoding error", e);
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || formData.phone.length !== 10) return;
    if (role === 'owner' && !formData.shopName) return;
    if (!formData.location) return;

    setIsSubmitting(true);

    // Resolve coordinates if missing
    let finalCoordinates = formData.coordinates;
    if (!finalCoordinates && formData.location) {
      finalCoordinates = await resolveCoordinates(formData.location);
      // Update state to reflect resolved coords
      setFormData(prev => ({ ...prev, coordinates: finalCoordinates }));
    }

    const profile: UserProfile = {
      name: formData.name,
      phone: formData.phone,
      role: role,
      location: formData.location,
      coordinates: finalCoordinates, // Use the resolved coordinates
      ...(role === 'owner' && {
        shopName: formData.shopName,
        shopType: formData.shopType || 'General Store',
      })
    };

    try {
      if (role === 'owner') {
        await registerShopInDatabase(profile);
      }
      onSubmit(profile);
    } catch (e) {
      alert("Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      setFormData({ ...formData, phone: numericValue });
    }
  };

  // 1. Get GPS -> Coords -> Reverse Geocode Name
  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
       alert("Geolocation is not supported by your browser");
       setIsLocating(false);
       return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
       async (position) => {
          const { latitude, longitude } = position.coords;
          // Use higher precision (6 decimal places)
          const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          try {
             // Switch to Photon (Komoot) for more reliable CORS support
             const response = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
             const data = await response.json();
             
             if (data.features && data.features.length > 0) {
               const props = data.features[0].properties;
               const parts = [];
               if (props.name) parts.push(props.name);
               if (props.street) parts.push(props.street);
               if (props.city) parts.push(props.city);
               else if (props.town) parts.push(props.town);
               else if (props.village) parts.push(props.village);
               if (props.state) parts.push(props.state);

               const locationString = parts.length > 0 ? parts.join(', ') : (props.name || coordsString);

               setFormData(prev => ({ 
                 ...prev, 
                 location: locationString,
                 coordinates: coordsString
               }));
             } else {
               // If reverse geo fails, still use coords
               setFormData(prev => ({ 
                 ...prev, 
                 location: coordsString, 
                 coordinates: coordsString 
               }));
             }
          } catch (error) {
             console.log("Reverse geocoding failed, using coordinates", error);
             setFormData(prev => ({ 
               ...prev, 
               location: coordsString, 
               coordinates: coordsString 
             }));
          } finally {
             setIsLocating(false);
          }
       },
       (error) => {
          console.error(error);
          setIsLocating(false);
          alert("Unable to retrieve location. Please check permissions or enter manually.");
       },
       options
    );
  };

  // 2. Manual Input -> Forward Geocode Name -> Coords
  const handleLocationBlur = async () => {
    // If user cleared the input, clear coords
    if (!formData.location.trim()) {
        setFormData(prev => ({ ...prev, coordinates: '' }));
        return;
    }

    // Don't re-fetch if we already have valid coords for this text (simple check)
    // Actually, safer to re-fetch if user changed text. 
    // We assume if coordinates are set, they might be stale if text changed, 
    // but detecting "change" inside onBlur is hard without prev state. 
    // So we just re-resolve.

    const coords = await resolveCoordinates(formData.location);
    if (coords) {
        setFormData(prev => ({ ...prev, coordinates: coords }));
    } else {
        // If lookup fails, clear old coords to avoid mismatch
        setFormData(prev => ({ ...prev, coordinates: '' }));
    }
  };

  const isFormValid = () => {
    const basicValid = formData.name.trim() !== '' && formData.phone.length === 10 && formData.location.trim() !== '';
    if (role === 'customer') return basicValid;
    return basicValid && formData.shopName.trim() !== '';
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom-4 duration-500 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        <div className={`p-8 text-center relative ${role === 'owner' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          <button 
            onClick={onBack}
            className="absolute left-4 top-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full text-white">
              {role === 'owner' ? <Store className="w-8 h-8" /> : <ChefHat className="w-8 h-8" />}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {role === 'owner' ? 'Shop Registration' : 'Customer Login'}
          </h2>
          <p className="text-white/80 text-sm">
            {role === 'owner' 
              ? 'Register your shop to manage inventory.' 
              : 'Enter your details to start cooking.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Common Fields */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Customer Location */}
          {role === 'customer' && (
             <LocationInputField 
                label="Your Location" 
                placeholder="Locality, City" 
                value={formData.location}
                onChange={(val) => setFormData(prev => ({ ...prev, location: val, coordinates: '' }))} 
                onBlur={handleLocationBlur}
                onGetLocation={handleGetLocation}
                isLocating={isLocating}
                hasCoordinates={!!formData.coordinates}
             />
          )}

          {/* Owner Specific Fields */}
          {role === 'owner' && (
            <>
              <div className="pt-2 border-t border-stone-100"></div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                  Shop Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    placeholder="My Grocery Store"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                  Shop Type
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <select
                    value={formData.shopType}
                    onChange={(e) => setFormData({ ...formData, shopType: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 bg-white text-stone-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Select Type...</option>
                    <option value="Grocery Store">Grocery Store</option>
                    <option value="Vegetable Shop">Vegetable Shop</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Bakery">Bakery</option>
                  </select>
                </div>
              </div>

              <LocationInputField 
                label="Shop Location" 
                placeholder="Locality, City" 
                value={formData.location}
                onChange={(val) => setFormData(prev => ({ ...prev, location: val, coordinates: '' }))}
                onBlur={handleLocationBlur}
                onGetLocation={handleGetLocation}
                isLocating={isLocating}
                hasCoordinates={!!formData.coordinates}
             />
            </>
          )}

          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`
              w-full py-3.5 px-6 rounded-xl text-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 mt-4
              ${!isFormValid() || isSubmitting
                ? 'bg-stone-300 cursor-not-allowed' 
                : role === 'owner' 
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
              }
            `}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {role === 'owner' ? 'Register Shop' : 'Start Cooking'} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;