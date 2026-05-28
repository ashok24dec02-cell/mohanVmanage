import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Search, 
    Filter, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Eye,
    TrendingUp,
    Clock,
    DollarSign,
    CheckCircle,
    X,
    Upload,
    Calendar,
    Briefcase,
    GraduationCap,
    BookOpen,
    MapPin,
    Phone,
    UserCircle,
    Plus,
    XCircle,
    Printer,
    Download
} from 'lucide-react';
import axios from 'axios';
import './staff.css';

const StaffManagement = () => {
    const [activeTab, setActiveTab] = useState('facilities'); // facilities, cleaner, office, class
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);
    const [viewingStaff, setViewingStaff] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [classList, setClassList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Dashboard Stats
    const [stats, setStats] = useState({
        total: 156,
        active: 142,
        attendance: '92%',
        salaryExp: '₹4.2L'
    });

    const BASE_URL = 'http://localhost:8000/api/vadmin';

    useEffect(() => {
        if (activeTab === 'class') {
            fetchClasses();
        } else {
            fetchStaff();
        }
    }, [activeTab]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/staff/?type=${activeTab}`);
            if (response.data.status) {
                setStaffList(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
        setLoading(false);
    };

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/classes/`);
            if (response.data.status) {
                setClassList(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
        setLoading(false);
    };


    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                const response = await axios.delete(`${BASE_URL}/staff/${id}/`);
                if (response.data.status) {
                    fetchStaff();
                }
            } catch (error) {
                console.error('Error deleting staff:', error);
            }
        }
    };

    const filteredStaff = staffList.filter(staff => 
        staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.staff_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="staff-container">
            {/* Header Section */}
            <div className="staff-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Staff Management</h1>
                    <p style={{ color: 'var(--staff-text-dim)' }}>Manage your team across all departments</p>
                </div>
                
                <button className="tab-btn active" style={{ padding: '0.75rem 2rem', background: 'var(--staff-primary)' }} 
                    onClick={() => { 
                        if (activeTab === 'class') {
                            setEditingClass(null); 
                            setIsClassDrawerOpen(true);
                        } else {
                            setEditingStaff(null); 
                            setIsDrawerOpen(true); 
                        }
                    }}>
                    <Plus size={20} /> Add New {activeTab === 'class' ? 'Class' : 'Staff'}
                </button>
            </div>

            {/* Dashboard Mini-Stats */}
            <div className="dashboard-grid">
                <StatCard icon={<Users color="var(--staff-primary)" />} label="Total Staff" value={stats.total} trend="+12 New" />
                <StatCard icon={<CheckCircle color="var(--staff-success)" />} label="Active Staff" value={stats.active} trend="95% Rate" />
                <StatCard icon={<Clock color="var(--staff-warning)" />} label="Today's Attendance" value={stats.attendance} trend="In Progress" />
                <StatCard icon={<DollarSign color="var(--staff-secondary)" />} label="Salary Expense" value={stats.salaryExp} trend="This Month" />
            </div>

            {/* Main Content Card */}
            <div className="glass-card">
                {/* Tabs & Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="staff-tabs">
                        <TabButton id="facilities" active={activeTab} set={setActiveTab} label="Facilities Staff" icon={<Users size={18} />} />
                        <TabButton id="cleaner" active={activeTab} set={setActiveTab} label="Cleaner Staff" icon={<Briefcase size={18} />} />
                        <TabButton id="office" active={activeTab} set={setActiveTab} label="Office Staff" icon={<BookOpen size={18} />} />
                        <TabButton id="class" active={activeTab} set={setActiveTab} label="Class" icon={<GraduationCap size={18} />} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--staff-text-dim)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by name or ID..." 
                                style={{ padding: '0.75rem 1rem 0.75rem 2.8rem', background: 'var(--staff-sidebar)', border: '1px solid var(--staff-border)', borderRadius: '0.75rem', color: 'white', width: '250px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="icon-btn" title="Export PDF"><Download size={18} /></button>
                        <button className="icon-btn" title="Print"><Printer size={18} /></button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="staff-table-container">
                    {activeTab === 'class' ? (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Class Name</th>
                                    <th>Block Name</th>
                                    <th>Incharge Name</th>
                                    <th>Subjects & Teachers</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Loading records...</td></tr>
                                ) : classList.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>No class records found.</td></tr>
                                ) : classList.map((cls, index) => (
                                    <tr key={index}>
                                        <td><div style={{ fontWeight: 700 }}>{cls.class_name}</div></td>
                                        <td>{cls.block_name}</td>
                                        <td>{cls.incharge_name || 'N/A'}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {cls.subjects && cls.subjects.length > 0 ? (
                                                    cls.subjects.map((sub, i) => (
                                                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--staff-text-dim)' }}>
                                                            <span style={{ color: 'white', fontWeight: 600 }}>{sub.subject_name}</span>: {sub.teacher_name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--staff-text-dim)', fontStyle: 'italic' }}>No subjects added</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="icon-btn" onClick={() => { setEditingClass(cls); setIsClassDrawerOpen(true); }}><Edit size={16} /></button>
                                                <button className="icon-btn" style={{ color: 'var(--staff-danger)' }} onClick={async () => {
                                                    if (window.confirm('Delete this class?')) {
                                                        await axios.delete(`${BASE_URL}/classes/${cls._id}/`);
                                                        fetchClasses();
                                                    }
                                                }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Staff Profile</th>
                                    <th>Category</th>
                                    <th>Department</th>
                                    {activeTab === 'facilities' && <th>Class Incharge</th>}
                                    <th>Monthly Salary</th>
                                    <th>Joining Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={activeTab === 'facilities' ? 8 : 7} style={{ textAlign: 'center', padding: '3rem' }}>Loading records...</td></tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr><td colSpan={activeTab === 'facilities' ? 8 : 7} style={{ textAlign: 'center', padding: '3rem' }}>No staff records found.</td></tr>
                                ) : filteredStaff.map((staff, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="staff-profile">
                                                <div className="staff-avatar">
                                                    {staff.fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{staff.fullName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--staff-text-dim)' }}>{staff.staff_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{staff.staffCategory || 'N/A'}</td>
                                        <td>{staff.department || 'N/A'}</td>
                                        {activeTab === 'facilities' && (
                                            <td>
                                                <span style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    background: staff.classTeacher ? 'rgba(99, 102, 241, 0.1)' : 'transparent', 
                                                    border: staff.classTeacher ? '1px solid var(--staff-primary)' : '1px solid var(--staff-border)',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    color: staff.classTeacher ? 'var(--staff-primary)' : 'var(--staff-text-dim)'
                                                }}>
                                                    {staff.classTeacher || 'Not Assigned'}
                                                </span>
                                            </td>
                                        )}
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--staff-success)' }}>₹{staff.monthlySalary || '0'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--staff-text-dim)' }}>₹{staff.salaryPerDay}/day</div>
                                        </td>
                                        <td>{staff.joiningDate || '---'}</td>
                                        <td>
                                            <span className={`status-badge ${staff.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                                {staff.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="icon-btn" onClick={() => { setEditingStaff(staff); setIsDrawerOpen(true); }}><Edit size={16} /></button>
                                                <button className="icon-btn" style={{ color: 'var(--staff-danger)' }} onClick={() => handleDelete(staff._id)}><Trash2 size={16} /></button>
                                                <button className="icon-btn" onClick={() => setViewingStaff(staff)}><Eye size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Drawer */}
            {isDrawerOpen && (
                <StaffDrawer 
                    isOpen={isDrawerOpen} 
                    onClose={() => setIsDrawerOpen(false)} 
                    activeTab={activeTab} 
                    refresh={fetchStaff}
                    editingStaff={editingStaff}
                />
            )}

            {/* Class Drawer */}
            {isClassDrawerOpen && (
                <ClassDrawer
                    isOpen={isClassDrawerOpen}
                    onClose={() => setIsClassDrawerOpen(false)}
                    refresh={fetchClasses}
                    editingClass={editingClass}
                />
            )}

            {/* View Details Drawer */}
            {viewingStaff && (
                <StaffDetailsDrawer 
                    staff={viewingStaff} 
                    onClose={() => setViewingStaff(null)} 
                />
            )}

        </div>
    );
};

