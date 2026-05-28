import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { 
    User as UserIcon,
    Bell,
    Menu as MenuIcon,
    LogOut,
    Calendar,
    BookOpen,
    Wallet
} from 'lucide-react';

const getNotificationIcon = (title) => {
    if (title.includes('Exam')) return <Calendar size={20} className="text-purple-600 dark:text-purple-400" />;
    if (title.includes('Homework')) return <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />;
    if (title.includes('Fee')) return <Wallet size={20} className="text-amber-600 dark:text-amber-400" />;
    return <Bell size={20} className="text-slate-600 dark:text-slate-400" />;
};

const getNotificationIconBg = (title) => {
    if (title.includes('Exam')) return 'bg-purple-100 dark:bg-purple-900/30';
    if (title.includes('Homework')) return 'bg-blue-100 dark:bg-blue-900/30';
    if (title.includes('Fee')) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-slate-100 dark:bg-slate-800';
};

const StudentLayout = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ── Two independent sidebar states ───────────────────────────────
    const [isCollapsed,  setIsCollapsed]  = useState(false);
    const [isMobileOpen, setIsMobileOpen]  = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ── Dashboard state ─────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('Overview');
    const [subData, setSubData] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Exam Schedule Out', time: '2 hours ago',  type: 'info',    target: 'Time Table' },
        { id: 2, title: 'Homework Submitted', time: '5 hours ago',  type: 'success', target: 'Homework' },
        { id: 3, title: 'Fee Reminder',       time: '1 day ago',    type: 'warning', target: 'Overview'  },
    ]);

    // ── Auth guard ──────────────────────────────────────────────────
    useEffect(() => {
        if (!loading && !user) {
            navigate('/student/login');
        }
    }, [user, loading, navigate]);

    // ── Sync activeTab with URL ─────────────────────────────────────
    useEffect(() => {
        const path = location.pathname.split('/').filter(Boolean).pop();
        const tabMap = {
            'dashboard':        'Overview',
            'timetable':        'Time Table',
            'homework':         'Homework',
            'exam-marks':       'Exam Marks',
            'drug-detection':   'Drug Detection',
            'performance':      'performance',
            'homework-details': 'homework_details',
        };
        if (tabMap[path]) {
            setActiveTab(tabMap[path]);
        } else if (location.pathname.includes('/student/dashboard')) {
            setActiveTab('Overview');
        }
    }, [location]);

    // ── Navigation handler ──────────────────────────────────────────
    const handleNavigate = (tab, data = null) => {
        const pathMap = {
            'Overview':        '',
            'Time Table':      'timetable',
            'Homework':        'homework',
            'Exam Marks':      'exam-marks',
            'Drug Detection':  'drug-detection',
            'homework_details':'homework-details',
            'performance':     'performance',
        };
        setSubData(data);
        const path = pathMap[tab];
        if (path !== undefined) {
            if (tab === 'Overview') {
                navigate('/student/dashboard');
            } else {
                navigate(`/student/dashboard/${path}`);
            }
        }
        // Close the mobile drawer after any navigation
        setIsMobileOpen(false);
        // Don't collapse the desktop sidebar on navigation
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/student/login');
    };

    const handleNotificationClick = (target) => {
        handleNavigate(target);
        setIsMobileOpen(false);
        setShowNotifications(false);
    };

    const markAllRead = () => {
        setNotifications([]);
        setIsMobileOpen(false);
        setShowNotifications(false);
    };

    if (loading) return null;
    if (!user) return <Navigate to="/student/login" replace />;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex font-['Outfit',sans-serif] transition-colors duration-300">

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            {/* 
              isCollapsed  → desktop collapse  (true = w-20)
              isMobileOpen → mobile overlay visibility (true = drawer open)
            */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                activeTab={activeTab}
                handleNavigate={handleNavigate}
                handleLogout={handleLogout}
            />

            {/* ── Main content wrapper ─────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-4 z-30 transition-all shadow-sm">
                    <div className="flex justify-between items-center">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="lg:hidden p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
                            aria-label="Open menu"
                        >
                            <MenuIcon size={20} />
                        </button>

                        <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-800 dark:text-white tracking-tight"
                            style={{
                                paddingLeft: isCollapsed ? '0' : undefined,
                            }}>
                            Student Dashboard
                        </h2>

                        <div className="flex items-center gap-2 sm:gap-4">

                            {/* ── Notifications ─────────────────────────────────── */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors relative active:scale-95"
                                >
                                    <Bell size={20} />
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-4 w-[380px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/40 dark:border-slate-700/50 p-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300 overflow-hidden">
                                        {/* Blur decorative circles */}
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

                                        <div className="relative z-10 px-3 py-2 flex justify-between items-center mb-2">
                                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notifications</p>
                                            <button
                                                onClick={markAllRead}
                                                className="text-[13px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>
                                        <div className="relative z-10 max-h-[380px] overflow-y-auto pr-1 space-y-1">
                                            {notifications.length > 0 ? (
                                                notifications.map((n, idx) => (
                                                    <React.Fragment key={n.id}>
                                                        <div
                                                            onClick={() => handleNotificationClick(n.target)}
                                                            className="flex items-start gap-4 p-3 hover:bg-white dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-200 cursor-pointer group active:scale-[0.98] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                                        >
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300 ${getNotificationIconBg(n.title)}`}>
                                                                {getNotificationIcon(n.title)}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pt-0.5">
                                                                <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                                    {n.title}
                                                                </p>
                                                                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                                                                    {n.time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {idx !== notifications.length - 1 && (
                                                            <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 mx-4 my-1" />
                                                        )}
                                                    </React.Fragment>
                                                ))
                                            ) : (
                                                <div className="px-6 py-12 text-center flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                        <Bell size={28} className="text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                                                    <p className="text-xs text-slate-500 mt-1">No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── User pill ──────────────────────────────────────── */}
                            <div className="hidden sm:flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{user?.name || 'Student'}</p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user?.username}</p>
                                </div>
                                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200/50 flex-shrink-0">
                                    <UserIcon size={18} className="lg:hidden" />
                                    <UserIcon size={20} className="hidden lg:block" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Main content area ───────────────────────────────────── */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10 relative">
                    <Outlet context={{ handleNavigate, subData }} />
                </div>
            </main>

            {/* ── Mobile backdrop (behind sliding drawer) ──────────────── */}
            {isMobileOpen && (
                <button
                    aria-label="Close navigation"
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-200 animate-in fade-in duration-150"
                />
            )}

            {/* ── Logout Confirmation Modal ──────────────── */}
            {showLogoutModal && (
                <div className="logout-modal-backdrop">
                    <div className="logout-modal-content">
                        <div className="logout-modal-icon-wrap">
                            <LogOut size={24} />
                        </div>
                        <h3 className="logout-modal-title">
                            Sign Out
                        </h3>
                        <p className="logout-modal-desc">
                            Are you sure you want to log out of your VManage student session?
                        </p>
                        <div className="logout-modal-actions">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="logout-modal-btn logout-modal-btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="logout-modal-btn logout-modal-btn-confirm"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLayout;
