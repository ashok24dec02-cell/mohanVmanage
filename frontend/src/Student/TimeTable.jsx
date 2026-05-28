import './TimeTable.css';
import React, { useState, useEffect } from 'react';
import {
    Clock, BookOpen, Coffee, User, ChevronRight, ChevronLeft,
    Calendar as CalendarIcon, ShieldAlert, MapPin, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import config from '../config';

const TimeTable = ({ onSelectClass }) => {
    const [view, setView] = useState('today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedExamType, setSelectedExamType] = useState('All');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [scheduleData, setScheduleData] = useState(null);
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fallbackTimeSlots = [
        "09:30 AM - 10:15 AM", "10:15 AM - 11:00 AM", "11:00 AM - 11:15 AM",
        "11:15 AM - 12:00 PM", "12:00 PM - 12:45 PM", "12:45 PM - 01:15 PM",
        "01:15 PM - 02:00 PM", "02:00 PM - 02:45 PM", "02:45 PM - 03:00 PM",
        "03:00 PM - 03:45 PM", "03:45 PM - 04:30 PM"
    ];

    const formatTime = (t) => {
        if (!t) return '';
        if (t.includes('AM') || t.includes('PM')) return t;
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12 < 10 ? '0' : ''}${hour12}:${m} ${ampm}`;
    };

    const timeSlots = React.useMemo(() => {
        if (!scheduleData) return fallbackTimeSlots;
        const firstDay = Object.values(scheduleData).find(day => day && day.length > 0);
        if (firstDay) {
            return firstDay.map(period => {
                if (period.start_time && period.end_time) {
                    return `${formatTime(period.start_time)} - ${formatTime(period.end_time)}`;
                }
                return null;
            }).filter(Boolean);
        }
        return fallbackTimeSlots;
    }, [scheduleData]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('studentToken');
                const [scheduleRes, examRes] = await Promise.all([
                    axios.get(`${config.BASE_URL}/student/timetable/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${config.BASE_URL}/student/exam-timetable/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setScheduleData(scheduleRes.data);
                setExamData(examRes.data);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium text-slate-500">Loading schedule...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                    <ShieldAlert size={20} />
                    <span className="font-medium text-sm">{error}</span>
                </div>
            </div>
        );
    }

    if (!scheduleData) return null;

    const getTypeColor = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('lecture') || t.includes('theory')) return 'bg-type-lecture';
        if (t.includes('lab') || t.includes('practical')) return 'bg-type-practical';
        if (t.includes('break') || t.includes('lunch')) return 'bg-type-break';
        if (t.includes('activity') || t.includes('sport')) return 'bg-type-activity';
        if (t.includes('exam') || t.includes('test')) return 'bg-type-exam';
        return 'bg-type-default';
    };

    const parseTimeToMinutes = (t) => {
        if (!t) return 0;
        const [time, mod] = t.split(' ');
        let [h, m] = time.split(':');
        h = parseInt(h);
        if (mod === 'PM' && h !== 12) h += 12;
        if (mod === 'AM' && h === 12) h = 0;
        return h * 60 + parseInt(m);
    };

    const renderTodayView = () => {
        const dayIndex = selectedDate.getDay();
        const dayName = days[dayIndex];
        const daySchedule = scheduleData[dayName] || [];
        const todayDateStr = selectedDate.toLocaleDateString('en-CA');
        const todayExams = examData?.filter(exam => exam.exam_date === todayDateStr) || [];
        const isWeekend = dayIndex === 0;

        const now = new Date();
        const isToday = now.toLocaleDateString('en-CA') === todayDateStr;
        let activeSlotIndex = -1;

        if (isToday) {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            timeSlots.forEach((slot, idx) => {
                const [start, end] = slot.split(' - ');
                if (currentTime >= parseTimeToMinutes(start) && currentTime <= parseTimeToMinutes(end)) {
                    activeSlotIndex = idx;
                }
            });
        }

        const handleDateChange = (daysToAdd) => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + daysToAdd);
            setSelectedDate(newDate);
        };

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Date Navigator */}
                <div className="date-nav-container flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <button onClick={() => handleDateChange(-1)} className="date-nav-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div className="date-nav-content text-center">
                        <div className="date-nav-subtitle text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h3 className="date-nav-title text-lg font-bold text-slate-800 dark:text-white leading-tight">{dayName}</h3>
                    </div>
                    <button onClick={() => handleDateChange(1)} className="date-nav-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>



                {isWeekend ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <Coffee size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h4 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Rest & Recharge</h4>
                        <p className="text-sm text-slate-500">No classes scheduled for today.</p>
                    </div>
                ) : (
                    <div className="today-timeline-container bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="today-timeline-wrapper relative pl-8 md:pl-12">
                            {/* The continuous vertical timeline line */}
                            <div className="today-timeline-line absolute left-[11px] md:left-[15px] top-6 bottom-6 w-[2px] bg-slate-100 dark:bg-slate-700"></div>
                            
                            {daySchedule.map((period, index) => {
                                const slotTime = timeSlots[index];
                                if (!slotTime) return null;
                                const slotStart = parseTimeToMinutes(slotTime.split(' - ')[0]);
                                const slotEnd = parseTimeToMinutes(slotTime.split(' - ')[1]);

                                let overlappingExam = null;
                                for (const exam of todayExams) {
                                    const examStart = parseTimeToMinutes(exam.exam_time.split(' - ')[0]);
                                    const examEnd = parseTimeToMinutes(exam.exam_time.split(' - ')[1]);
                                    if (slotStart < examEnd && slotEnd > examStart) {
                                        overlappingExam = exam;
                                        break;
                                    }
                                }

                                if (overlappingExam) {
                                    const examStart = parseTimeToMinutes(overlappingExam.exam_time.split(' - ')[0]);
                                    const examEnd = parseTimeToMinutes(overlappingExam.exam_time.split(' - ')[1]);
                                    
                                    // Only render the exam card on the FIRST overlapping slot
                                    let isFirstOverlap = true;
                                    if (index > 0) {
                                        const prevSlot = timeSlots[index - 1];
                                        const prevSlotStart = parseTimeToMinutes(prevSlot.split(' - ')[0]);
                                        const prevSlotEnd = parseTimeToMinutes(prevSlot.split(' - ')[1]);
                                        if (prevSlotStart < examEnd && prevSlotEnd > examStart) {
                                            isFirstOverlap = false;
                                        }
                                    }

                                    if (isFirstOverlap) {
                                        let isExamOver = false;
                                        if (isToday) {
                                            const currentTime = now.getHours() * 60 + now.getMinutes();
                                            if (currentTime > examEnd) isExamOver = true;
                                        }
                                        
                                        return (
                                            <div key={`exam-${index}`} className={`today-timeline-item relative mb-6 last:mb-0 group ${isExamOver ? 'opacity-70' : ''}`}>
                                                <div className="today-timeline-dot absolute -left-[37px] md:-left-[41px] top-5 w-[14px] h-[14px] rounded-full border-2 z-10 border-red-500 bg-white"></div>
                                                
                                                <div className={`hero-exam-card p-4 md:p-5 rounded-2xl text-white shadow-md transition-colors ${isExamOver ? 'completed' : ''}`}>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                        <div className="md:min-w-[110px] pl-3 border-l-2 border-white/20">
                                                            <div className="text-sm font-bold text-white">
                                                                {overlappingExam.exam_time.split(' - ')[0]}
                                                            </div>
                                                            <div className="text-[11px] font-medium text-white/70 mt-0.5">
                                                                to {overlappingExam.exam_time.split(' - ')[1]}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <div className="p-1.5 bg-white/10 rounded-lg mr-1">
                                                                    {isExamOver ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                                                                </div>
                                                                <h4 className="font-bold text-white text-[16px] tracking-wide">{overlappingExam.subject} Examination</h4>
                                                                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-white/20 text-white tracking-widest ml-auto md:ml-2">
                                                                    {isExamOver ? 'Completed' : overlappingExam.type}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex flex-wrap items-center gap-4 text-[12px] text-white/80 font-medium mt-1 pl-9">
                                                                <span className="flex items-center gap-1.5"><User size={13} className="opacity-70" /> {overlappingExam.supervisor}</span>
                                                                <span className="flex items-center gap-1.5"><MapPin size={13} className="opacity-70" /> {overlappingExam.hall}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }

                                const isActive = index === activeSlotIndex;
                                const isClickable = period.type !== 'Break' && period.type !== 'Lunch' && period.subject !== 'None';
                                const colorClass = getTypeColor(period.type);

                                return (
                                    <div key={index} className="today-timeline-item relative mb-6 last:mb-0 group">
                                        {/* Timeline Dot */}
                                        <div className={`today-timeline-dot absolute -left-[37px] md:-left-[41px] top-5 w-[14px] h-[14px] rounded-full border-2 z-10 ${isActive ? 'active' : ''}`}></div>
                                        
                                        {/* Card */}
                                        <div 
                                            onClick={() => isClickable && onSelectClass ? onSelectClass({ ...period, time: slotTime }) : null}
                                            className={`today-schedule-card p-4 md:p-5 rounded-xl border transition-colors ${isActive ? 'active-class' : ''} ${isClickable ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                {/* Time Section */}
                                                <div className="md:min-w-[110px]">
                                                    <div className={`text-sm font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {slotTime.split(' - ')[0]}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-slate-500">
                                                        to {slotTime.split(' - ')[1]}
                                                    </div>
                                                </div>
                                                
                                                {/* Details Section */}
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-[15px]">{period.subject}</h4>
                                                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase border ${colorClass}`}>
                                                            {period.type}
                                                        </span>
                                                        {isActive && (
                                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-[10px] px-2 py-0.5 rounded-[4px] font-bold uppercase animate-pulse">
                                                                Live
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {period.teacher && period.teacher !== 'None' && (
                                                        <div className="flex items-center gap-4 text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-2">
                                                            <span className="flex items-center gap-1.5"><User size={13} className="opacity-70" /> {period.teacher}</span>
                                                            {period.room && period.room !== 'None' && <span className="flex items-center gap-1.5"><MapPin size={13} className="opacity-70" /> {period.room}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {isClickable && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                                        <ChevronRight size={18} className="text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderWeeklyView = () => {
        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        const weekDates = days.slice(1, 7).map((dayName, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return {
                name: dayName,
                date: date.toLocaleDateString('en-CA'),
                display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
        });

        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar w-full">
                    <table className="w-full min-w-[900px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50">
                                <th className="p-4 sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700/50 text-center w-28">
                                    <Clock size={16} className="text-slate-400 mx-auto" />
                                </th>
                                {weekDates.map(item => (
                                    <th key={item.name} className="p-4 border-b border-slate-200 dark:border-slate-700/50 text-center">
                                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">{item.name}</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.display}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((time, slotIndex) => (
                                <tr key={slotIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 sticky left-0 z-10 bg-white dark:bg-slate-800 border-r border-b border-slate-100 dark:border-slate-700/50 text-center align-middle">
                                        <div className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{time.split(' - ')[0]}</div>
                                        <div className="text-[10px] font-medium text-slate-400">to {time.split(' - ')[1]}</div>
                                    </td>
                                    {weekDates.map(item => {
                                        const dayExams = examData?.filter(exam => exam.exam_date === item.date) || [];
                                        
                                        const slotStart = parseTimeToMinutes(time.split(' - ')[0]);
                                        const slotEnd = parseTimeToMinutes(time.split(' - ')[1]);

                                        let overlappingExam = null;
                                        for (const exam of dayExams) {
                                            const examStart = parseTimeToMinutes(exam.exam_time.split(' - ')[0]);
                                            const examEnd = parseTimeToMinutes(exam.exam_time.split(' - ')[1]);
                                            if (slotStart < examEnd && slotEnd > examStart) {
                                                overlappingExam = exam;
                                                break;
                                            }
                                        }
                                        
                                        if (overlappingExam) {
                                            const examStart = parseTimeToMinutes(overlappingExam.exam_time.split(' - ')[0]);
                                            const examEnd = parseTimeToMinutes(overlappingExam.exam_time.split(' - ')[1]);

                                            // Check if this is the first slot of the overlap
                                            let isFirstOverlap = true;
                                            if (slotIndex > 0) {
                                                const prevSlot = timeSlots[slotIndex - 1];
                                                const prevSlotStart = parseTimeToMinutes(prevSlot.split(' - ')[0]);
                                                const prevSlotEnd = parseTimeToMinutes(prevSlot.split(' - ')[1]);
                                                if (prevSlotStart < examEnd && prevSlotEnd > examStart) {
                                                    isFirstOverlap = false;
                                                }
                                            }
                                            
                                            if (isFirstOverlap) {
                                                // Calculate how many slots this exam spans
                                                let span = 0;
                                                for (let i = slotIndex; i < timeSlots.length; i++) {
                                                    const s = timeSlots[i];
                                                    const sStart = parseTimeToMinutes(s.split(' - ')[0]);
                                                    const sEnd = parseTimeToMinutes(s.split(' - ')[1]);
                                                    if (sStart < examEnd && sEnd > examStart) {
                                                        span++;
                                                    } else {
                                                        break;
                                                    }
                                                }
                                                
                                                return (
                                                    <td key={item.name} rowSpan={span} className="bg-red-50/50 dark:bg-red-900/20 border-b border-l border-slate-100 dark:border-slate-700/50 p-2 align-middle">
                                                        <div className="h-full w-full border-2 border-dashed border-red-200 dark:border-red-800/50 rounded-xl flex flex-col items-center justify-center p-3 text-center min-h-[70px]">
                                                            <ShieldAlert className="text-red-500 mb-1" size={18} />
                                                            <div className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">{overlappingExam.type} Exam</div>
                                                            <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{overlappingExam.subject}</div>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            
                                            // If overlapping but not the first one, it is covered by the rowSpan, so we return null
                                            return null;
                                        }

                                        const period = scheduleData[item.name]?.[slotIndex];
                                        if (!period || period.subject === 'None') return <td key={item.name} className="border-b border-l border-slate-50 dark:border-slate-700/30"></td>;

                                        const colorClass = getTypeColor(period.type);
                                        const isClickable = period.type !== 'Break' && period.type !== 'Lunch';

                                        return (
                                            <td key={item.name} className="border-b border-l border-slate-50 dark:border-slate-700/30 p-2 h-[85px] align-middle">
                                                <div onClick={() => isClickable && onSelectClass ? onSelectClass({ ...period, time }) : null}
                                                    className={`h-full w-full rounded-lg p-2.5 flex flex-col justify-center border ${colorClass} ${isClickable ? 'cursor-pointer hover:shadow-sm' : ''} transition-all`}>
                                                    <div className="font-bold text-[12px] leading-tight mb-1 text-slate-800 dark:text-slate-200 line-clamp-2">{period.subject}</div>
                                                    {period.teacher && period.teacher !== 'None' && (
                                                        <div className="text-[10px] font-medium opacity-70 truncate">{period.teacher}</div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderExamsView = () => {
        const filteredExams = selectedExamType === 'All'
            ? examData
            : examData?.filter(exam => exam.type.includes(selectedExamType));

        const categories = ['All', 'Mid Term', 'Quarterly', 'Half-Yearly', 'Annual'];

        return (
            <div className="space-y-6">
                <div className="exam-filter-tabs-container flex flex-wrap gap-2 justify-center mb-8">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedExamType(cat)}
                            className={`exam-filter-btn px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${selectedExamType === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {(!filteredExams || filteredExams.length === 0) ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <BookOpen size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Exams Found</h4>
                        <p className="text-sm text-slate-500">There are no examinations scheduled for this category.</p>
                    </div>
                ) : (
                    <div className="exams-grid-container grid gap-6 w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {filteredExams.map((exam, index) => (
                            <div key={index} className="exam-card-custom bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                {/* Content */}
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 rounded-md text-[10px] font-bold uppercase tracking-widest">
                                        {exam.type}
                                    </div>
                                    <ShieldAlert size={18} className="text-red-400" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-5 relative z-10 line-clamp-2">{exam.subject}</h4>
                                
                                <div className="space-y-2.5 relative z-10">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
                                        <CalendarIcon size={16} className="text-blue-500" />
                                        <span className="font-medium">{new Date(exam.exam_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
                                        <Clock size={16} className="text-emerald-500" />
                                        <span className="font-medium">{exam.exam_time}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mt-3 px-1">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                            <MapPin size={14} className="opacity-70" /> <span className="truncate">{exam.hall || 'TBD'}</span>
                                        </div>
                                    </div>

                                    {/* Premium Multiple Supervisor Schedule */}
                                    {((exam.supervisors && exam.supervisors.length > 0) || (exam.supervisor && exam.supervisor !== 'None')) && (
                                        <div className="supervisor-section">
                                            <h5>Supervisor Schedule</h5>
                                            <div className="supervisor-list">
                                                {exam.supervisors && exam.supervisors.length > 0 ? (
                                                    exam.supervisors.map((sup, sIndex) => (
                                                        <div key={sIndex} className="supervisor-slot">
                                                            <span className="sup-time">{sup.startTime} - {sup.endTime}</span>
                                                            <span className="sup-name">{sup.name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="supervisor-slot">
                                                        <span className="sup-time">{exam.exam_time}</span>
                                                        <span className="sup-name">{exam.supervisor}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="timetable-container max-w-[1200px] mx-auto p-4 md:p-6 w-full">
            
            {/* Standard Header & Tabs */}
            <div className="timetable-header-container flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8 w-full">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Academic Schedule</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your daily classes and upcoming examinations.</p>
                </div>
                
                <div className="tab-segmented-control flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl w-fit">
                    {[
                        { id: 'today', label: 'Today', icon: Clock },
                        { id: 'weekly', label: 'Weekly', icon: CalendarIcon },
                        { id: 'exams', label: 'Exams', icon: BookOpen }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === item.id ? 'active' : ''}`}
                        >
                            <item.icon size={16} />
                            <span className="hidden sm:inline">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full animate-fade-in min-h-[500px]">
                {view === 'today' && renderTodayView()}
                {view === 'weekly' && renderWeeklyView()}
                {view === 'exams' && renderExamsView()}
            </div>
        </div>
    );
};

export default TimeTable;
