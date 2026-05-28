import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, Plus, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { teacherAPI, subjectAPI, classAPI } from '../services/api';

const DataManagement = ({ onClose, onDataChange }) => {
    const [activeTab, setActiveTab] = useState('teachers');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Data States
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);

    // Form States
    const [newTeacher, setNewTeacher] = useState({ teacher_name: '', subjects: [], department: '', mobile_number: '', max_periods_per_day: 5 });
    const [newSubject, setNewSubject] = useState({ subject_name: '', subject_code: '', weekly_periods: 5 });
    const [newClass, setNewClass] = useState({ class_name: '', section: '', room_number: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, sRes, cRes] = await Promise.all([
                teacherAPI.getAll(),
                subjectAPI.getAll(),
                classAPI.getAll()
            ]);
            setTeachers(tRes.data);
            setSubjects(sRes.data);
            setClasses(cRes.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacher = async () => {
        if (!newTeacher.teacher_name) return;
        try {
            await teacherAPI.create(newTeacher);
            setNewTeacher({ teacher_name: '', subjects: [], department: '', mobile_number: '', max_periods_per_day: 5 });
            fetchData();
            onDataChange();
        } catch (err) { setError('Failed to add teacher'); }
    };

    const handleAddSubject = async () => {
        if (!newSubject.subject_name) return;
        try {
            await subjectAPI.create(newSubject);
            setNewSubject({ subject_name: '', subject_code: '', weekly_periods: 5 });
            fetchData();
            onDataChange();
        } catch (err) { setError('Failed to add subject'); }
    };

    const handleAddClass = async () => {
        if (!newClass.class_name) return;
        try {
            await classAPI.create(newClass);
            setNewClass({ class_name: '', section: '', room_number: '' });
            fetchData();
            onDataChange();
        } catch (err) { setError('Failed to add class'); }
    };

    const handleDelete = async (type, id) => {
        try {
            if (type === 'teacher') await teacherAPI.delete(id);
            if (type === 'subject') await subjectAPI.delete(id);
            if (type === 'class') await classAPI.delete(id);
            fetchData();
            onDataChange();
        } catch (err) { setError('Delete failed'); }
    };

    return (
        <div className="tt-modal-overlay">
            <div className="tt-modal-content tt-settings-glass">
                <div className="tt-modal-header">
                    <h2><Layers size={24} color="#8b5cf6" /> Timetable Data Management</h2>
                    <button onClick={onClose} className="tt-btn-close"><X size={24} /></button>
                </div>

                <div className="tt-modal-tabs">
                    <button onClick={() => setActiveTab('teachers')} className={activeTab === 'teachers' ? 'active' : ''}><Users size={18}/> Teachers</button>
                    <button onClick={() => setActiveTab('subjects')} className={activeTab === 'subjects' ? 'active' : ''}><BookOpen size={18}/> Subjects</button>
                    <button onClick={() => setActiveTab('classes')} className={activeTab === 'classes' ? 'active' : ''}><Layers size={18}/> Classes</button>
                </div>

                <div className="tt-modal-body">
                    {error && <div className="tt-alert tt-alert-clash"><AlertCircle size={18}/> {error}</div>}

                    {activeTab === 'teachers' && (
                        <div className="tt-data-section">
                            <div className="tt-add-form">
                                <input placeholder="Teacher Name" value={newTeacher.teacher_name} onChange={e => setNewTeacher({...newTeacher, teacher_name: e.target.value})} />
                                <input placeholder="Subjects (comma separated)" value={newTeacher.subjects.join(', ')} onChange={e => setNewTeacher({...newTeacher, subjects: e.target.value.split(',').map(s => s.trim())})} />
                                <input placeholder="Max Periods/Day" type="number" value={newTeacher.max_periods_per_day} onChange={e => setNewTeacher({...newTeacher, max_periods_per_day: e.target.value})} />
                                <button onClick={handleAddTeacher} className="tt-btn-add"><Plus size={18}/> Add</button>
                            </div>
                            <div className="tt-data-list">
                                {teachers.map(t => (
                                    <div key={t._id} className="tt-data-item">
                                        <div>
                                            <strong>{t.teacher_name}</strong>
                                            <span>{t.subjects.join(', ')} | Max: {t.max_periods_per_day}</span>
                                        </div>
                                        <button onClick={() => handleDelete('teacher', t._id)} className="tt-btn-delete"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div className="tt-data-section">
                            <div className="tt-add-form">
                                <input placeholder="Subject Name" value={newSubject.subject_name} onChange={e => setNewSubject({...newSubject, subject_name: e.target.value})} />
                                <input placeholder="Code" value={newSubject.subject_code} onChange={e => setNewSubject({...newSubject, subject_code: e.target.value})} />
                                <input placeholder="Weekly Periods" type="number" value={newSubject.weekly_periods} onChange={e => setNewSubject({...newSubject, weekly_periods: e.target.value})} />
                                <button onClick={handleAddSubject} className="tt-btn-add"><Plus size={18}/> Add</button>
                            </div>
                            <div className="tt-data-list">
                                {subjects.map(s => (
                                    <div key={s._id} className="tt-data-item">
                                        <div>
                                            <strong>{s.subject_name} ({s.subject_code})</strong>
                                            <span>{s.weekly_periods} periods/week</span>
                                        </div>
                                        <button onClick={() => handleDelete('subject', s._id)} className="tt-btn-delete"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'classes' && (
                        <div className="tt-data-section">
                            <div className="tt-add-form">
                                <input placeholder="Class (e.g. 10th)" value={newClass.class_name} onChange={e => setNewClass({...newClass, class_name: e.target.value})} />
                                <input placeholder="Section" value={newClass.section} onChange={e => setNewClass({...newClass, section: e.target.value})} />
                                <input placeholder="Room Number" value={newClass.room_number} onChange={e => setNewClass({...newClass, room_number: e.target.value})} />
                                <button onClick={handleAddClass} className="tt-btn-add"><Plus size={18}/> Add</button>
                            </div>
                            <div className="tt-data-list">
                                {classes.map(c => (
                                    <div key={c._id} className="tt-data-item">
                                        <div>
                                            <strong>{c.class_name} - {c.section}</strong>
                                            <span>Room: {c.room_number}</span>
                                        </div>
                                        <button onClick={() => handleDelete('class', c._id)} className="tt-btn-delete"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
