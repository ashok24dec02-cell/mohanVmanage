import React from 'react';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    Settings,
    LogOut,
    ShieldCheck,
    Briefcase,
    Calendar
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/admin/login');
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-logo-section">
                <img src="/src/assets/school-logo.png" alt="School Logo" className="logo-img" />
                <div className="logo-text-group">
                    <h2>V-MANAGE</h2>
                </div>
            </div>

            <nav className="nav-menu">
                <div className="nav-label">Core Modules</div>
                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={22} />
                    <span>Analytics Overview</span>
                </NavLink>

                <NavLink
                    to="/admin/new-admission"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <UserPlus size={22} />
                    <span>Admission Management</span>
                </NavLink>

                <NavLink
                    to="/admin/staff"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Briefcase size={22} />
                    <span>Staff Management</span>
                </NavLink>

                <NavLink
                    to="/admin/timetable"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Calendar size={22} />
                    <span>Timetable Management</span>
                </NavLink>

                <NavLink
                    to="/student-records"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Users size={22} />
                    <span>Student Records</span>
                </NavLink>

                <div className="nav-label">Administration</div>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Settings size={22} />
                    <span>System Settings</span>
                </NavLink>

                <NavLink
                    to="/security"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <ShieldCheck size={22} />
                    <span>Security & Access</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
