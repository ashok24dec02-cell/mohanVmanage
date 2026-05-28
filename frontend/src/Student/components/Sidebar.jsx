import React from 'react';
import './Sidebar.css';
import {
    LayoutDashboard,
    Calendar as CalendarIcon,
    BookOpen,
    ShieldAlert,
    LogOut,
    Menu,
    X,
} from 'lucide-react';

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Overview' },
    { icon: CalendarIcon, label: 'Time Table' },
    { icon: BookOpen, label: 'Homework' },
    { icon: ShieldAlert, label: 'Exam Marks' },
    { icon: ShieldAlert, label: 'Drug Detection' },
];

const Sidebar = ({
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    activeTab,
    handleNavigate,
    handleLogout,
}) => {
    return (
        <aside
            className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileOpen ? 'mobile-open' : 'mobile-close'}`}
        >
            {/* Header / Logo Section */}
            <div className="sidebar-header">
                <div className="sidebar-logo-wrap">
                    <div className="sidebar-logo" title="VManage">
                        <BookOpen size={20} />
                    </div>
                    {!isCollapsed && (
                        <span className="sidebar-title">
                            VManage
                        </span>
                    )}
                </div>
                
                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-toggle"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <Menu size={20} /> : <X size={20} />}
                </button>
            </div>

            {/* Main Menu Section Label */}
            {!isCollapsed && (
                <div className="sidebar-label">
                    Main Menu
                </div>
            )}

            {/* Navigation Menu Links */}
            <nav className="sidebar-nav">
                {MENU_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.label;
                    return (
                        <button
                            key={`${item.label}-${index}`}
                            onClick={() => handleNavigate(item.label)}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                            data-tooltip={item.label}
                        >
                            <Icon 
                                size={20} 
                                className="sidebar-icon"
                            />
                            {!isCollapsed && (
                                <span className="sidebar-text">{item.label}</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / Sign Out Section */}
            <div className="sidebar-footer">
                <button
                    onClick={handleLogout}
                    className="sidebar-logout"
                    data-tooltip="Sign Out"
                >
                    <LogOut size={20} className="sidebar-icon" />
                    {!isCollapsed && <span className="sidebar-text">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