const StatCard = ({ icon, label, value, trend }) => (
    <div className="glass-card stat-item">
        <div className="stat-icon-box">{icon}</div>
        <div className="stat-info">
            <h3>{label}</h3>
            <div className="stat-value">{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--staff-success)', marginTop: '0.25rem' }}>{trend}</div>
        </div>
    </div>
);

const TabButton = ({ id, active, set, label, icon }) => (
    <button className={`tab-btn ${active === id ? 'active' : ''}`} onClick={() => set(id)}>
        {icon} {label}
    </button>
);

const StaffDrawer = ({ isOpen, onClose, activeTab, refresh, editingStaff }) => {
    const [formData, setFormData] = useState(() => {
        const defaults = {
            fullName: '',
            dob: '',
            phone: '',
            altPhone: '',
            gender: '',
            address: '',
            department: '',
            degree: '',
            classTeacher: '',
            handleClasses: '',
            salaryPerDay: '',
            workingDays: '26',
            monthlySalary: '',
            staffCategory: '',
            username: '',
            password: '',
            confirmPassword: '',
            joiningDate: '',
            status: 'Active',
            staff_category_group: activeTab
        };
        return editingStaff ? { ...defaults, ...editingStaff, staff_category_group: activeTab } : defaults;
    });

    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchClasses();
        // editingStaff initialization moved to useState to ensure synchronous population
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/vadmin/classes/');
            if (response.data.status) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Availability Check for Class Teacher assignment
        if (name === 'classTeacher' && value) {
            const classObj = classes.find(c => c.class_name === value);
            if (classObj && classObj.incharge_name) {
                // If this is an existing staff and they are already the incharge of this class, it's fine
                if (editingStaff && classObj.incharge_id === editingStaff._id) {
                    // No alert needed
                } else {
                    const confirmChange = window.confirm(`Class ${value} is already handled by ${classObj.incharge_name}. Do you want to reassign ${formData.fullName || 'this staff'} as the new incharge?`);
                    if (!confirmChange) {
                        setFormData(prev => ({ ...prev, classTeacher: prev.classTeacher || '' }));
                        return;
                    }
                }
            }
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'salaryPerDay' || name === 'workingDays') {
                const spd = parseFloat(name === 'salaryPerDay' ? value : prev.salaryPerDay) || 0;
                const wd = parseFloat(name === 'workingDays' ? value : prev.workingDays) || 0;
                newData.monthlySalary = (spd * wd).toString();
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingStaff 
                ? `http://localhost:8000/api/vadmin/staff/${editingStaff._id}/`
                : 'http://localhost:8000/api/vadmin/staff/';
            
            const method = editingStaff ? 'put' : 'post';
            const response = await axios[method](url, formData);
            
            if (response.data.status) {
                alert(editingStaff ? 'Staff updated successfully!' : 'Staff added successfully!');
                refresh();
                onClose();
            }
        } catch (error) {
            console.error('Error saving staff:', error);
            alert(error.response?.data?.message || 'Failed to save staff record');
        }
    };

    return (
        <div className="staff-drawer-overlay" onClick={onClose}>
            <div className="staff-drawer" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{editingStaff ? 'Edit' : 'Add New'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Staff</h2>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="staff-form-grid">
                        <div className="input-group full-width">
                            <label>Full Name</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter full name" />
                        </div>
                        <div className="input-group">
                            <label>Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} required>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Primary contact" />
                        </div>
                        <div className="input-group">
                            <label>Alternate Number</label>
                            <input type="tel" name="altPhone" value={formData.altPhone} onChange={handleChange} placeholder="Optional" />
                        </div>
                        
                        <div className="input-group full-width">
                            <label>Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows="2" placeholder="Full residential address"></textarea>
                        </div>

                        {activeTab === 'facilities' && (
                            <>
                                <div className="input-group">
                                    <label>Staff Category</label>
                                    <select name="staffCategory" value={formData.staffCategory} onChange={handleChange} required>
                                        <option value="">Select</option>
                                        <option value="HM">HM</option>
                                        <option value="AHM">AHM</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="PET">PET</option>
                                        <option value="Coordinator">Coordinator</option>
                                        <option value="Lab Staff">Lab Staff</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Department</label>
                                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="E.g. Science, Maths" />
                                </div>
                                <div className="input-group">
                                    <label>Completed Degree</label>
                                    <input type="text" name="degree" value={formData.degree} onChange={handleChange} placeholder="B.Ed, M.Sc etc" />
                                </div>
                                <div className="input-group">
                                    <label>Class Teacher Of</label>
                                    <select name="classTeacher" value={formData.classTeacher} onChange={handleChange}>
                                        <option value="">Select Class</option>
                                        {classes.map(cls => (
                                            <option key={cls._id} value={cls.class_name}>{cls.class_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group full-width">
                                    <label>Available Classes (Reference)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {classes.map(cls => (
                                            <span key={cls._id} style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', fontSize: '0.8rem', border: '1px solid var(--staff-border)' }}>
                                                {cls.class_name} ({cls.block_name})
                                            </span>
                                        ))}
                                        {classes.length === 0 && <span style={{ color: 'var(--staff-text-dim)', fontSize: '0.8rem' }}>No classes added yet.</span>}
                                    </div>
                                </div>
                            </>

                        )}

                        <div className="input-group">
                            <label>Salary Per Day (₹)</label>
                            <input type="number" name="salaryPerDay" value={formData.salaryPerDay || ''} onChange={handleChange} required placeholder="0.00" />
                        </div>
                        <div className="input-group">
                            <label>Working Days</label>
                            <input type="number" name="workingDays" value={formData.workingDays || ''} onChange={handleChange} required />
                        </div>
                        <div className="input-group full-width" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed var(--staff-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>Estimated Monthly Salary</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--staff-success)' }}>₹{formData.monthlySalary || '0'}</span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Username</label>
                            <input type="text" name="username" value={formData.username || ''} onChange={handleChange} required placeholder="Login username" />
                        </div>
                        <div className="input-group">
                            <label>Joining Date</label>
                            <input type="date" name="joiningDate" value={formData.joiningDate || ''} onChange={handleChange} required />
                        </div>
                        
                        <div className="input-group">
                            <label>Password {editingStaff && <span style={{fontSize: '0.75rem', color: 'var(--staff-text-dim)', fontWeight: 'normal'}}>(Leave blank to keep unchanged)</span>}</label>
                            <input type="password" name="password" value={formData.password || ''} onChange={handleChange} required={!editingStaff} placeholder="••••••••" />
                        </div>
                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword || ''} onChange={handleChange} required={!editingStaff && !!formData.password} placeholder="••••••••" />
                        </div>

                        <div className="input-group full-width">
                            <label>Profile Photo</label>
                            <div style={{ border: '2px dashed var(--staff-border)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', cursor: 'pointer' }}>
                                <Upload size={24} style={{ marginBottom: '0.5rem', color: 'var(--staff-text-dim)' }} />
                                <div style={{ fontSize: '0.875rem', color: 'var(--staff-text-dim)' }}>Click to upload profile photo</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="tab-btn active" style={{ flex: 1, padding: '1rem', background: 'var(--staff-primary)' }}>
                            {editingStaff ? 'Update Records' : 'Save Staff Details'}
                        </button>
                        <button type="button" className="tab-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ClassDrawer = ({ isOpen, onClose, refresh, editingClass }) => {
    const [formData, setFormData] = useState({
        class_name: '',
        block_name: '',
        incharge_id: '',
        incharge_name: '',
        staff_id: '',
        subjects: []
    });
    const [facilityStaff, setFacilityStaff] = useState([]);

    useEffect(() => {
        fetchFacilityStaff();
        if (editingClass) {
            setFormData({
                ...editingClass,
                subjects: editingClass.subjects || []
            });
        } else {
            setFormData({
                class_name: '',
                block_name: '',
                incharge_id: '',
                incharge_name: '',
                staff_id: '',
                subjects: []
            });
        }
    }, [editingClass]);

    const fetchFacilityStaff = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/vadmin/staff/?type=facilities');
            if (response.data.status) {
                setFacilityStaff(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching facility staff:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'incharge_id') {
            const selectedStaff = facilityStaff.find(s => s._id === value);
            
            // Availability Check
            if (selectedStaff && selectedStaff.classTeacher && selectedStaff.classTeacher !== 'Not Assigned') {
                // Check if they are already the teacher of THIS class (important for Edit mode)
                const isCurrentIncharge = editingClass && selectedStaff.classTeacher === editingClass.class_name;
                
                if (!isCurrentIncharge) {
                    const confirmChange = window.confirm(`Staff member ${selectedStaff.fullName} is already assigned to ${selectedStaff.classTeacher}. Do you want to reassign them to this class anyway?`);
                    
                    if (!confirmChange) {
                        // Reset selection
                        setFormData(prev => ({
                            ...prev,
                            incharge_id: '',
                            incharge_name: '',
                            staff_id: ''
                        }));
                        return;
                    }
                }
            }

            setFormData(prev => ({
                ...prev,
                incharge_id: value,
                incharge_name: selectedStaff ? selectedStaff.fullName : '',
                staff_id: selectedStaff ? selectedStaff.staff_id : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddSubject = () => {
        setFormData(prev => ({
            ...prev,
            subjects: [...(prev.subjects || []), { subject_name: '', teacher_id: '', teacher_name: '' }]
        }));
    };

    const handleRemoveSubject = (index) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter((_, i) => i !== index)
        }));
    };

    const handleSubjectChange = (index, field, value) => {
        const updatedSubjects = [...formData.subjects];
        if (field === 'teacher_id') {
            const teacher = facilityStaff.find(s => s._id === value);
            updatedSubjects[index].teacher_id = value;
            updatedSubjects[index].teacher_name = teacher ? teacher.fullName : '';
        } else {
            updatedSubjects[index][field] = value;
        }
        setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingClass 
                ? `http://localhost:8000/api/vadmin/classes/${editingClass._id}/`
                : 'http://localhost:8000/api/vadmin/classes/';
            
            const method = editingClass ? 'put' : 'post';
            const response = await axios[method](url, formData);
            
            if (response.data.status) {
                alert(editingClass ? 'Class updated successfully!' : 'Class added successfully!');
                refresh();
                onClose();
            }
        } catch (error) {
            console.error('Error saving class:', error);
            alert(error.response?.data?.message || 'Failed to save class record');
        }
    };

    return (
        <div className="staff-drawer-overlay" onClick={onClose}>
            <div className="staff-drawer" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{editingClass ? 'Edit' : 'Add New'} Class</h2>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="staff-form-grid">
                        <div className="input-group full-width">
                            <label>Class Name</label>
                            <input type="text" name="class_name" value={formData.class_name} onChange={handleChange} required placeholder="E.g. 10-A, 1st Grade" />
                        </div>
                        <div className="input-group full-width">
                            <label>Block Name</label>
                            <input type="text" name="block_name" value={formData.block_name} onChange={handleChange} required placeholder="E.g. Primary Block, High School Block" />
                        </div>
                        <div className="input-group full-width">
                            <label>Class Incharge</label>
                            <select name="incharge_id" value={formData.incharge_id} onChange={handleChange} required>
                                <option value="">Select Incharge</option>
                                {facilityStaff.map(staff => (
                                    <option key={staff._id} value={staff._id}>{staff.fullName} ({staff.staff_id})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Subjects & Teachers</h3>
                            <button type="button" className="icon-btn" style={{ background: 'var(--staff-primary)', color: 'white', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', width: 'auto' }} onClick={handleAddSubject}>
                                <Plus size={16} /> Add Subject
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formData.subjects && formData.subjects.map((sub, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--staff-border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '1.5rem', alignItems: 'flex-end' }}>
                                        <div className="input-group">
                                            <label>Subject Name</label>
                                            <input 
                                                type="text" 
                                                value={sub.subject_name} 
                                                onChange={(e) => handleSubjectChange(index, 'subject_name', e.target.value)} 
                                                placeholder="E.g. Mathematics" 
                                                required 
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Teacher</label>
                                            <select 
                                                value={sub.teacher_id} 
                                                onChange={(e) => handleSubjectChange(index, 'teacher_id', e.target.value)} 
                                                required
                                            >
                                                <option value="">Select Teacher</option>
                                                {facilityStaff.map(staff => (
                                                    <option key={staff._id} value={staff._id}>
                                                        {staff.fullName} {staff.department ? `(${staff.department})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button type="button" className="icon-btn" style={{ color: 'var(--staff-danger)', marginBottom: '0.5rem' }} onClick={() => handleRemoveSubject(index)}>
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!formData.subjects || formData.subjects.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed var(--staff-border)', color: 'var(--staff-text-dim)', fontSize: '0.9rem' }}>
                                    No subjects assigned to this class yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="tab-btn active" style={{ flex: 1, padding: '1rem', background: 'var(--staff-primary)' }}>
                            {editingClass ? 'Update Class' : 'Save Class'}
                        </button>
                        <button type="button" className="tab-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StaffDetailsDrawer = ({ staff, onClose }) => {
    return (
        <div className="staff-drawer-overlay" onClick={onClose}>
            <div className="staff-drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="staff-avatar" style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                            {staff.fullName?.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{staff.fullName}</h2>
                            <p style={{ color: 'var(--staff-text-dim)' }}>{staff.staff_id} • {staff.staffCategory || 'Staff'}</p>
                        </div>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <DetailItem label="Full Name" value={staff.fullName} />
                    <DetailItem label="Staff ID" value={staff.staff_id} />
                    <DetailItem label="Category" value={staff.staffCategory} />
                    <DetailItem label="Department" value={staff.department} />
                    <DetailItem label="Phone" value={staff.phone} />
                    <DetailItem label="Alt Phone" value={staff.altPhone || '---'} />
                    <DetailItem label="Email/Username" value={staff.username} />
                    <DetailItem label="Gender" value={staff.gender} />
                    <DetailItem label="DOB" value={staff.dob} />
                    <DetailItem label="Joining Date" value={staff.joiningDate} />
                    <DetailItem label="Degree" value={staff.degree || '---'} />
                    <DetailItem label="Class Teacher" value={staff.classTeacher || 'None'} />
                    <DetailItem label="Salary Per Day" value={`₹${staff.salaryPerDay}`} />
                    <DetailItem label="Monthly Salary" value={`₹${staff.monthlySalary}`} color="var(--staff-success)" />
                    <DetailItem label="Status" value={staff.status} color={staff.status === 'Active' ? 'var(--staff-success)' : 'var(--staff-danger)'} />
                    <DetailItem label="Address" value={staff.address} fullWidth />
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--staff-border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Quick Actions</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="tab-btn active" style={{ flex: 1, background: 'var(--staff-secondary)' }}>
                            <Printer size={18} /> Print Profile
                        </button>
                        <button className="tab-btn active" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                            <Calendar size={18} /> View Attendance
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, color, fullWidth }) => (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'span 1' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--staff-text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: color || 'white' }}>{value || '---'}</div>
    </div>
);

export default StaffManagement;
