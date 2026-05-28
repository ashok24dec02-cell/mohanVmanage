import React from 'react';
import {
    Calendar as CalendarIcon,
    BookOpen,
    FileText,
    ShieldAlert,
    User as UserIcon,
    Award,
    Clock,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import './StudentHome.css';

const StudentHome = () => {
    const { user } = useAuth();
    const { handleNavigate } = useOutletContext();
    const [summaryData, setSummaryData] = React.useState(null);
    const [loadingSummary, setLoadingSummary] = React.useState(true);

    React.useEffect(() => {
        const fetchSummary = async () => {
            try {
                const token = sessionStorage.getItem('studentToken');
                const response = await axios.get(`${config.BASE_URL}/student/dashboard-summary/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSummaryData(response.data);
            } catch (err) {
                console.error("Failed to load dashboard summary");
            } finally {
                setLoadingSummary(false);
            }
        };
        fetchSummary();
    }, []);
    const getWelcomeDescription = () => {
        if (loadingSummary || !summaryData?.stats) {
            return "You're doing great! Loading your latest dashboard updates...";
        }
        const hwStat = summaryData.stats.find(s => s.label === 'Homeworks')?.value || '0 Pending';
        const examStat = summaryData.stats.find(s => s.label === 'Exams')?.value || 'None';
        
        const hwCount = hwStat.split(' ')[0] || '0';
        const examText = examStat.toLowerCase().includes('next week')
            ? 'an exam scheduled for next week.'
            : 'no exams scheduled for this week.';
            
        return `You're doing great! You have ${hwCount} pending ${parseInt(hwCount) === 1 ? 'assignment' : 'assignments'} and ${examText}`;
    };

    return (
        <div className="dashboard-container">
            {/* Welcome Card */}
            <div className="welcome-banner group">
                <div className="welcome-banner-circle-1"></div>
                <div className="welcome-banner-circle-2"></div>

                <div className="welcome-content">
                    <span className="welcome-badge">
                        Student Portal
                    </span>
                    <h1 className="welcome-title">
                        Welcome back, <br />
                        <span className="welcome-name">
                            {user?.name ? user.name.split(' ')[0] : ''}!
                        </span>
                    </h1>
                    <p className="welcome-desc">
                        {getWelcomeDescription()}
                    </p>
                </div>
                <div className="welcome-icon-decor">
                    <UserIcon size={320} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {loadingSummary ? (
                    <div className="col-span-4 text-center py-4 text-slate-500 font-bold">Loading Stats...</div>
                ) : (
                    summaryData?.stats?.map((stat, i) => {
                        const icons = { Attendance: CalendarIcon, 'Avg Grade': FileText, Homeworks: BookOpen, Exams: ShieldAlert };
                        const Icon = icons[stat.label] || Award;
                        const colorClass = stat.color || 'slate';

                        return (
                            <div key={i} className="stat-card-custom group">
                                <div className={`stat-icon-wrap ${colorClass}`}>
                                    <Icon size={24} />
                                </div>
                                <p className="stat-label">{stat.label}</p>
                                <p className="stat-value">{stat.value}</p>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sections Grid */}
            <div className="sections-grid">
                {/* Time Table Section */}
                <div className="panel-card-custom">
                    <div className="panel-header">
                        <h3 className="panel-title">
                            <div className="panel-title-accent blue"></div>
                            Schedule
                        </h3>
                        <button onClick={() => handleNavigate('Time Table')} className="panel-action-btn blue">View All</button>
                    </div>
                    <div className="panel-body">
                        {loadingSummary ? (
                            <div className="text-center py-4 text-slate-500">Loading Schedule...</div>
                        ) : (
                            summaryData?.recent_schedule?.map((item, i) => (
                                <div key={i} className="schedule-item group">
                                    <div className="schedule-time-block">
                                        <p className="schedule-time">{item.time.split(' ')[0]}</p>
                                        <p className="schedule-ampm">{item.time.split(' ')[1]}</p>
                                    </div>
                                    <div className="schedule-details">
                                        <p className="schedule-subject line-clamp-1">{item.subject}</p>
                                        <p className="schedule-teacher line-clamp-1">{item.teacher}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Homework Section */}
                <div className="panel-card-custom">
                    <div className="panel-header">
                        <h3 className="panel-title">
                            <div className="panel-title-accent emerald"></div>
                            Homework
                        </h3>
                        <button onClick={() => handleNavigate('Homework')} className="panel-action-btn emerald">Submit</button>
                    </div>
                    <div className="panel-body">
                        {loadingSummary ? (
                            <div className="text-center py-4 text-slate-500">Loading Homework...</div>
                        ) : (
                            summaryData?.recent_homework?.map((item, i) => (
                                <div key={i} className="homework-item group">
                                    <div className="homework-info">
                                        <p className="homework-task line-clamp-1">{item.task}</p>
                                        <p className="homework-subject">{item.subject}</p>
                                    </div>
                                    <div className="homework-status">
                                        <p className={`homework-deadline-badge ${item.deadline === 'Submitted' ? 'submitted' : 'pending'}`}>
                                            {item.deadline}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Exam Marks Section */}
                <div className="panel-card-custom">
                    <div className="panel-header">
                        <h3 className="panel-title">
                            <div className="panel-title-accent violet"></div>
                            Recent Marks
                        </h3>
                        <button onClick={() => handleNavigate('Exam Marks')} className="panel-action-btn violet">Performance</button>
                    </div>
                    <div className="panel-body">
                        {loadingSummary ? (
                            <div className="text-center py-4 text-slate-500">Loading Marks...</div>
                        ) : (
                            summaryData?.recent_marks?.map((item, i) => (
                                <div key={i} className="recent-marks-item group animate-scale-in">
                                    <div className="recent-marks-info">
                                        <p className="recent-marks-subject">{item.subject}</p>
                                        <p className="recent-marks-score">{item.score}%</p>
                                    </div>
                                    <div className="progress-bar-track">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ '--progress-width': `${item.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                        <button
                            onClick={() => handleNavigate('Exam Marks')}
                            className="report-card-btn group"
                        >
                            View Full Report Card
                            <ArrowRight size={16} className="report-card-btn-icon" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentHome;
