import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import axios from 'axios';
import config from '../../config';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/student/dashboard');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Frontend passes username, backend handles check
            const payload = {
                username: formData.username,
                password: formData.password
            };
            const response = await axios.post(`${config.BASE_URL}/authendication/studentlogin/`, payload);
            const { tokens, student } = response.data;
            login(student, tokens.access);
            toast.success('Login successful! Welcome back.');
            navigate('/student/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-login-container">
            {/* Background layer */}
            <div className="student-bg-image"></div>
            <div className="student-bg-overlay"></div>

            <div className="student-login-card">
                <header className="student-login-header">
                    <div className="student-logo-container">
                        <img src="/src/assets/school-logo.png" alt="Logo" className="student-logo" />
                        <div className="student-logo-text">
                            <span className="student-logo-title">SCHOOL</span>
                            <span className="student-logo-subtitle">MANAGEMENT SYSTEM</span>
                        </div>
                    </div>
                    <h1 className="student-login-title">Student Portal</h1>
                    <p className="student-login-subtitle">Secure access for students</p>
                </header>

                <form className="student-login-form" onSubmit={handleSubmit}>
                    <div className="student-form-group">
                        <div className="student-input-wrapper">
                            <User className="student-input-icon" size={20} />
                            <input
                                type="text"
                                name="username"
                                className="student-login-input"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="student-form-group">
                        <div className="student-input-wrapper">
                            <Lock className="student-input-icon" size={20} />
                            <input
                                type="password"
                                name="password"
                                className="student-login-input"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="student-login-btn"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />} 
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <Link to="/" className="student-back-home">
                    <ArrowLeft size={16} /> Back to Home Page
                </Link>
            </div>
        </div>
    );
};

export default Login; 
