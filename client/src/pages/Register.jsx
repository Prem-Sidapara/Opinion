import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { register, googleLogin, error } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await register(email, password, username);
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const success = await googleLogin(credentialResponse.credential);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass w-full max-w-md p-8 rounded-3xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white mb-4 shadow-lg">
                        <UserPlus size={20} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Create Account</h1>
                    <p className="text-slate-500 font-medium">Join us and start sharing.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold text-center">
                        {error}
                    </div>
                )}

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
                        <span className="bg-white/80 px-2 text-slate-500 font-bold backdrop-blur-sm">Or register with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all"
                            placeholder="opinionated_one"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Email (@gmail.com)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all"
                            placeholder="you@gmail.com"
                            required
                            pattern=".+@gmail\.com"
                            title="Only @gmail.com addresses are allowed"
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium transition-all pr-12"
                            placeholder="At least 6 chars"
                            minLength={6}
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
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-500 font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-black font-bold hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
