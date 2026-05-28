import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, User, MapPin, BookOpen, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { examAPI, subjectAPI, masterStaffAPI, masterClassAPI } from '../services/api';

const ExamManagement = ({ onClose, onDataChange, selectedClass }) => {
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [activeTab, setActiveTab] = useState('upcoming');
    const [filterClass, setFilterClass] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterSubject, setFilterSubject] = useState('');

    const isExamCompleted = (exam) => {
        if (!exam.exam_date) return false;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        if (exam.exam_date < todayStr) return true;
        if (exam.exam_date > todayStr) return false;
        
        if (!exam.exam_time) return false;
        const timeParts = exam.exam_time.split(' - ');
        if (timeParts.length < 2) return false;
        
        const endTimeStr = timeParts[1].trim();
        
        const parseTimeToMinutes = (t) => {
            if (!t) return 0;
            const [time, ampm] = t.split(' ');
            if (!time) return 0;
            let [h, m] = time.split(':').map(Number);
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return h * 60 + m;
        };
        
        const currentMinutes = today.getHours() * 60 + today.getMinutes();
        const examEndMinutes = parseTimeToMinutes(endTimeStr);
        return currentMinutes > examEndMinutes;
    };

    const filteredExams = exams.filter(exam => {
        const completed = isExamCompleted(exam);
        if (activeTab === 'upcoming' && completed) return false;
        if (activeTab === 'history' && !completed) return false;
        
        if (filterClass && exam.grade !== filterClass) return false;
        if (filterDate && exam.exam_date !== filterDate) return false;
        if (filterType !== 'All' && exam.type !== filterType) return false;
        if (filterSubject && exam.subject !== filterSubject) return false;
        
        return true;
    });

    // Free teachers state
    const [freeTeachers, setFreeTeachers] = useState([]);
    const [busyTeachers, setBusyTeachers] = useState([]);
    const [loadingFree, setLoadingFree] = useState(false);
    const [freeChecked, setFreeChecked] = useState(false);

    // Form State - no dummy data
    const [formData, setFormData] = useState({
        type: 'Mid Term',
        subject: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        grade: '',
        hall: '',
        supervisor: '',
        benches: '',
        students_per_bench: ''
    });

    useEffect(() => {
        fetchExamsAndMetadata();
    }, []);

    // Auto-fetch free teachers when date + start_time + end_time are all filled
    useEffect(() => {
        if (formData.exam_date && formData.start_time && formData.end_time) {
            fetchFreeTeachers();
        } else {
            setFreeTeachers([]);
            setBusyTeachers([]);
            setFreeChecked(false);
        }
    }, [formData.exam_date, formData.start_time, formData.end_time]);

    // Automate end_time calculation based on exam type and start_time
    useEffect(() => {
        if (formData.start_time && formData.type) {
            try {
                const [hours, minutes] = formData.start_time.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    const duration = formData.type === 'Mid Term' ? 1 : 3;
                    let endHours = hours + duration;
                    if (endHours >= 24) endHours = endHours - 24;
                    const calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    setFormData(prev => ({
                        ...prev,
                        end_time: calculatedEndTime
                    }));
                }
            } catch (err) {
                console.error("Error calculating end time", err);
            }
        }
    }, [formData.start_time, formData.type]);

    const handleStudentsPerBenchChange = (val) => {
        setFormData(prev => ({
            ...prev,
            students_per_bench: val
        }));
    };

    const handleBenchesChange = (val) => {
        setFormData(prev => ({
            ...prev,
            benches: val
        }));
    };

    const fetchExamsAndMetadata = async () => {
        setLoading(true);
        setError('');
        try {
            const [examsRes, subjectsRes, teachersRes, classesRes] = await Promise.all([
                examAPI.getAll(),
                subjectAPI.getAll(),
                masterStaffAPI.getAll(),
                masterClassAPI.getAll()
            ]);

            setExams(examsRes.data || []);
            setSubjects(subjectsRes.data || []);
            
            // Map ERP staff collection to teacher list structure
            const staffList = teachersRes.data?.data || [];
            const mappedTeachers = staffList.map(staff => ({
                teacher_name: staff.fullName || staff.name || 'Unnamed Teacher'
            })).filter(t => t.teacher_name);
            setTeachers(mappedTeachers);

            // Set classes from master ERP collection
            setClasses(classesRes.data?.data || []);

            // Prefill grade from selected class if available
            let initialGrade = '';
            if (selectedClass) {
                initialGrade = selectedClass.split(' - ')[0].trim();
                if (selectedClass.includes(' - ')) {
                    const parts = selectedClass.split(' - ');
                    if (parts[1] && parts[1].trim()) {
                        initialGrade = `${parts[0].trim()}${parts[1].trim()}`;
                    }
                }
            }

            setFormData(prev => ({
                ...prev,
                grade: initialGrade
            }));
        } catch (err) {
            setError('Failed to fetch data from the server.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFreeTeachers = async () => {
        setLoadingFree(true);
        try {
            const res = await examAPI.getFreeTeachers(formData.exam_date, formData.start_time, formData.end_time);
            setFreeTeachers(res.data.free_teachers || []);
            setBusyTeachers(res.data.busy_teachers || []);
            setFreeChecked(true);
            // If currently selected supervisor is now busy, clear it
            if (formData.supervisor && res.data.busy_teachers?.includes(formData.supervisor)) {
                setFormData(prev => ({ ...prev, supervisor: '' }));
            }
        } catch (err) {
            console.error('Failed to fetch free teachers', err);
            // Fallback: show all teachers
            setFreeTeachers(teachers.map(t => t.teacher_name));
            setFreeChecked(false);
        } finally {
            setLoadingFree(false);
        }
    };

    // Convert 24h format to 12h AM/PM format
    const formatToAMPM = (time24) => {
        if (!time24) return '';
        const [hStr, mStr] = time24.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const displayH = h < 10 ? `0${h}` : h;
        return `${displayH}:${m} ${ampm}`;
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        const examTimeFormatted = `${formatToAMPM(formData.start_time)} - ${formatToAMPM(formData.end_time)}`;

        const payload = {
            ...formData,
            exam_time: examTimeFormatted
        };

        try {
            await examAPI.create(payload);
            setSuccess('Exam schedule added successfully!');
            
            const res = await examAPI.getAll();
            setExams(res.data || []);
            
            if (onDataChange) onDataChange();
            
            // Clear fields but keep grade & type
            setFormData(prev => ({
                ...prev,
                subject: '',
                exam_date: '',
                start_time: '',
                end_time: '',
                hall: '',
                supervisor: ''
            }));
            setFreeTeachers([]);
            setBusyTeachers([]);
            setFreeChecked(false);

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create exam schedule.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exam schedule?')) return;
        
        setError('');
        setSuccess('');
        try {
            await examAPI.delete(id);
            setSuccess('Exam schedule deleted successfully.');
            setExams(exams.filter(e => e._id !== id));
            
            if (onDataChange) onDataChange();
            
            // Re-fetch free teachers since deleting an exam frees up supervisors
            if (formData.exam_date && formData.start_time && formData.end_time) {
                fetchFreeTeachers();
            }
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete exam schedule.');
        }
    };

    return (
        <div className="tt-modal-overlay">
            <div className="tt-modal-content tt-settings-glass" style={{maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
                <div className="tt-modal-header">
                    <h2><BookOpen size={24} color="#ef4444" /> Manage Exam Timetables</h2>
                    <button onClick={onClose} className="tt-btn-close"><X size={24} /></button>
                </div>

                {error && (
                    <div className="tt-alert tt-alert-clash" style={{margin: '0 0 1rem 0'}}>
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                {success && (
                    <div className="tt-alert tt-alert-success" style={{margin: '0 0 1rem 0'}}>
                        <CheckCircle size={20} /> {success}
                    </div>
                )}

                <div className="tt-modal-body" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2rem'
                }}>
                    {/* Form Section */}
                    <div className="tt-data-section">
                        <h3 style={{fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem'}}>Add Exam Schedule</h3>
                        <form onSubmit={handleCreateExam} style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="tt-input-group">
                                    <label style={{fontSize: '0.75rem', fontWeight: 600}}>Grade/Class</label>
                                    <select 
                                        value={formData.grade}
                                        onChange={e => setFormData({...formData, grade: e.target.value, subject: ''})}
                                        required 
                                        className="tt-select"
                                        style={{width: '100%', boxSizing: 'border-box'}}
                                    >
                                        <option value="">-- Select Class --</option>
                                        {classes.map((cls) => {
                                            const gradeVal = `${cls.class_name.trim()}${(cls.section || '').trim()}`;
                                            return (
                                                <option key={cls._id} value={gradeVal}>
                                                    {cls.class_name} - {cls.section || 'No Section'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="tt-input-group">
                                    <label style={{fontSize: '0.75rem', fontWeight: 600}}>Exam Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        className="tt-select"
                                        style={{width: '100%', boxSizing: 'border-box'}}
                                    >
                                        <option value="Mid Term">Mid Term</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Half-Yearly">Half-Yearly</option>
                                        <option value="Annual">Annual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="tt-input-group">
                                <label style={{fontSize: '0.75rem', fontWeight: 600}}>Subject</label>
                                {/* Hidden input for form validation */}
                                <input type="hidden" value={formData.subject} required />
                                
                                {!formData.grade ? (
                                    <p style={{fontSize: '0.8rem', color: '#94a3b8', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1', textAlign: 'center'}}>
                                        Select a Class first to see subjects
                                    </p>
                                ) : (() => {
                                    const selectedCls = classes.find(cls => {
                                        const gradeVal = `${cls.class_name.trim()}${(cls.section || '').trim()}`;
                                        return gradeVal === formData.grade;
                                    });
                                    if (!selectedCls || !selectedCls.subjects || selectedCls.subjects.length === 0) {
                                        return (
                                            <p style={{fontSize: '0.75rem', color: '#f59e0b', padding: '0.75rem', background: '#fffbeb', borderRadius: '0.5rem', border: '1px dashed #fbbf24', textAlign: 'center'}}>
                                                ⚠ No subjects assigned to this class. Add subjects in Staff Management → Subjects tab.
                                            </p>
                                        );
                                    }
                                    const customOrder = ["Tamil", "English", "Maths", "Science", "Social"];
                                    const sortedSubjects = [...selectedCls.subjects].sort((a, b) => {
                                        let indexA = customOrder.indexOf(a.subject_name);
                                        let indexB = customOrder.indexOf(b.subject_name);
                                        if (indexA === -1) indexA = 999;
                                        if (indexB === -1) indexB = 999;
                                        return indexA - indexB;
                                    });

                                    return (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0'}}>
                                            {sortedSubjects.map((sub, idx) => {
                                                const scheduled = exams.find(e => 
                                                    e.grade === formData.grade && 
                                                    e.subject === sub.subject_name && 
                                                    e.type === formData.type
                                                );

                                                const isActive = formData.subject === sub.subject_name;
                                                return (
                                                    <div key={idx} style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({...formData, subject: isActive ? '' : sub.subject_name})}
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'flex-start',
                                                                gap: '0.35rem',
                                                                padding: '0.85rem 1.2rem',
                                                                borderRadius: isActive && !scheduled ? '0.75rem 0.75rem 0 0' : '0.75rem',
                                                                border: isActive ? '2px solid #3b82f6' : (scheduled ? '1px solid #fca5a5' : '1px solid #e2e8f0'),
                                                                borderBottom: isActive && !scheduled ? 'none' : undefined,
                                                                background: isActive ? '#eff6ff' : (scheduled ? '#fff5f5' : '#f8fafc'),
                                                                color: isActive ? '#1d4ed8' : '#334155',
                                                                textAlign: 'left',
                                                                width: '100%',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                                boxShadow: isActive ? '0 2px 10px rgba(59,130,246,0.15)' : 'none'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                                <span style={{ 
                                                                    fontWeight: 700, 
                                                                    fontSize: '0.92rem',
                                                                    color: isActive ? '#1d4ed8' : '#1e293b'
                                                                }}>
                                                                    {isActive ? '✓ ' : ''}{sub.subject_name}
                                                                </span>
                                                                {scheduled ? (
                                                                    <span style={{ 
                                                                        fontSize: '0.68rem', 
                                                                        fontWeight: 700, 
                                                                        padding: '0.15rem 0.5rem', 
                                                                        background: '#fee2e2', 
                                                                        color: '#ef4444', 
                                                                        borderRadius: '0.25rem',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        Scheduled
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ 
                                                                        fontSize: '0.68rem', 
                                                                        fontWeight: 500, 
                                                                        padding: '0.15rem 0.5rem', 
                                                                        background: '#f1f5f9', 
                                                                        color: '#64748b', 
                                                                        borderRadius: '0.25rem'
                                                                    }}>
                                                                        Not Scheduled
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            {scheduled ? (
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    flexDirection: 'column', 
                                                                    gap: '0.15rem', 
                                                                    fontSize: '0.78rem', 
                                                                    color: '#475569',
                                                                    width: '100%',
                                                                    marginTop: '0.15rem'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                        <span>🕒 {scheduled.exam_time}</span>
                                                                        <span>📅 {scheduled.exam_date}</span>
                                                                    </div>
                                                                    {scheduled.supervisor && (
                                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem', borderTop: '1px dashed #fca5a5', paddingTop: '0.2rem' }}>
                                                                            👤 Supervisor: <span style={{ fontWeight: 600, color: '#1e293b' }}>{scheduled.supervisor}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                                    Click to schedule exam for this subject
                                                                </div>
                                                            )}
                                                        </button>

                                                        {isActive && !scheduled && (
                                                            <div style={{
                                                                padding: '1.25rem',
                                                                background: '#eff6ff',
                                                                border: '2px solid #3b82f6',
                                                                borderTop: 'none',
                                                                borderBottomLeftRadius: '0.75rem',
                                                                borderBottomRightRadius: '0.75rem',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '0.75rem',
                                                                width: '100%',
                                                                boxSizing: 'border-box'
                                                            }}>
                                                                <div className="tt-input-group">
                                                                    <label style={{fontSize: '0.75rem', fontWeight: 600}}>Date</label>
                                                                    <input 
                                                                        type="date" 
                                                                        value={formData.exam_date}
                                                                        onChange={e => setFormData({...formData, exam_date: e.target.value})}
                                                                        className="tt-select"
                                                                        style={{width: '100%', boxSizing: 'border-box'}}
                                                                        required 
                                                                    />
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                                    <div className="tt-input-group">
                                                                        <label style={{fontSize: '0.75rem', fontWeight: 600}}>Start Time</label>
                                                                        <input 
                                                                            type="time" 
                                                                            value={formData.start_time}
                                                                            onChange={e => setFormData({...formData, start_time: e.target.value})}
                                                                            className="tt-select"
                                                                            style={{width: '100%', boxSizing: 'border-box'}}
                                                                            required 
                                                                        />
                                                                    </div>
                                                                    <div className="tt-input-group">
                                                                        <label style={{fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between'}}>
                                                                            End Time 
                                                                            {formData.type && (
                                                                                <span style={{color: '#3b82f6', fontWeight: 600, fontSize: '0.68rem'}}>
                                                                                    (Auto {formData.type === 'Mid Term' ? '1 hr' : '3 hrs'})
                                                                                </span>
                                                                            )}
                                                                        </label>
                                                                        <input 
                                                                            type="time" 
                                                                            value={formData.end_time}
                                                                            readOnly
                                                                            className="tt-select"
                                                                            style={{
                                                                                width: '100%', 
                                                                                boxSizing: 'border-box', 
                                                                                backgroundColor: '#f1f5f9', 
                                                                                color: '#64748b', 
                                                                                cursor: 'not-allowed',
                                                                                border: '1px solid #cbd5e1'
                                                                            }}
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="tt-input-group">
                                                                    <label style={{fontSize: '0.75rem', fontWeight: 600}}>Exam Hall</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="e.g. Exam Hall 1"
                                                                        value={formData.hall}
                                                                        onChange={e => setFormData({...formData, hall: e.target.value})}
                                                                        className="tt-select"
                                                                        style={{width: '100%', boxSizing: 'border-box'}}
                                                                    />
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                                    <div className="tt-input-group">
                                                                        <label style={{fontSize: '0.75rem', fontWeight: 600}}>Number of Benches</label>
                                                                        <input 
                                                                            type="number" 
                                                                            min="1"
                                                                            value={formData.benches}
                                                                            onChange={e => handleBenchesChange(e.target.value)}
                                                                            className="tt-select"
                                                                            style={{width: '100%', boxSizing: 'border-box'}}
                                                                            required 
                                                                        />
                                                                    </div>
                                                                    <div className="tt-input-group">
                                                                        <label style={{fontSize: '0.75rem', fontWeight: 600}}>Students per Bench</label>
                                                                        <input 
                                                                            type="number" 
                                                                            min="1"
                                                                            value={formData.students_per_bench}
                                                                            onChange={e => handleStudentsPerBenchChange(e.target.value)}
                                                                            className="tt-select"
                                                                            style={{width: '100%', boxSizing: 'border-box'}}
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                
                                                                {(formData.benches && formData.students_per_bench) ? (
                                                                    <div style={{
                                                                        fontSize: '0.8rem', 
                                                                        color: '#047857', 
                                                                        backgroundColor: '#d1fae5', 
                                                                        padding: '0.5rem 0.75rem', 
                                                                        borderRadius: '0.5rem',
                                                                        fontWeight: 600,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        border: '1px solid #34d399'
                                                                    }}>
                                                                        <span>Total Hall Capacity:</span>
                                                                        <span>{Number(formData.benches) * Number(formData.students_per_bench)} Students</span>
                                                                    </div>
                                                                ) : null}

                                                                <div className="tt-input-group">
                                                                    <label style={{fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                                        Supervisor
                                                                        {loadingFree && <Loader size={12} className="animate-spin" style={{color: '#3b82f6'}} />}
                                                                        {freeChecked && !loadingFree && (
                                                                            <span style={{
                                                                                fontSize: '0.65rem',
                                                                                padding: '0.1rem 0.4rem',
                                                                                borderRadius: '0.25rem',
                                                                                backgroundColor: freeTeachers.length > 0 ? '#dcfce7' : '#fef2f2',
                                                                                color: freeTeachers.length > 0 ? '#16a34a' : '#dc2626',
                                                                                fontWeight: 700
                                                                            }}>
                                                                                {freeTeachers.length} free / {freeTeachers.length + busyTeachers.length} total
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                    
                                                                    <select
                                                                        value={formData.supervisor}
                                                                        onChange={e => setFormData({...formData, supervisor: e.target.value})}
                                                                        className="tt-select"
                                                                        style={{width: '100%', boxSizing: 'border-box'}}
                                                                    >
                                                                        <option value="">-- Select Teacher --</option>
                                                                        {(() => {
                                                                            let sortedTeachers = [...teachers];
                                                                            if (freeChecked) {
                                                                                sortedTeachers.sort((a, b) => {
                                                                                    const aBusy = busyTeachers.includes(a.teacher_name);
                                                                                    const bBusy = busyTeachers.includes(b.teacher_name);
                                                                                    if (aBusy === bBusy) {
                                                                                        return a.teacher_name.localeCompare(b.teacher_name);
                                                                                    }
                                                                                    return aBusy ? 1 : -1;
                                                                                });
                                                                            }
                                                                            return sortedTeachers.map((t, idx2) => {
                                                                                const name = t.teacher_name;
                                                                                if (freeChecked) {
                                                                                    const isBusy = busyTeachers.includes(name);
                                                                                    return (
                                                                                        <option 
                                                                                            key={`teacher-${idx2}`} 
                                                                                            value={name} 
                                                                                            disabled={isBusy}
                                                                                            style={isBusy ? {color: '#94a3b8'} : {}}
                                                                                        >
                                                                                            {name} {isBusy ? '🚫 (Busy)' : '✅ (Available)'}
                                                                                        </option>
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <option key={`teacher-${idx2}`} value={name}>
                                                                                        {name}
                                                                                    </option>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </select>
                                                                    {!formData.exam_date || !formData.start_time || !formData.end_time ? (
                                                                        <p style={{fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem'}}>
                                                                            Select Date & Time to see which teachers are free
                                                                        </p>
                                                                    ) : freeChecked && freeTeachers.length === 0 ? (
                                                                        <p style={{fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem'}}>
                                                                            ⚠ All teachers have classes/exams during this slot
                                                                        </p>
                                                                    ) : null}
                                                                </div>

                                                                <button 
                                                                    type="submit" 
                                                                    disabled={submitting}
                                                                    className="tt-btn tt-btn-generate"
                                                                    style={{marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem'}}
                                                                >
                                                                    <Plus size={18} />
                                                                    {submitting ? 'Adding...' : 'Add Exam Schedule'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                        </form>
                    </div>

                    {/* List Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '350px' }}>
                        {/* Tab Headers */}
                        <div style={{ 
                            display: 'flex', 
                            borderBottom: '1px solid #e2e8f0', 
                            gap: '1rem',
                            marginBottom: '0.25rem' 
                        }}>
                            <button
                                type="button"
                                onClick={() => setActiveTab('upcoming')}
                                style={{
                                    padding: '0.5rem 0.25rem',
                                    fontSize: '0.9rem',
                                    fontWeight: activeTab === 'upcoming' ? 700 : 500,
                                    color: activeTab === 'upcoming' ? '#3b82f6' : '#64748b',
                                    borderBottom: activeTab === 'upcoming' ? '2px solid #3b82f6' : '2px solid transparent',
                                    background: 'none',
                                    borderTop: 'none',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Upcoming ({exams.filter(e => !isExamCompleted(e)).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                style={{
                                    padding: '0.5rem 0.25rem',
                                    fontSize: '0.9rem',
                                    fontWeight: activeTab === 'history' ? 700 : 500,
                                    color: activeTab === 'history' ? '#3b82f6' : '#64748b',
                                    borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
                                    background: 'none',
                                    borderTop: 'none',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                History ({exams.filter(e => isExamCompleted(e)).length})
                            </button>
                        </div>

                        {/* Filters Bar */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            backgroundColor: '#f8fafc',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            marginBottom: '0.25rem'
                        }}>
                            <div className="tt-input-group" style={{margin: 0}}>
                                <label style={{fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem', display: 'block'}}>Class</label>
                                <select
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                    className="tt-select"
                                    style={{fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: 'auto', width: '100%', boxSizing: 'border-box'}}
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(cls => {
                                        const gradeVal = `${cls.class_name.trim()}${(cls.section || '').trim()}`;
                                        return (
                                            <option key={cls._id} value={gradeVal}>
                                                {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="tt-input-group" style={{margin: 0}}>
                                <label style={{fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem', display: 'block'}}>Date</label>
                                <input 
                                    type="date"
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                    className="tt-select"
                                    style={{fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: 'auto', width: '100%', boxSizing: 'border-box'}}
                                />
                            </div>
                            <div className="tt-input-group" style={{margin: 0}}>
                                <label style={{fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem', display: 'block'}}>Exam Type</label>
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                    className="tt-select"
                                    style={{fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: 'auto', width: '100%', boxSizing: 'border-box'}}
                                >
                                    <option value="All">All Types</option>
                                    <option value="Mid Term">Mid Term</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Half-Yearly">Half-Yearly</option>
                                    <option value="Annual">Annual</option>
                                </select>
                            </div>
                            <div className="tt-input-group" style={{margin: 0}}>
                                <label style={{fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem', display: 'block'}}>Subject</label>
                                <select
                                    value={filterSubject}
                                    onChange={e => setFilterSubject(e.target.value)}
                                    className="tt-select"
                                    style={{fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: 'auto', width: '100%', boxSizing: 'border-box'}}
                                >
                                    <option value="">All Subjects</option>
                                    {[...new Set(exams.map(e => e.subject).filter(Boolean))].sort().map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
{/* Clear All Filters Button */}
<div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
    <button
        type="button"
        onClick={() => {
            setFilterClass('');
            setFilterDate('');
            setFilterType('All');
            setFilterSubject('');
        }}
        style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.75rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.3rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        }}
    >
        Clear All Filters
    </button>
</div>                        
                        {loading ? (
                            <div style={{color: '#64748b', textAlign: 'center', padding: '2rem'}}>Loading...</div>
                        ) : filteredExams.length === 0 ? (
                            <div style={{color: '#64748b', textAlign: 'center', padding: '3rem', border: '1px dashed #cbd5e1', borderRadius: '1rem', fontSize: '0.8rem'}}>
                                {activeTab === 'upcoming' ? 'No upcoming exams found matching filters.' : 'No completed exams found matching filters.'}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                overflowY: 'auto',
                                maxHeight: '350px',
                                paddingRight: '0.25rem'
                            }}>
                                {Object.keys(filteredExams.reduce((acc, exam) => {
                                    const year = exam.exam_date ? new Date(exam.exam_date).getFullYear() : 'Unknown Year';
                                    const key = `Class ${exam.grade} - ${exam.type} - ${year}`;
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(exam);
                                    return acc;
                                }, {})).sort().map(groupKey => {
                                    const groupExams = filteredExams.filter(e => {
                                        const year = e.exam_date ? new Date(e.exam_date).getFullYear() : 'Unknown Year';
                                        return `Class ${e.grade} - ${e.type} - ${year}` === groupKey;
                                    });
                                    groupExams.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

                                    return (
                                        <div key={groupKey} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.75rem',
                                            padding: '1rem',
                                            backgroundColor: '#f8fafc',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem'
                                        }}>
                                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>{groupKey}</h4>
                                            {groupExams.map(exam => (
                                                <div key={exam._id} className="tt-data-item" style={{
                                                    flexDirection: 'row', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    gap: '0.75rem',
                                                    opacity: activeTab === 'history' ? 0.8 : 1,
                                                    borderLeft: activeTab === 'history' ? '4px solid #94a3b8' : '4px solid #3b82f6',
                                                    backgroundColor: activeTab === 'history' ? '#f1f5f9' : '#ffffff',
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1}}>
                                                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center'}}>
                                                            <span style={{
                                                                fontSize: '0.6rem', fontWeight: 'bold',
                                                                padding: '0.15rem 0.4rem',
                                                                backgroundColor: activeTab === 'history' ? '#e2e8f0' : '#fee2e2', 
                                                                color: activeTab === 'history' ? '#475569' : '#ef4444',
                                                                borderRadius: '0.25rem', textTransform: 'uppercase'
                                                            }}>{exam.type}</span>
                                                            {activeTab === 'history' && (
                                                                <span style={{
                                                                    fontSize: '0.6rem', fontWeight: 'bold',
                                                                    padding: '0.15rem 0.4rem',
                                                                    backgroundColor: '#d1fae5', color: '#065f46',
                                                                    borderRadius: '0.25rem'
                                                                }}>Completed</span>
                                                            )}
                                                        </div>
                                                        <strong style={{fontSize: '0.9rem'}}>{exam.subject}</strong>
                                                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.7rem', color: '#64748b'}}>
                                                            <span style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}><Calendar size={11} /> {exam.exam_date}</span>
                                                            <span style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}><Clock size={11} /> {exam.exam_time}</span>
                                                            {exam.hall && <span style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}><MapPin size={11} /> {exam.hall}</span>}
                                                            {exam.supervisor && exam.supervisor !== 'None' && <span style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}><User size={11} /> {exam.supervisor}</span>}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteExam(exam._id)}
                                                        className="tt-btn-delete"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamManagement;
