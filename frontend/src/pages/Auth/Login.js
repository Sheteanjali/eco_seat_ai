import React, { useState, useRef } from 'react';
import {
  ShieldCheck, User, Key, ArrowRight, Sparkles, Loader2, 
  AlertCircle, Fingerprint, MailCheck, Cpu, Database, 
  BarChart3, CheckCircle, Smartphone, Eye, ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);

  const [formData, setFormData] = useState({
    rollNo: '',
    secretKey: '',
    email: '',
    role: 'student',
    otp: ''
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollToSection = (elementRef) => {
    window.scrollTo({
      top: elementRef.current.offsetTop - 80,
      behavior: 'smooth'
    });
  };

  // 📡 REQUEST OTP NODE CONNECTOR
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/auth/request-otp',
        {
          username: formData.rollNo,
          password: formData.secretKey,
          role: formData.role,
          email: formData.email
        }
      );

      if (response.data.status === 'otp_sent') {
        setStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Authentication Failed. Please verify identity credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 🔓 VERIFY OTP NODE CONNECTOR (State Sync Latency Bypass Patch Applied)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/auth/verify-otp',
        {
          email: formData.email,
          otp: formData.otp
        }
      );

      if (response.data.status === 'success') {
        // Mount authentication tokens directly into client storage cache
        localStorage.setItem('userRole', formData.role);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userRollNo', formData.rollNo);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('sessionToken', response.data.token);

        // Explicit fallback context for demo room assignment matrix
        if (formData.role === 'invigilator') {
          localStorage.setItem('assignedRoomNo', "Ex-101");
        }

        // 🛡️ CYBER GATEWAY PATCH: 
        // Bypasses React memory lag loops by issuing a full hardware relocation frame.
        // This forces App.js to instantly bootstrap with the updated userRole parameters.
        if (formData.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (formData.role === 'invigilator') {
          window.location.href = '/invigilator/dashboard';
        } else {
          window.location.href = '/student/dashboard';
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP Verification Failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={homeRef}
      className="w-full min-h-screen bg-[#050816] text-white overflow-x-hidden font-sans selection:bg-cyan-400 selection:text-black antialiased"
    >
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 left-0 z-50 w-full h-20 bg-black/40 backdrop-blur-xl border-b border-white/10 px-8 md:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection(homeRef)}>
          <div className="p-2 rounded-xl bg-cyan-400 text-black shadow-lg shadow-cyan-500/30">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">
            EcoSeat <span className="text-cyan-400">AI</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button type="button" onClick={() => scrollToSection(homeRef)} className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Home</button>
          <button type="button" onClick={() => scrollToSection(aboutRef)} className="text-sm font-bold text-slate-300 hover:text-cyan-400 transition uppercase tracking-widest">Workspace</button>
          <button type="button" onClick={() => scrollToSection(featuresRef)} className="text-sm font-bold text-slate-300 hover:text-cyan-400 transition uppercase tracking-widest">Pipelines</button>
        </div>

        <div className="px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 text-[10px] font-bold uppercase tracking-[0.2em]">
          Secure AI Node
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative w-full min-h-screen flex items-center justify-center px-6 md:px-16 pt-20 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10 py-12">
          
          {/* LEFT CONTENT CONTAINER */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">
              <Sparkles size={15} />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Next Generation Exam Security</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight unique-title">
              Smart Exam <br />
              Seating & <span className="text-cyan-400">Attendance</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              AI powered examination management platform with smart seating
              allocation, cryptographic attendance verification, anti-cheating constraints,
              and real-time tracking dashboards.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
              <div className="w-64 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0"><Cpu size={24} /></div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Solver</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Constraint Matrix</p>
                </div>
              </div>
              <div className="w-64 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400 shrink-0"><Database size={24} /></div>
                <div>
                  <h4 className="text-sm font-bold text-white">Live Engine</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Real-Time Sync</p>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC SECURE LOGIN SYSTEM CARD */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[460px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-cyan-500/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
                  <Fingerprint size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight uppercase italic">
                  {step === 1 ? 'Secure Login' : 'OTP Node'}
                </h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-1">Multi-Role Access Control</p>
              </div>

              <form className="space-y-4" onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP}>
                {step === 1 ? (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-cyan-400 transition font-bold uppercase text-xs tracking-wider"
                      >
                        <option value="student">Student Portal</option>
                        <option value="invigilator">Invigilator Desk</option>
                        <option value="admin">System Admin Terminal</option>
                      </select>
                    </div>

                    <div className="relative">
                      <MailCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="email"
                        placeholder="University Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 text-xs font-bold outline-none focus:border-cyan-400 transition"
                      />
                    </div>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder={formData.role === 'admin' ? 'Admin Username' : 'Identity Roll Number'}
                        value={formData.rollNo}
                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 text-xs font-bold outline-none focus:border-cyan-400 transition"
                      />
                    </div>

                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="password"
                        placeholder={formData.role === 'student' ? 'Access Key (Branch)' : 'Security Password'}
                        value={formData.secretKey}
                        onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 text-xs font-bold outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-xl p-4 text-center">
                      <p className="text-cyan-300 text-[10px] uppercase tracking-widest font-black">2FA Dispatched to:</p>
                      <p className="text-white mt-1 font-bold text-xs">{formData.email}</p>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                      required
                      className="w-full bg-white/5 border-2 border-cyan-400/20 rounded-xl py-4 text-center text-3xl tracking-[0.5em] font-black text-white outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-300">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-xs uppercase font-bold tracking-tight">{error}</p>
                  </div>
                )}

                <button
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-cyan-500/10"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : step === 1 ? 'Continue Registration' : 'Verify Security Code'}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* ================= WORKSPACE SEGMENTS ================= */}
      <section ref={aboutRef} className="w-full py-28 px-8 md:px-16 border-t border-white/5 bg-[#080c21]">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-bold">Role Workspaces</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">Functional Target Segments</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between hover:border-cyan-400/30 transition-all group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400"><Cpu size={26} /></div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">System Admin</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">Processes constraint satisfaction configurations, resolves adjacent structural blocks, overrides layout maps for damaged seats, and monitors total attendance registries.</p>
              </div>
              <span className="text-[10px] font-black text-indigo-400 mt-6 uppercase tracking-wider">Operational Control Panel</span>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between hover:border-purple-400/30 transition-all group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-400/10 flex items-center justify-center text-purple-400"><Smartphone size={26} /></div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">Invigilator Desk</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">Deploys checkpoints at exam hall entry gates. Runs real-time attendance verify-scans, validates structural layouts, and concurrent streaming update to dashboard blocks.</p>
              </div>
              <span className="text-[10px] font-black text-purple-400 mt-6 uppercase tracking-wider">Gate Checkpoint Controller</span>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between hover:border-emerald-400/30 transition-all group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400"><Eye size={26} /></div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">Student Module</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">Isolated exploratory candidate terminal. Authenticated profiles fetch layout parameters securely—checking unique row listings, allocated room blocks, and specific seat targets.</p>
              </div>
              <span className="text-[10px] font-black text-emerald-400 mt-6 uppercase tracking-wider">Candidate Inquiry Portal</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRANSACTION PIPELINE ================= */}
      <section ref={featuresRef} className="w-full py-28 px-8 md:px-16 border-t border-white/5 bg-[#050816]">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-bold">Process Automation</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">System Flow Pipeline</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 bg-cyan-400 text-black rounded-full flex items-center justify-center font-black mx-auto text-sm shadow-md">1</div>
              <h4 className="text-sm font-black uppercase italic">CSV Upload</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Admin ingests basic candidate parameters and structural maps into the secure database node.</p>
            </div>
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 bg-cyan-400 text-black rounded-full flex items-center justify-center font-black mx-auto text-sm shadow-md">2</div>
              <h4 className="text-sm font-black uppercase italic">AI Processing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Constraint Satisfactions process spatial arrays, verifying zero branch overlapping configurations.</p>
            </div>
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 bg-cyan-400 text-black rounded-full flex items-center justify-center font-black mx-auto text-sm shadow-md">3</div>
              <h4 className="text-sm font-black uppercase italic">Verify Scan</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Invigilators track entry gates, updating real-time attendance tokens concurrently to the pipeline.</p>
            </div>
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 bg-purple-500 text-black rounded-full flex items-center justify-center font-black mx-auto text-sm shadow-md">4</div>
              <h4 className="text-sm font-black uppercase italic">Central Audit</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Централизованный analytics updates, populating dynamic circular layouts and side-by-side metrics grids.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EXTRA CAPABILITIES ================= */}
      <section className="w-full py-28 px-8 md:px-16 border-t border-white/5 bg-[#080c21]">
        <div className="max-w-[1400px] mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex gap-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0"><BarChart3 size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Live Circular Distributions</h3>
                <p className="text-slate-400 text-sm">Interactive analytics monitoring panels showcasing accurate branch-wise metrics graphs simultaneously.</p>
              </div>
            </div>
            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 shrink-0"><CheckCircle size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Segmented Audit Metrics</h3>
                <p className="text-slate-400 text-sm">Isolates current present blocks from remaining waiting rooms list under a streamlined, exportable layout structure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-slate-500 text-xs uppercase tracking-[0.3em] bg-[#03050d]">
        EcoSeat AI Core Engine • Ramdeobaba University Production Environment
      </footer>
    </div>
  );
};

export default Login;