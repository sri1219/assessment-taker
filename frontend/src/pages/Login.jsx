import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, logout } = useContext(AuthContext); // Destructure logout
    const navigate = useNavigate();
    const [error, setError] = useState('');

    // Clear existing session on mount
    React.useEffect(() => {
        logout(); // Ensure we start fresh
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            if (user.role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            console.error(err);
            if (err.response) {
                setError(err.response.data.error || 'Login Failed');
            } else if (err.request) {
                setError('Cannot connect to server. Is Backend running?');
            } else {
                setError('Error: ' + err.message);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--bg))] relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full" />

            <div className="glass-card w-full max-w-md p-10 rounded-3xl shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-2xl bg-indigo-500/10 mb-4">
                        <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 mt-2">Sign in to your assessment portal</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <button type="submit" className="glass-button w-full py-4 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/25">
                        Sign In
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Powered by Planit
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
