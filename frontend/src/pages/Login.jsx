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
        <div className="flex items-center justify-center h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded shadow-lg w-96">
                <h2 className="text-2xl text-white mb-6 text-center">Login</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full mb-4 p-2 bg-gray-700 text-white rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full mb-6 p-2 bg-gray-700 text-white rounded"
                        required
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
