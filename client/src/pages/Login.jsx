import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Google Signup State
    const [isGoogleSignup, setIsGoogleSignup] = useState(false);
    const [username, setUsername] = useState('');

    const { login, googleLogin, updateUsername, error, user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            console.log("Login Page Effect - User:", user);
            const incomplete = !user.isSetupComplete; // using robust check

            if (incomplete) {
                console.log("Setup Incomplete - Showing Form");
                setIsGoogleSignup(true);
            } else {
                console.log("Setup Complete - Redirecting");
                navigate('/');
            }
        }
    }, [user, navigate]);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const data = await googleLogin(credentialResponse.credential);
        console.log("Google Login Data:", data);
    };

    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await updateUsername(username);
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

                {/* DEBUG OVERLAY */}
                <div className="absolute top-0 left-0 bg-black/80 text-white p-2 text-xs font-mono z-50 pointer-events-none">
                    DEBUG: {JSON.stringify({ user, isGoogleSignup }, null, 2)}
                </div>

                {!isGoogleSignup ? (
                    <>
                        <div className="mb-6 flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                theme="filled_black"
                                shape="pill"
                                text="continue_with"
                                width="100%"
                            />
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white/80 px-2 text-slate-500 font-bold backdrop-blur-sm">Or continue with</span>
                            </div>
                        </div>

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
                    </>
                ) : (
                    <form onSubmit={handleUpdateUsername} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center mb-6">
                            <p className="text-sm font-bold text-emerald-600">Account Verified! ✅</p>
                            <p className="text-xs text-slate-500">One last thing, choose a username.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Choose Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all"
                                placeholder="cool_user_123"
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 mt-2 bg-black text-white rounded-xl font-bold shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Finalizing...' : 'Complete Setup'}
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
