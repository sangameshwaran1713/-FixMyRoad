import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Cpu, 
  MapPin, 
  User, 
  Building2, 
  Check
} from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({ 
    email: 'citizen@fixmyroad.local', 
    password: 'Citizen@12345' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRole, setActiveRole] = useState('citizen');

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  // Redirect if user is already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'MUNICIPALITY_ADMIN' || user.role === 'MUNICIPALITY_OFFICER') {
        navigate('/municipality/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, from, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const setPresetCredentials = (role, email, password) => {
    setActiveRole(role);
    setFormData({ email, password });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(formData.email, formData.password);

      if (result.success) {
        const role = result.user.role;
        if (from) {
          navigate(from, { replace: true });
        } else if (role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'MUNICIPALITY_ADMIN' || role === 'MUNICIPALITY_OFFICER') {
          navigate('/municipality/dashboard', { replace: true });
        } else {
          navigate('/citizen/dashboard', { replace: true });
        }
      } else {
        setErrorMessage(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setErrorMessage('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f9f8f6]">
      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-[#e5e5e0] shadow-sm">
        
        {/* Left Side: Editorial Banner */}
        <div className="lg:col-span-5 bg-[#111111] p-10 flex flex-col justify-between text-white space-y-8">
          <div className="space-y-4">
            <div className="frame-box border-white text-white">F</div>
            <p className="font-script-accent text-3xl text-neutral-300">Secure Access</p>
            <h2 className="font-serif text-3xl font-bold tracking-[0.2em] uppercase text-white">
              CIVIC PORTAL
            </h2>
            <div className="line-divider border-white/20 my-4 text-neutral-400">❖</div>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Access AI damage inspection records, jurisdiction routing logs, and repair status monitoring.
            </p>
          </div>

          <div className="space-y-4 border-t border-neutral-800 pt-6">
            <div className="flex items-start space-x-3 text-xs text-neutral-300 font-light">
              <Cpu className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>YOLO AI Vision Automated Scoring</span>
            </div>
            <div className="flex items-start space-x-3 text-xs text-neutral-300 font-light">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>Geospatial Ward Boundary Dispatch</span>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
            FixMyRoad Engine v1.0
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            <div>
              <p className="font-script-accent text-2xl text-neutral-500">Welcome Back</p>
              <h2 className="font-serif text-3xl font-bold tracking-[0.2em] uppercase text-neutral-900">
                SIGN IN
              </h2>
            </div>

            {/* Test Credentials Switcher */}
            <div className="p-4 border border-[#e5e5e0] bg-[#f9f8f6] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 block">
                Quick Test Accounts
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPresetCredentials('citizen', 'citizen@fixmyroad.local', 'Citizen@12345')}
                  className={`p-2.5 text-left border transition-all cursor-pointer ${
                    activeRole === 'citizen'
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-[#e5e5e0] text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <User className="w-3.5 h-3.5" />
                    {activeRole === 'citizen' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-[11px] font-bold tracking-wider uppercase">Citizen</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPresetCredentials('municipality', 'municipality@fixmyroad.local', 'Municipality@12345')}
                  className={`p-2.5 text-left border transition-all cursor-pointer ${
                    activeRole === 'municipality'
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-[#e5e5e0] text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {activeRole === 'municipality' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-[11px] font-bold tracking-wider uppercase">Officer</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPresetCredentials('admin', 'admin@fixmyroad.local', 'Admin@12345')}
                  className={`p-2.5 text-left border transition-all cursor-pointer ${
                    activeRole === 'admin'
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-[#e5e5e0] text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {activeRole === 'admin' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-[11px] font-bold tracking-wider uppercase">Admin</p>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                    className="w-full bg-[#f9f8f6] border border-[#e5e5e0] focus:bg-white focus:border-neutral-900 py-2.5 pl-10 pr-4 text-neutral-900 placeholder-neutral-400 text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#f9f8f6] border border-[#e5e5e0] focus:bg-white focus:border-neutral-900 py-2.5 pl-10 pr-10 text-neutral-900 placeholder-neutral-400 text-xs outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full editorial-btn bg-neutral-900 text-white hover:bg-neutral-800 py-3.5 text-xs font-bold tracking-[0.2em] mt-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'SIGN IN TO DASHBOARD'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-[#e5e5e0]">
              <p className="text-xs text-neutral-500 font-light">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-neutral-900 hover:underline ml-1">
                  Create Account →
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
