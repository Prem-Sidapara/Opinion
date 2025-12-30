import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP State
    const [showOtpLogin, setShowOtpLogin] = useState(false);
    const [otpStep, setOtpStep] = useState('email'); // 'email' or 'otp'
    const [otp, setOtp] = useState('');

    const { login, sendOtp, verifyOtp, error } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await sendOtp(email);
        if (success) {
            setOtpStep('otp');
        }
        setIsSubmitting(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await verifyOtp(email, otp);
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass w-full max-w-md p-8 rounded-3xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white mb-4 shadow-lg">
                        <Lock size={20} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Welcome Back</h1>
                    <p className="text-slate-500 font-medium">Log in to share your thoughts.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                        className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${!showOtpLogin ? 'border-b-2 border-black text-black' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setShowOtpLogin(false)}
                    >
                        Password
                    </button>
                    <button
                        className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${showOtpLogin ? 'border-b-2 border-black text-black' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setShowOtpLogin(true)}
                    >
                        One-Time Code
                    </button>
                </div>

                {!showOtpLogin ? (
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all"
                                placeholder="you@gmail.com"
                                required
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 mt-2 bg-black text-white rounded-xl font-bold shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={otpStep === 'email' ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={otpStep === 'otp'}
                                className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all disabled:opacity-50"
                                placeholder="you@gmail.com"
                                required
                            />
                        </div>

                        {otpStep === 'otp' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Enter Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all text-center tracking-[0.5em] text-xl"
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setOtpStep('email')}
                                    className="text-xs text-slate-400 font-bold hover:text-black mt-2 ml-2"
                                >
                                    CHANGE EMAIL
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 mt-2 bg-black text-white rounded-xl font-bold shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting
                                ? 'Processing...'
                                : otpStep === 'email' ? 'Send Login Code' : 'Verify & Login'
                            }
                        </button>
                    </form>
                )}

                <p className="text-center mt-8 text-slate-500 font-medium">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-black font-bold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
