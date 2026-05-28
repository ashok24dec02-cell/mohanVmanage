import React, { useState } from 'react';
import { User, Lock, ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            console.log('Login attempt:', { username, password });

            const response = await axios.post(`${config.BASE_URL}/authendication/vadminlogin/`, {
                username,
                password
            });

            const data = response.data;

            if (data.success) {
                // Save admin info for the dashboard
                sessionStorage.setItem('admin_id', data.admin_id);
                sessionStorage.setItem('admin_name', data.name);
                localStorage.setItem('username', data.username);
                
                // Redirect to the correct admin dashboard path
                navigate('/admin/dashboard');
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="login-container">
            {/* Background layer */}
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>

            <div className="login-card">
                <header className="login-header">
                    <div className="logo-container">
                        <img src="/src/assets/school-logo.png" alt="Logo" className="logo" />
                        <div className="logo-text">
                            <span className="logo-title">SCHOOL</span>
                            <span className="logo-subtitle">MANAGEMENT SYSTEM</span>
                        </div>
                    </div>
                    <h1 className="login-title">Admin Portal</h1>
                    <p className="login-subtitle">Secure access for authorized administrators</p>
                </header>

                {error && <div className="error-message" style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    border: '1px solid rgba(239, 68, 68, 0.4)'
                }}>{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                className="login-input"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn">
                        <ShieldCheck size={20} /> Sign In
                    </button>
                </form>

                <Link to="/" className="back-home">
                    <ArrowLeft size={16} /> Back to Home Page
                </Link>
            </div>
        </div>
    );
};

export default Login;
