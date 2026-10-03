import React, { useState, useEffect, useRef } from 'react';
import { useAuth, getStoredAuthInfo } from '../../context/AuthContext';
import { useIncident } from '../../context/IncidentContext';
import { 
  ArrowRight, 
  Lock, 
  Mail,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const LoginSplitScreen: React.FC = () => {
  const { login, navigate, isAuthenticated } = useAuth();
  const { addToast } = useIncident();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isActuallyAuth = isAuthenticated || getStoredAuthInfo().isAuthenticated;

  // Reactive redirect guard if user is already authenticated
  useEffect(() => {
    if (isActuallyAuth) {
      navigate('/dashboard', { replace: true });
    }
  }, [isActuallyAuth, navigate]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setAuthError(null);
    const targetEmail = email.trim();
    if (!targetEmail) {
      setAuthError('Please enter a valid corporate email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(targetEmail, password);
      if (success) {
        // Navigation executes immediately after auth state & tokens are fully stored
        navigate('/dashboard', { replace: true });
        addToast(
          'Session Authenticated',
          'Logged into TRACE Command Center successfully.',
          'info'
        );
      } else {
        if (isMountedRef.current) {
          setAuthError('Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setAuthError(err?.message || 'Authentication service error. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0F1319] text-[#F8F7F8] overflow-hidden">
      
      {/* LEFT PANEL: Main Corporate Logo (Fixed in Top-Left) & Modern Enterprise Authentication Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-[#0F1319] border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-y-auto relative z-10">
        
        {/* Top Branding: Primary Corporate Logo fixed in Top-Left corner */}
        <div className="w-full flex items-center justify-start">
          <div className="inline-flex items-center rounded-2xl overflow-hidden">
            <img 
              src="/main-logo1.png" 
              alt="TRACE Main Corporate Logo" 
              className="h-12 sm:h-14 w-auto object-contain rounded-2xl filter drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/main-logo.png';
              }}
            />
          </div>
        </div>

        {/* Center: Sign In Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#101828] border border-slate-700/80 shadow-2xl space-y-6">
            
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8F7F8] tracking-tight">Sign In</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Enter your corporate credentials to access the TRACE Command Center.
              </p>
            </div>

            {/* Error Notification Alert */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/70 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Credentials form */}
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-[#F8F7F8] placeholder-slate-500 focus:outline-none focus:border-[#80A6D7] transition-colors disabled:opacity-60"
                    placeholder="name@enterprise.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-[#F8F7F8] placeholder-slate-500 focus:outline-none focus:border-[#80A6D7] transition-colors disabled:opacity-60"
                    placeholder="Enter corporate password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-3.5 h-3.5 rounded bg-[#0F1319] border border-slate-700 text-[#80A6D7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-300">Remember this workstation</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] disabled:opacity-60 disabled:cursor-not-allowed text-[#0F1319] font-bold text-xs transition-all shadow-lg shadow-[#80A6D7]/10 flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500 text-center">
              <span>Protected by Enterprise SSO & Zero-Trust MFA</span>
            </div>

          </div>
        </div>

        {/* Bottom vertical alignment balance */}
        <div className="hidden lg:block h-12 sm:h-14" />
      </div>

      {/* RIGHT PANEL: Hero Branding & Background Visualization */}
      <div className="relative flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-[#0F1319] bg-radial-gradient bg-noc-grid overflow-hidden">
        
        {/* Ambient glow nodes */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#80A6D7]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Tagline */}
        <div className="relative z-10 max-w-xl mx-auto my-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F8F7F8] leading-tight">
            Autonomous Operational Intelligence for Enterprise Resilience
          </h1>

          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Eliminate triage friction with real-time topology correlation, instant root-cause synthesis, 
            automated mitigation runbooks, and persistent institutional memory.
          </p>
        </div>
      </div>

    </div>
  );
};
