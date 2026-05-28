import './ExamMarks.css';
import React, { useState, useEffect } from 'react';
import { Award, Target, TrendingUp, BarChart2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

const ExamMarks = () => {
    const { handleNavigate } = useOutletContext();
    const [marksData, setMarksData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedSubType, setSelectedSubType] = useState(null);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const token = sessionStorage.getItem('studentToken');
                const response = await axios.get(`${config.BASE_URL}/student/exam-marks/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMarksData(response.data);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
                toast.error("Failed to load exam marks");
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    if (loading) return <div className="text-center p-10 font-bold text-slate-500">Loading Exam Marks...</div>;
    if (error) return <div className="text-center p-10 font-bold text-red-500">Error: {error}</div>;

    const getGradeColor = (grade) => {
        if (grade.includes('A')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30';
        if (grade.includes('B')) return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30';
        if (grade.includes('C')) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30';
        return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30';
    };

    const examTypes = [
        { id: 'Monthly Test', label: 'Monthly Test', icon: Target, color: 'from-blue-500 to-indigo-600', description: 'Monthly performance tracking for regular assessments.' },
        { id: 'Mid-Term Test', label: 'Mid-Term Test', icon: Award, color: 'from-purple-500 to-pink-600', description: 'Results for 1st, 2nd, and 3rd mid-term examinations.' },
        { id: 'Term Test', label: 'Term Test', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', description: 'Quarterly, Half-yearly, and Annual academic reports.' }
    ];

    if (!selectedType) {
        return (
            <div className="exam-container w-full animate-fade-in">
                <div className="dashboard-wrapper">
                    <div className="exam-header flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h2 className="exam-title text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Academic Results</h2>
                            <p className="exam-subtitle text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Track your academic journey. Select a category below to explore specific monthly, termly, or mid-term performance reports.
                            </p>
                        </div>
                        <button 
                            onClick={() => handleNavigate('performance')}
                            className="exam-analytics-btn"
                        >
                            <BarChart2 size={16} />
                            Performance Analytics
                        </button>
                    </div>
 
                    <div className="exam-grid">
                        {examTypes.map((type) => (
                            <div 
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className="exam-category-card group"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-[0.04] rounded-bl-full transition-opacity duration-300`}></div>
                                
                                <div className={`exam-icon-circle w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} p-3 text-white mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                    <type.icon size={24} strokeWidth={2.5} />
                                </div>
 
                                <h3 className="exam-card-title mb-2">{type.label}</h3>
                                <p className="exam-card-desc mb-6">
                                    {type.description}
                                </p>
 
                                <div className="exam-card-link flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                    View Categories <ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedSubType) {
        const subTypes = Object.keys(marksData[selectedType] || {});
        return (
            <div className="exam-container w-full animate-fade-in">
                <div className="dashboard-wrapper">
                    <div className="exam-period-header flex items-center gap-4 mb-8">
                        <button 
                            onClick={() => setSelectedType(null)}
                            className="exam-back-btn"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                        <div>
                            <h2 className="exam-title text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{selectedType}</h2>
                            <p className="exam-subtitle text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select a specific evaluation period</p>
                        </div>
                    </div>

                    <div className="exam-period-grid">
                        {subTypes.map((sub) => (
                            <div 
                                key={sub}
                                onClick={() => setSelectedSubType(sub)}
                                className="exam-period-card group"
                            >
                                <div className="exam-period-card-content-wrap">
                                    <div className="exam-period-icon-wrap">
                                        <Target size={20} />
                                    </div>
                                    <div className="exam-period-text-wrap">
                                        <span className="exam-period-title">{sub}</span>
                                        <span className="exam-period-card-subtitle">Evaluation Term</span>
                                    </div>
                                </div>
                                <div className="exam-period-chevron">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentMarks = marksData[selectedType]?.[selectedSubType] || [];

    return (
        <div className="exam-container w-full animate-fade-in">
            <div className="dashboard-wrapper">
                <div className="exam-period-header flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => setSelectedSubType(null)}
                        className="exam-back-btn"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="exam-title text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{selectedSubType}</h2>
                        <p className="exam-subtitle text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{selectedType} Category</p>
                    </div>
                </div>

                {currentMarks.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-400 font-bold text-base">No results available for this category yet.</p>
                    </div>
                ) : (
                    <div className="exam-marks-grid">
                        {currentMarks.map((mark, index) => (
                            <div key={index} className="exam-marks-card group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                
                                <h3 className="exam-card-title mb-6">{mark.subject}</h3>
                                
                                <div className="exam-marks-score-container">
                                    <div>
                                        <p className="exam-marks-score-lbl">Total Score</p>
                                        <div className="exam-marks-digits">
                                            <span>{mark.marks}</span>
                                            <span>/{mark.total_marks}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={`exam-marks-grade ${getGradeColor(mark.grade)}`}>
                                        {mark.grade}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="exam-marks-progress-lbl flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        <span>Achievement</span>
                                        <span className="text-blue-600 dark:text-blue-400">{mark.percentage}%</span>
                                    </div>
                                    <div className="exam-marks-progress-track w-full bg-slate-50 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-100/50 dark:border-slate-700/50">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 shadow-sm ${mark.percentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : mark.percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`}
                                            style={{ width: `${mark.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamMarks;
