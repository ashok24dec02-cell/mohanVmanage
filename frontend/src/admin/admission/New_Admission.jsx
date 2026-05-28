import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, 
    Filter, 
    User, 
    Phone, 
    Mail, 
    Calendar,
    GraduationCap,
    CheckCircle,
    XCircle,
    Eye,
    X,
    MapPin,
    Users as UsersIcon,
    Briefcase,
    Info,
    CreditCard,
    Smartphone,
    Building2,
    FileText,
    KeyRound,
    EyeOff,
    Check,
    Printer,
    Download,
    MessageSquare,
    Send,
    Loader2,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import './New_Admission.css';

const New_Admission = () => {
    const navigate = useNavigate();
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const fetchAdmissions = async () => {
        try {
            const response = await axios.get(`${config.BASE_URL}/vadmin/admission/`);
            if (response.data.status) {
                const filteredData = response.data.data.filter(item => 
                    item.status === 'applied' || 
                    item.status === 'Pending Payment' || 
                    item.status === 'Approved'
                );
                setAdmissions(filteredData);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching admissions:', error);
            setLoading(false);
        }
    };

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleApproveClick = (student) => {
        setSelectedStudent(student);
        setShowApprovalModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowApprovalModal(false);
        setSelectedStudent(null);
        fetchAdmissions(); // Refresh data
    };

    const filteredAdmissions = admissions.filter(student => 
        (student.firstName + ' ' + student.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phoneNumber?.includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="new-admission-container">
            <header className="page-header">
                <div className="header-text">
                    <h1>Admission Management</h1>
                    <p>Review and process student applications across all stages</p>
                </div>
                <div className="header-stats">
                    <div className="stat-pill">
                        <span className="pill-count">{filteredAdmissions.length}</span>
                        <span className="pill-label">Total Records</span>
                    </div>
                </div>
            </header>

            <div className="table-actions">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by name, email or phone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="status-filters">
                    <StatusFilter label="New" count={admissions.filter(a => a.status === 'applied').length} color="#6366f1" />
                    <StatusFilter label="Pending Payment" count={admissions.filter(a => a.status === 'Pending Payment').length} color="#f59e0b" />
                    <StatusFilter label="Approved" count={admissions.filter(a => a.status === 'Approved').length} color="#22c55e" />
                </div>
            </div>

            <div className="admission-table-wrapper">
                {loading ? (
                    <div className="loader">
                        <Loader2 className="animate-spin" size={32} />
                        <p>Loading applications...</p>
                    </div>
                ) : (
                    <table className="admission-table">
                        <thead>
                            <tr>
                                <th>Student Details</th>
                                <th>Grade</th>
                                <th>Contact Info</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmissions.length > 0 ? (
                                filteredAdmissions.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <div className="student-cell">
                                                <div className="student-avatar" style={{ background: getStatusColor(student.status) }}>
                                                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                                </div>
                                                <div className="student-info">
                                                    <span className="student-name">{student.firstName} {student.lastName}</span>
                                                    <span className="student-id-small">{student.admission_id || 'ID Pending'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="grade-pill">
                                                <GraduationCap size={14} />
                                                Grade {student.applyingForGrade}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <div className="info-item"><Phone size={14} /> {student.phoneNumber}</div>
                                                <div className="info-item"><Mail size={14} /> {student.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${student.status.toLowerCase().replace(' ', '-')}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="view-btn" title="View Details" onClick={() => handleViewDetails(student)}>
                                                    <Eye size={18} />
                                                </button>
                                                {student.status !== 'Approved' && (
                                                    <button className="approve-btn" title="Approve Admission" onClick={() => handleApproveClick(student)}>
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button className="reject-btn" title="Reject"><XCircle size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-data">No records matching your search</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Standard Detail Modal */}
            {showModal && selectedStudent && <StudentDetailModal student={selectedStudent} onClose={closeModal} />}

            {/* Comprehensive Approval Workflow Modal */}
            {showApprovalModal && selectedStudent && <ApprovalWorkflowModal student={selectedStudent} onClose={closeModal} />}
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Approved': return '#22c55e';
        case 'Pending Payment': return '#f59e0b';
        case 'Rejected': return '#ef4444';
        default: return '#6366f1';
    }
};

const StatusFilter = ({ label, count, color }) => (
    <div className="status-filter-pill" style={{ borderColor: color }}>
        <span className="filter-label">{label}</span>
        <span className="filter-count" style={{ backgroundColor: color }}>{count}</span>
    </div>
);

const StudentDetailModal = ({ student, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
                <div className="modal-header-left">
                    <div className="modal-avatar">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                    </div>
                    <div>
                        <h2>{student.firstName} {student.lastName}</h2>
                        <span className="modal-subtitle">Full Application Details</span>
                    </div>
                </div>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </header>
            <div className="modal-body">
                <DetailSection title="Basic Information" icon={<Info size={18} />}>
                    <div className="detail-grid">
                        <DetailItem label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                        <DetailItem label="DOB" value={student.dateOfBirth} />
                        <DetailItem label="Gender" value={student.gender} />
                        <DetailItem label="Applying Grade" value={student.applyingForGrade} />
                    </div>
                </DetailSection>
                <DetailSection title="Parental Information" icon={<UsersIcon size={18} />}>
                    <div className="detail-grid">
                        <DetailItem label="Father Name" value={student.fatherName} />
                        <DetailItem label="Father Phone" value={student.fatherPhone} />
                        <DetailItem label="Mother Name" value={student.motherName} />
                        <DetailItem label="Mother Phone" value={student.motherPhone} />
                    </div>
                </DetailSection>
                <DetailSection title="Contact Details" icon={<MapPin size={18} />}>
                    <DetailItem label="Address" value={student.address} fullWidth />
                </DetailSection>
            </div>
        </div>
    </div>
);

const DetailSection = ({ title, icon, children }) => (
    <div className="detail-section">
        <h3 className="section-title">{icon} {title}</h3>
        {children}
    </div>
);

const DetailItem = ({ label, value, fullWidth }) => (
    <div className={`detail-item ${fullWidth ? 'full-width' : ''}`}>
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value || 'N/A'}</span>
    </div>
);

/* --- Approval Workflow Modal Component --- */
const ApprovalWorkflowModal = ({ student, onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [admissionId, setAdmissionId] = useState('');
    const [generatedIds, setGeneratedIds] = useState(null);

    // Form States
    const [paymentData, setPaymentData] = useState({
        feesAmount: '',
        paymentMethod: 'Cash',
        referenceNo: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [credentials, setCredentials] = useState({
        studentUsername: '',
        studentPassword: '',
        confirmStudentPassword: '',
        parentUsername: '',
        parentPassword: '',
        confirmParentPassword: ''
    });

    const [showPass, setShowPass] = useState({ s: false, p: false });

    // Step 1: Initialize Approval
    useEffect(() => {
        if (step === 1 && !admissionId) {
            initApproval();
        }
    }, [step]);

    const initApproval = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${config.BASE_URL}/vadmin/approve/`, {
                action: 'init_approval',
                application_id: student._id
            });
            if (res.data.status) {
                setAdmissionId(res.data.admission_id);
                // Pre-fill usernames with safety checks
                const sName = (student.firstName || '') + (student.lastName || '');
                const pName = (student.fatherName || 'parent');

                setCredentials(prev => ({
                    ...prev,
                    studentUsername: sName.toLowerCase().replace(/\s/g, '') || 'student',
                    parentUsername: pName.toLowerCase().replace(/\s/g, '') || 'parent'
                }));
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleNextStep = () => setStep(prev => prev + 1);

    const handleFinalSubmit = async () => {
        if (credentials.studentPassword !== credentials.confirmStudentPassword) {
            alert("Student passwords do not match!");
            return;
        }
        if (credentials.parentPassword !== credentials.confirmParentPassword) {
            alert("Parent passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${config.BASE_URL}/vadmin/approve/`, {
                action: 'finalize',
                application_id: student._id,
                payment_details: paymentData,
                credentials: credentials
            });
            if (res.data.status) {
                setGeneratedIds(res.data.ids);
                setStep(4); // Success Step
            }
        } catch (err) {
            alert(err.response?.data?.message || "Finalization failed");
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content approval-workflow">
                <header className="modal-header">
                    <div className="stepper-ui">
                        <StepItem num={1} active={step >= 1} label="Approval" />
                        <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
                        <StepItem num={2} active={step >= 2} label="Payment" />
                        <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
                        <StepItem num={3} active={step >= 3} label="Account" />
                        <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
                        <StepItem num={4} active={step >= 4} label="Success" />
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </header>

                <div className="modal-body workflow-body">
                    {loading && (
                        <div className="workflow-loader">
                            <Loader2 className="animate-spin" size={40} color="#6366f1" />
                            <p>Processing request...</p>
                        </div>
                    )}

                    {!loading && step === 1 && (
                        <div className="step-content animate-in">
                            <div className="step-header">
                                <CheckCircle size={40} color="#22c55e" />
                                <h2>Initialize Admission</h2>
                            </div>
                            <div className="info-summary-card">
                                <DetailItem label="Student Name" value={`${student.firstName} ${student.lastName}`} />
                                <DetailItem label="Grade" value={student.applyingForGrade} />
                                <DetailItem label="Father Name" value={student.fatherName} />
                                <DetailItem label="Phone" value={student.phoneNumber} />
                                <DetailItem label="Email" value={student.email} />
                                <DetailItem label="Generated Admission ID" value={admissionId} color="#f59e0b" />
                            </div>
                            <div className="workflow-actions">
                                <button className="wf-btn secondary" onClick={onClose}>Cancel</button>
                                <button className="wf-btn primary" onClick={handleNextStep}>Proceed to Payment <ArrowRight size={18} /></button>
                            </div>
                        </div>
                    )}

                    {!loading && step === 2 && (
                        <div className="step-content animate-in">
                            <div className="step-header">
                                <CreditCard size={40} color="#6366f1" />
                                <h2>Payment Details</h2>
                            </div>
                            <div className="payment-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Admission Fees Amount</label>
                                        <input type="number" placeholder="Enter amount" value={paymentData.feesAmount} onChange={e => setPaymentData({...paymentData, feesAmount: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label>Payment Method</label>
                                        <select value={paymentData.paymentMethod} onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})}>
                                            <option>Cash</option>
                                            <option>UPI</option>
                                            <option>Bank Transfer</option>
                                            <option>Card</option>
                                            <option>Online Payment</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Reference Number</label>
                                        <input type="text" placeholder="TXN ID / Ref No" value={paymentData.referenceNo} onChange={e => setPaymentData({...paymentData, referenceNo: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label>Payment Date</label>
                                        <input type="date" value={paymentData.payment_date} onChange={e => setPaymentData({...paymentData, payment_date: e.target.value})} />
                                    </div>
                                </div>
                                <div className="input-group full">
                                    <label>Notes / Remarks</label>
                                    <textarea placeholder="Any additional notes..." value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} />
                                </div>
                            </div>
                            <div className="workflow-actions">
                                <button className="wf-btn secondary" onClick={() => setStep(1)}>Back</button>
                                <button className="wf-btn primary" onClick={handleNextStep}>Confirm Payment</button>
                            </div>
                        </div>
                    )}

                    {!loading && step === 3 && (
                        <div className="step-content animate-in">
                            <div className="step-header">
                                <KeyRound size={40} color="#6366f1" />
                                <h2>Account Creation</h2>
                            </div>
                            <div className="credentials-form">
                                <div className="cred-section">
                                    <h3><User size={18} /> Student Credentials</h3>
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Username</label>
                                            <input type="text" value={credentials.studentUsername} onChange={e => setCredentials({...credentials, studentUsername: e.target.value})} />
                                        </div>
                                        <div className="input-group password">
                                            <label>Password</label>
                                            <input type={showPass.s ? "text" : "password"} value={credentials.studentPassword} onChange={e => setCredentials({...credentials, studentPassword: e.target.value})} />
                                            <button className="toggle-pass" onClick={() => setShowPass({...showPass, s: !showPass.s})}>
                                                {showPass.s ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Confirm Password</label>
                                        <input type="password" value={credentials.confirmStudentPassword} onChange={e => setCredentials({...credentials, confirmStudentPassword: e.target.value})} />
                                        {credentials.studentPassword && credentials.confirmStudentPassword && credentials.studentPassword !== credentials.confirmStudentPassword && <span className="error-txt">Passwords mismatch</span>}
                                    </div>
                                </div>

                                <div className="cred-section">
                                    <h3><UsersIcon size={18} /> Parent Credentials</h3>
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Username</label>
                                            <input type="text" value={credentials.parentUsername} onChange={e => setCredentials({...credentials, parentUsername: e.target.value})} />
                                        </div>
                                        <div className="input-group password">
                                            <label>Password</label>
                                            <input type={showPass.p ? "text" : "password"} value={credentials.parentPassword} onChange={e => setCredentials({...credentials, parentPassword: e.target.value})} />
                                            <button className="toggle-pass" onClick={() => setShowPass({...showPass, p: !showPass.p})}>
                                                {showPass.p ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Confirm Password</label>
                                        <input type="password" value={credentials.confirmParentPassword} onChange={e => setCredentials({...credentials, confirmParentPassword: e.target.value})} />
                                        {credentials.parentPassword && credentials.confirmParentPassword && credentials.parentPassword !== credentials.confirmParentPassword && <span className="error-txt">Passwords mismatch</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="workflow-actions">
                                <button className="wf-btn secondary" onClick={() => setStep(2)}>Back</button>
                                <button className="wf-btn primary finalize" onClick={handleFinalSubmit}>Finalize Admission</button>
                            </div>
                        </div>
                    )}

                    {!loading && step === 4 && generatedIds && (
                        <div className="step-content success-view animate-in">
                            <div className="success-circle">
                                <Check size={50} color="#fff" />
                            </div>
                            <h2>Admission Approved Successfully!</h2>
                            <p>All records have been created and status updated.</p>

                            <div className="generated-ids-grid">
                                <div className="id-item">
                                    <label>Admission ID</label>
                                    <span>{generatedIds.admission_id}</span>
                                </div>
                                <div className="id-item">
                                    <label>Student ID</label>
                                    <span>{generatedIds.student_id}</span>
                                </div>
                                <div className="id-item">
                                    <label>Parent ID</label>
                                    <span>{generatedIds.parent_id}</span>
                                </div>
                            </div>

                            <div className="success-actions-grid">
                                <button className="success-act-btn"><Printer size={18} /> Print Receipt</button>
                                <button className="success-act-btn"><Download size={18} /> Download PDF</button>
                                <button className="success-act-btn"><MessageSquare size={18} /> Send SMS</button>
                                <button className="success-act-btn"><Send size={18} /> Send Email</button>
                            </div>

                            <button className="wf-btn primary full" onClick={onClose}>Done</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StepItem = ({ num, active, label }) => (
    <div className={`step-item ${active ? 'active' : ''}`}>
        <div className="step-num">{num}</div>
        <span className="step-label">{label}</span>
    </div>
);

export default New_Admission;
