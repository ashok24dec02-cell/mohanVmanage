import { useState, useEffect, useRef } from 'react';
import { Calendar, RefreshCw, CheckCircle, Clock, Filter, Users, Layers, AlertCircle, Download, Settings as SettingsIcon, Save, Bell, User } from 'lucide-react';
import { timetableAPI, settingsAPI, examAPI } from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import ClashAlerts from '../components/ClashAlerts';
import DataManagement from '../components/DataManagement';
import ExamManagement from '../components/ExamManagement';
import { useReactToPrint } from 'react-to-print';
import './Timetable.css';

const Timetable = () => {
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [clashErrors, setClashErrors] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showDataManager, setShowDataManager] = useState(false);
    const [showExamManager, setShowExamManager] = useState(false);
    const [examData, setExamData] = useState([]);
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());

    // AI Generation Rules
    const [minFreePeriods, setMinFreePeriods] = useState(1);
    const [maxFreePeriods, setMaxFreePeriods] = useState(2);

    // School Settings State
    const [schoolSettings, setSchoolSettings] = useState({
        school_name: 'V-Manage School',
        start_time: '09:00',
        end_time: '16:00',
        period_duration: 45,
        morning_interval_after_period: 2,
        morning_interval_duration: 15,
        lunch_after_period: 4,
        lunch_duration: 45,
        evening_interval_after_period: 6,
        evening_interval_duration: 15
    });

    // Advanced Filters
    const [viewMode, setViewMode] = useState('class'); // 'class' | 'teacher'
    const [selectedEntity, setSelectedEntity] = useState('');
    const [selectedDay, setSelectedDay] = useState('All');

    const daysOfWeek = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [ttRes, settingsRes, examsRes] = await Promise.all([
                timetableAPI.getAll(),
                settingsAPI.get(),
                examAPI.getAll()
            ]);
            
            const fetchedTT = ttRes.data.timetables || [];
            setTimetables(fetchedTT);
            if (fetchedTT.length > 0) {
                setSelectedEntity(`${fetchedTT[0].class_name} - ${fetchedTT[0].section}`);
            }

            if (settingsRes.data && settingsRes.data.school_name) {
                setSchoolSettings(settingsRes.data);
            }

            setExamData(examsRes.data || []);
        } catch (err) {
            setError('Failed to load system data. Please check connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchExams = async () => {
        try {
            const examsRes = await examAPI.getAll();
            setExamData(examsRes.data || []);
        } catch (err) {
            console.error('Failed to load exams', err);
        }
    };

    const getWeekDates = (baseDate) => {
        const startOfWeek = new Date(baseDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        
        const daysName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        return daysName.map((dayName, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return {
                name: dayName,
                dateStr: date.toLocaleDateString('en-CA'),
                display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
        });
    };

    const weekDates = getWeekDates(currentWeekDate);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        setError('');
        setSuccess('');
        try {
            await settingsAPI.update(schoolSettings);
            setSuccess('School timings updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save school settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        setSuccess('');
        setClashErrors([]);
        try {
            const payload = { minFreePeriods, maxFreePeriods };
            const res = await timetableAPI.generate(payload);
            setSuccess(res.data.message);
            const newTimetables = res.data.timetables || [];
            setTimetables(newTimetables);
            if (newTimetables.length > 0) {
                setViewMode('class');
                setSelectedEntity(`${newTimetables[0].class_name} - ${newTimetables[0].section}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Generation failed. Please check school settings.');
            if (err.response?.data?.clash_errors) {
                setClashErrors(err.response.data.clash_errors);
            }
        } finally {
            setGenerating(false);
        }
    };

    const componentRef = useRef(null);

    const handleDownloadPDF = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Timetable_${selectedEntity}_${viewMode}`,
    });

    const classList = timetables.map(t => `${t.class_name} - ${t.section}`);
    const teacherList = Array.from(new Set(
        timetables.flatMap(tt =>
            Object.values(tt.schedule).flatMap(daySlots =>
                daySlots.map(slot => slot.teacher)
            )
        )
    )).filter(t => t && t !== 'Unassigned').sort();

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        if (mode === 'class' && classList.length > 0) setSelectedEntity(classList[0]);
        if (mode === 'teacher' && teacherList.length > 0) setSelectedEntity(teacherList[0]);
    };

    let currentSchedule = null;
    const masterPeriods = timetables.length > 0 ? (timetables[0].schedule['Monday'] || []) : [];

    if (viewMode === 'class' && timetables.length > 0) {
        const found = timetables.find(t => `${t.class_name} - ${t.section}` === selectedEntity);
        if (found) currentSchedule = found.schedule;
    } else if (viewMode === 'teacher' && timetables.length > 0) {
        currentSchedule = { "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": [], "Friday": [] };
        timetables.forEach(classTT => {
            const cName = `${classTT.class_name} - ${classTT.section}`;
            Object.entries(classTT.schedule).forEach(([day, slots]) => {
                slots.forEach(slot => {
                    if (slot.teacher === selectedEntity) {
                        currentSchedule[day].push({
                            ...slot,
                            subject: `${slot.subject} (${cName})`
                        });
                    }
                });
            });
        });
        Object.keys(currentSchedule).forEach(day => {
            currentSchedule[day].sort((a, b) => a.period - b.period);
        });
    }

    const entityOptions = viewMode === 'class' ? classList : teacherList;

    return (
        <div className="tt-container">
            {/* Top Admin Header */}
            <div className="tt-admin-header">
                <div className="tt-admin-header-left">
                    <h1>Timetable Management</h1>
                    <p>Generate and manage school schedules</p>
                </div>
                <div className="tt-admin-header-right">
                    <button className="tt-icon-btn"><Bell size={20} /></button>
                    <button className="tt-icon-btn" onClick={() => setShowSettings(!showSettings)}><SettingsIcon size={20} /></button>
                    <div className="tt-profile-badge">
                        <div className="tt-avatar"><User size={18} color="#fff" /></div>
                        <span>Admin Profile</span>
                    </div>
                </div>
            </div>

            {/* Controls Card */}
            <div className="tt-controls-card">
                    <div className="tt-rules-panel">
                        <h3 className="tt-rules-title"><CheckCircle size={18} color="#10b981"/> AI Engine Rules</h3>
                        <div className="tt-rules-inputs">
                            <div className="tt-input-group">
                                <label>Min Free</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    value={minFreePeriods} 
                                    onChange={(e) => setMinFreePeriods(e.target.value)}
                                />
                            </div>
                            <div className="tt-input-group">
                                <label>Max Free</label>
                                <input 
                                    type="number" 
                                    min={minFreePeriods} 
                                    value={maxFreePeriods} 
                                    onChange={(e) => setMaxFreePeriods(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="tt-action-group">
                        <button
                            onClick={() => setShowDataManager(true)}
                            className="tt-btn tt-btn-pdf"
                            style={{borderColor: 'var(--tt-primary)', color: 'var(--tt-primary)', gap: '0.5rem'}}
                        >
                            <Users size={18} /> Manage Data
                        </button>
                        <button
                            onClick={() => setShowExamManager(true)}
                            className="tt-btn tt-btn-pdf"
                            style={{borderColor: '#ef4444', color: '#ef4444', gap: '0.5rem'}}
                        >
                            <Calendar size={18} /> Exam Schedule
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="tt-btn tt-btn-generate"
                        >
                            <RefreshCw size={20} className={generating ? "animate-spin" : ""} />
                            {generating ? 'Generating...' : 'Generate Timetable'}
                        </button>
                        <div className="tt-btn-row">
                            <button onClick={handleDownloadPDF} className="tt-btn tt-btn-pdf" title="Download PDF">
                                <Download size={18} /> Download
                            </button>
                        </div>
                    </div>
                </div>

            {/* Data Management Modal */}
            {showDataManager && (
                <DataManagement 
                    onClose={() => setShowDataManager(false)} 
                    onDataChange={fetchInitialData} 
                />
            )}

            {/* Exam Management Modal */}
            {showExamManager && (
                <ExamManagement 
                    onClose={() => setShowExamManager(false)} 
                    onDataChange={fetchExams}
                    selectedClass={selectedEntity}
                />
            )}

            {/* Expandable Settings Panel */}
            {showSettings && (
                <div className="tt-settings-glass">
                    <div className="tt-settings-header">
                        <h3><Clock size={20} color="#8b5cf6"/> School Timing Configuration</h3>
                        <button 
                            disabled={savingSettings}
                            onClick={handleSaveSettings}
                            className="tt-btn tt-btn-generate"
                            style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}
                        >
                            <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                    
                    <div className="tt-settings-grid">
                        <div className="tt-settings-col">
                            <h4>Hours & Duration</h4>
                            <div className="tt-settings-row">
                                <div className="tt-input-group">
                                    <label>School Start</label>
                                    <input type="time" value={schoolSettings.start_time} onChange={e => setSchoolSettings({...schoolSettings, start_time: e.target.value})} />
                                </div>
                                <div className="tt-input-group">
                                    <label>School End</label>
                                    <input type="time" value={schoolSettings.end_time} onChange={e => setSchoolSettings({...schoolSettings, end_time: e.target.value})} />
                                </div>
                                <div className="tt-input-group">
                                    <label>Period Mins</label>
                                    <input type="number" value={schoolSettings.period_duration} onChange={e => setSchoolSettings({...schoolSettings, period_duration: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="tt-settings-col">
                            <h4>Intervals & Lunch</h4>
                            <div className="tt-settings-row">
                                <div className="tt-input-group">
                                    <label>Morning Break After</label>
                                    <div className="flex-input">
                                        <span>Period</span>
                                        <input type="number" value={schoolSettings.morning_interval_after_period} onChange={e => setSchoolSettings({...schoolSettings, morning_interval_after_period: e.target.value})} />
                                        <span>Dur (min)</span>
                                        <input type="number" value={schoolSettings.morning_interval_duration} onChange={e => setSchoolSettings({...schoolSettings, morning_interval_duration: e.target.value})} />
                                    </div>
                                </div>
                                <div className="tt-input-group">
                                    <label>Lunch Break After</label>
                                    <div className="flex-input">
                                        <span>Period</span>
                                        <input type="number" value={schoolSettings.lunch_after_period} onChange={e => setSchoolSettings({...schoolSettings, lunch_after_period: e.target.value})} />
                                        <span>Dur (min)</span>
                                        <input type="number" value={schoolSettings.lunch_duration} onChange={e => setSchoolSettings({...schoolSettings, lunch_duration: e.target.value})} />
                                    </div>
                                </div>
                                <div className="tt-input-group">
                                    <label>Evening Break After</label>
                                    <div className="flex-input">
                                        <span>Period</span>
                                        <input type="number" value={schoolSettings.evening_interval_after_period} onChange={e => setSchoolSettings({...schoolSettings, evening_interval_after_period: e.target.value})} />
                                        <span>Dur (min)</span>
                                        <input type="number" value={schoolSettings.evening_interval_duration} onChange={e => setSchoolSettings({...schoolSettings, evening_interval_duration: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {clashErrors.length > 0 ? (
                <ClashAlerts errors={clashErrors} />
            ) : error ? (
                <div className="tt-alert tt-alert-clash">
                    <AlertCircle size={20} /> {error}
                </div>
            ) : null}

            {success && (
                <div className="tt-alert tt-alert-success">
                    <CheckCircle size={20} /> {success}
                </div>
            )}

            {/* Main Content Area */}
            <div className="tt-main-card">
                <div className="tt-filters-bar">
                    <div className="tt-filter-label">
                        <Filter size={16} /> Filters
                    </div>

                    <div className="tt-filter-controls">
                        <div className="tt-segmented-control">
                            <button onClick={() => handleViewModeChange('class')} className={`tt-segment-btn ${viewMode === 'class' ? 'active' : ''}`}><Layers size={16} /> Class View</button>
                            <button onClick={() => handleViewModeChange('teacher')} className={`tt-segment-btn ${viewMode === 'teacher' ? 'active' : ''}`}><Users size={16} /> Teacher View</button>
                        </div>

                        {viewMode === 'class' && (
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800" style={{height: '38px', boxSizing: 'border-box'}}>
                                <button 
                                    onClick={() => {
                                        const d = new Date(currentWeekDate);
                                        d.setDate(d.getDate() - 7);
                                        setCurrentWeekDate(d);
                                    }}
                                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md border-none bg-transparent cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                                    style={{fontSize: '0.85rem'}}
                                    title="Previous Week"
                                >
                                    ◀
                                </button>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                                    Week: {weekDates[0].display} - {weekDates[4].display}
                                </span>
                                <button 
                                    onClick={() => {
                                        const d = new Date(currentWeekDate);
                                        d.setDate(d.getDate() + 7);
                                        setCurrentWeekDate(d);
                                    }}
                                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md border-none bg-transparent cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                                    style={{fontSize: '0.85rem'}}
                                    title="Next Week"
                                >
                                    ▶
                                </button>
                            </div>
                        )}

                        <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="tt-select">
                            {entityOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                        </select>

                        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="tt-select">
                            {daysOfWeek.map(day => (<option key={day} value={day}>{day === 'All' ? 'All Days' : day}</option>))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="tt-content-body" style={{textAlign: 'center', color: '#64748b'}}>Loading timetables...</div>
                ) : timetables.length === 0 ? (
                    <div className="tt-content-body" style={{textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
                        <Calendar size={64} opacity={0.2} />
                        <h2 style={{margin: 0, fontWeight: 800}}>No Schedules Found</h2>
                        <p style={{margin: 0}}>Configure school timings and click generate.</p>
                    </div>
                ) : (
                    <div className="tt-content-body" ref={componentRef}>
                        <div className="tt-grid-header">
                            <div className="tt-badge-title">
                                {viewMode === 'class' ? '📚 Class:' : '👨‍🏫 Teacher:'} <span>{selectedEntity}</span>
                            </div>
                        </div>

                        {currentSchedule && (
                            <TimetableGrid
                                schedule={currentSchedule}
                                selectedDay={selectedDay}
                                masterPeriods={masterPeriods}
                                weekDates={weekDates}
                                examData={examData}
                                selectedEntity={selectedEntity}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timetable;
