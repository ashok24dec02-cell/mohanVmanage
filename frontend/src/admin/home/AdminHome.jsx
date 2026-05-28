import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Bell, 
    ArrowRight,
    TrendingUp,
    CheckCircle2,
    Clock,
    FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './AdminHome.css';

const AdminHome = () => {
    const [adminName, setAdminName] = useState('Administrator');

    useEffect(() => {
        const name = localStorage.getItem('admin_name');
        if (name) setAdminName(name);
    }, []);

    return (
        <>
            {/* Modern Header */}
            <header className="admin-header">
                <div className="header-welcome">
                    <h1>Hello, {adminName}</h1>
                    <p>Welcome back to your administration command center.</p>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <Search size={20} color="#94a3b8" />
                        <input type="text" placeholder="Search records, students..." />
                    </div>
                    <div className="user-badge">
                        <div className="user-avatar">{adminName.charAt(0)}</div>
                        <span className="user-name">{adminName}</span>
                    </div>
                </div>
            </header>

            {/* Statistics Grid */}
            <div className="dashboard-grid">
                <StatCard 
                    icon={<FileText size={26} color="#6366f1" />}
                    label="New Applications"
                    value="1,284"
                    trend="+12% this month"
                    trendClass="trend-up"
                />
                <StatCard 
                    icon={<CheckCircle2 size={26} color="#22c55e" />}
                    label="Finalized Admissions"
                    value="942"
                    trend="+5% vs last year"
                    trendClass="trend-up"
                />
                <StatCard 
                    icon={<Clock size={26} color="#f59e0b" />}
                    label="Pending Review"
                    value="48"
                    trend="-2 from yesterday"
                    trendClass="trend-down"
                />
                <StatCard 
                    icon={<TrendingUp size={26} color="#06b6d4" />}
                    label="Revenue Growth"
                    value="18.4%"
                    trend="+2.1% spike"
                    trendClass="trend-up"
                />
            </div>

            {/* Hero Action Section */}
            <div className="action-section">
                <div className="hero-card">
                    <h2>Streamline Your<br />Admission Process</h2>
                    <p>Access our advanced admission tools to manage student applications, verify documents, and finalize enrollments efficiently.</p>
                    <Link to="/admin/new-admission" className="primary-action-btn">
                        Launch Admission Portal <ArrowRight size={20} />
                    </Link>
                </div>
                
                <div className="stat-glass-card">
                    <h3>Quick Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <NotificationItem 
                            icon={<Bell size={16} color="#6366f1" />} 
                            text="New application from Class 10" 
                            time="2 mins ago" 
                        />
                        <NotificationItem 
                            icon={<Bell size={16} color="#22c55e" />} 
                            text="Fee payment verified for ID: 402" 
                            time="1 hour ago" 
                        />
                        <NotificationItem 
                            icon={<Bell size={16} color="#f59e0b" />} 
                            text="Document missing for Sarah J." 
                            time="4 hours ago" 
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

const StatCard = ({ icon, label, value, trend, trendClass }) => (
    <div className="stat-glass-card">
        <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            {icon}
        </div>
        <div className="stat-info">
            <h3>{label}</h3>
            <div className="stat-number">{value}</div>
            <div className={`stat-trend ${trendClass}`}>{trend}</div>
        </div>
    </div>
);

const NotificationItem = ({ icon, text, time }) => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        padding: '1rem', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '1rem' 
    }}>
        {icon}
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{text}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{time}</div>
        </div>
    </div>
);

export default AdminHome;
