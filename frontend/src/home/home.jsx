import React from 'react';
import { Info, Crown, ShieldCheck, Presentation, Users, GraduationCap, UserSquare2, ArrowRight, Building2, Users2, BookOpen, BarChart3, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './home.css';

const Home = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0 is Jan, 4 is May
    const currentYear = currentDate.getFullYear();
    const isAdmissionSeason = currentMonth >= 0 && currentMonth <= 4;
    const admissionYearText = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    return (
        <div className="home-container">
            {/* Background layer */}
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>

            {/* Top right About Us button */}
            <button className="about-us-btn">
                <Info size={16} /> About Us
            </button>

            {/* Main content */}
            <main className="main-content">
                {/* Header section */}
                <header className="header">
                    <div className="logo-container">
                        <img src="/src/assets/school-logo.png" alt="Logo" className="logo" />
                        <div className="logo-text">
                            <span className="logo-title">SCHOOL</span>
                            <span className="logo-subtitle">MANAGEMENT SYSTEM</span>
                        </div>
                    </div>
                    <h2 className="welcome-text">Welcome to Our</h2>
                    <h1 className="main-heading">School Management System</h1>
                    <p className="sub-heading">One Platform. Every Role. Infinite Possibilities.</p>
                    <div className="accent-line"></div>

                    {/* Admission Call to Action */}
                    <div className="admission-cta">
                        {isAdmissionSeason && (
                            <div className="admission-badge">
                                <span className="pulse-dot"></span>
                                Admissions Open {admissionYearText}
                            </div>
                        )}
                        <Link to="/admission" className="admission-btn">
                            Book Your Admission <ArrowRight size={20} />
                        </Link>
                    </div>
                </header>

                {/* Cards Section */}
                <section className="cards-section">
                    <Card
                        icon={<Crown size={32} strokeWidth={1.5} />}
                        colorClass="purple"
                        title="Management"
                        desc="Monitor overall operations and make strategic decisions."
                        path="/management/login"
                    />
                    <Card
                        icon={<ShieldCheck size={32} strokeWidth={1.5} />}
                        colorClass="blue"
                        title="Admin"
                        desc="Manage system settings, users, and school configuration."
                        path="/admin/login"
                    />
                    <Card
                        icon={<Presentation size={32} strokeWidth={1.5} />}
                        colorClass="green"
                        title="Teacher"
                        desc="Manage classes, students, attendance and assessments."
                        path="/teacher/login"
                    />
                    <Card
                        icon={<Users size={32} strokeWidth={1.5} />}
                        colorClass="orange"
                        title="Parent"
                        desc="Track your child's progress, attendance, fees and notifications."
                        path="/parent/login"
                    />
                    <Card
                        icon={<GraduationCap size={32} strokeWidth={1.5} />}
                        colorClass="pink"
                        title="Student"
                        desc="View your timetable, results, assignments and announcements."
                        path="/student/login"
                    />
                    <Card
                        icon={<UserSquare2 size={32} strokeWidth={1.5} />}
                        colorClass="teal"
                        title="External User"
                        desc="Access resources and services as an external user."
                        path="/external/login"
                    />
                </section>

                {/* Footer Banner */}
                <div className="stats-banner">
                    <Stat icon={<Building2 size={24} />} value="500+" label="Schools" />
                    <Stat icon={<Users2 size={24} />} value="20K+" label="Teachers" />
                    <Stat icon={<BookOpen size={24} />} value="100K+" label="Students" />
                    <Stat icon={<BarChart3 size={24} />} value="Smart" label="Analytics" />
                    <Stat icon={<Lock size={24} />} value="Secure" label="Platform" />
                </div>
            </main>

            <footer className="footer">
                © 2024 School Management System. All rights reserved.
            </footer>
        </div>
    );
};

const Card = ({ icon, colorClass, title, desc, path }) => (
    <div className={`role-card ${colorClass}`}>
        <div className="icon-wrapper">
            {icon}
        </div>
        <h3>{title}</h3>
        <p>{desc}</p>
        <Link to={path || '#'} className="access-btn" style={{ textDecoration: 'none' }}>
            Access Portal <ArrowRight size={16} />
        </Link>
    </div>
);

const Stat = ({ icon, value, label }) => (
    <div className="stat-item">
        <div className="stat-icon">{icon}</div>
        <div className="stat-text">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    </div>
);

export default Home;
