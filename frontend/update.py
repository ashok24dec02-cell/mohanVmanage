import re

file_path = 'src/admin/staff_management/StaffManagement.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add states
code = code.replace(
    'const [editingClass, setEditingClass] = useState(null);',
    'const [editingClass, setEditingClass] = useState(null);\n    const [isSubjectDrawerOpen, setIsSubjectDrawerOpen] = useState(false);\n    const [selectedClassForSubject, setSelectedClassForSubject] = useState(\'\');\n    const [editingSubject, setEditingSubject] = useState(null);'
)

# 2. Add useEffect logic
code = code.replace(
    'if (activeTab === \'class\') {',
    'if (activeTab === \'class\' || activeTab === \'subject\') {'
)

# 3. Update 'Add New' button
old_add_btn = '''                <button className="tab-btn active" style={{ padding: '0.75rem 2rem', background: 'var(--staff-primary)' }} 
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
                </button>'''

new_add_btn = '''                <button className="tab-btn active" style={{ padding: '0.75rem 2rem', background: 'var(--staff-primary)' }} 
                    onClick={() => { 
                        if (activeTab === 'class') {
                            setEditingClass(null); 
                            setIsClassDrawerOpen(true);
                        } else if (activeTab === 'subject') {
                            setEditingSubject(null);
                            setIsSubjectDrawerOpen(true);
                        } else {
                            setEditingStaff(null); 
                            setIsDrawerOpen(true); 
                        }
                    }}>
                    <Plus size={20} /> Add New {activeTab === 'class' ? 'Class' : activeTab === 'subject' ? 'Subject' : 'Staff'}
                </button>'''
code = code.replace(old_add_btn, new_add_btn)

# 4. Add Tab Button
code = code.replace(
    '<TabButton id="class" active={activeTab} set={setActiveTab} label="Class" icon={<GraduationCap size={18} />} />',
    '<TabButton id="class" active={activeTab} set={setActiveTab} label="Class" icon={<GraduationCap size={18} />} />\n                        <TabButton id="subject" active={activeTab} set={setActiveTab} label="Subjects" icon={<BookOpen size={18} />} />'
)

# 5. Table rendering logic
old_table_start = """                {/* Table Section */}
                <div className="staff-table-container">
                    {activeTab === 'class' ? ("""
new_table_start = """                {/* Table Section */}
                <div className="staff-table-container">
                    {activeTab === 'subject' ? (
                        <div className="subject-view-container" style={{ padding: '1rem' }}>
                            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ fontWeight: 600, color: 'var(--staff-text-main)' }}>Select Class to View Subjects:</label>
                                <select 
                                    value={selectedClassForSubject} 
                                    onChange={(e) => setSelectedClassForSubject(e.target.value)}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--staff-border)', background: 'var(--staff-sidebar)', color: 'white', minWidth: '200px' }}
                                >
                                    <option value="">-- Select Class --</option>
                                    {classList.map(c => <option key={c._id} value={c._id}>{c.class_name}</option>)}
                                </select>
                            </div>
                            
                            {selectedClassForSubject ? (
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Subject Name</th>
                                            <th>Teacher</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const selectedCls = classList.find(c => c._id === selectedClassForSubject);
                                            if (!selectedCls || !selectedCls.subjects || selectedCls.subjects.length === 0) {
                                                return <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>No subjects found for this class.</td></tr>;
                                            }
                                            return selectedCls.subjects.map((sub, idx) => (
                                                <tr key={idx}>
                                                    <td><div style={{ fontWeight: 700 }}>{sub.subject_name}</div></td>
                                                    <td>{sub.teacher_name || 'Unassigned'}</td>
                                                    <td>
                                                        <div className="action-btns">
                                                            <button className="icon-btn" style={{ color: 'var(--staff-danger)' }} onClick={async () => {
                                                                if(window.confirm('Delete this subject from class?')) {
                                                                    const updatedSubjects = selectedCls.subjects.filter((_, i) => i !== idx);
                                                                    await axios.put(`http://localhost:8000/api/vadmin/classes/${selectedCls._id}/`, { ...selectedCls, subjects: updatedSubjects });
                                                                    window.location.reload();
                                                                }
                                                            }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--staff-text-dim)' }}>
                                    <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <h3>Please select a class to view its subjects</h3>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'class' ? ("""
code = code.replace(old_table_start, new_table_start)

# 6. Render SubjectDrawer
drawer_code = """            {/* Subject Drawer */}
            {isSubjectDrawerOpen && (
                <SubjectDrawer
                    isOpen={isSubjectDrawerOpen}
                    onClose={() => setIsSubjectDrawerOpen(false)}
                    refresh={() => window.location.reload()}
                    classList={classList}
                />
            )}
"""
code = code.replace('            {/* View Details Drawer */}', drawer_code + '            {/* View Details Drawer */}')


# 7. Add SubjectDrawer component
subject_drawer_comp = """
const SubjectDrawer = ({ isOpen, onClose, refresh, classList }) => {
    const [formData, setFormData] = useState({ class_id: '', subject_name: '', teacher_id: '', teacher_name: '' });
    const [facilityStaff, setFacilityStaff] = useState([]);

    useEffect(() => {
        const fetchFacilityStaff = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/vadmin/staff/?type=facilities');
                if (response.data.status) setFacilityStaff(response.data.data);
            } catch (error) {}
        };
        fetchFacilityStaff();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedCls = classList.find(c => c._id === formData.class_id);
        if (!selectedCls) return alert('Invalid class');
        
        const newSubject = { 
            subject_name: formData.subject_name, 
            teacher_id: formData.teacher_id, 
            teacher_name: formData.teacher_name 
        };
        
        const updatedSubjects = [...(selectedCls.subjects || []), newSubject];
        
        try {
            const response = await axios.put(`http://localhost:8000/api/vadmin/classes/${selectedCls._id}/`, { ...selectedCls, subjects: updatedSubjects });
            if (response.data.status) {
                alert('Subject added successfully!');
                refresh();
                onClose();
            }
        } catch (error) {
            alert('Failed to add subject');
        }
    };

    return (
        <div className="staff-drawer-overlay" onClick={onClose}>
            <div className="staff-drawer" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Add New Subject</h2>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="staff-form-grid">
                        <div className="input-group full-width">
                            <label>Target Class</label>
                            <select value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} required>
                                <option value="">Select Class</option>
                                {classList.map(c => <option key={c._id} value={c._id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div className="input-group full-width">
                            <label>Subject Name</label>
                            <input type="text" value={formData.subject_name} onChange={e => setFormData({...formData, subject_name: e.target.value})} required placeholder="E.g. Mathematics" />
                        </div>
                        <div className="input-group full-width">
                            <label>Assign Teacher</label>
                            <select value={formData.teacher_id} onChange={e => {
                                const teacher = facilityStaff.find(s => s._id === e.target.value);
                                setFormData({...formData, teacher_id: e.target.value, teacher_name: teacher ? teacher.fullName : ''});
                            }} required>
                                <option value="">Select Teacher</option>
                                {facilityStaff.map(staff => <option key={staff._id} value={staff._id}>{staff.fullName} ({staff.staff_id})</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="tab-btn active" style={{ flex: 1, padding: '1rem', background: 'var(--staff-primary)' }}>Save Subject</button>
                        <button type="button" className="tab-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

"""
code = code.replace('export default StaffManagement;', subject_drawer_comp + 'export default StaffManagement;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)
print('Done processing')
