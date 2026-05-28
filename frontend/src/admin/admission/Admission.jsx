import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import './admission.css';
import axios from 'axios';
import config from '../../config';
const Admission = () => {
  const [guardianType, setGuardianType] = useState('parents'); // 'parents' or 'guardian'
  const [siblingCount, setSiblingCount] = useState(0);
  const [siblingData, setSiblingData] = useState([]);
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge >= 0 ? calculatedAge : 0;
  };

  // Calculate age when dob changes
  useEffect(() => {
    setAge(calculateAge(dob));
  }, [dob]);

  useEffect(() => {
    if (siblingCount > siblingData.length) {
      const newSiblings = [...siblingData];
      for (let i = siblingData.length; i < siblingCount; i++) {
        newSiblings.push({ name: '', dob: '', age: '', class: '', school: '' });
      }
      setSiblingData(newSiblings);
    } else if (siblingCount < siblingData.length) {
      setSiblingData(siblingData.slice(0, siblingCount));
    }
  }, [siblingCount]);

  const updateSibling = (index, field, value) => {
    const updated = [...siblingData];
    updated[index][field] = value;
    if (field === 'dob') {
      updated[index].age = calculateAge(value);
    }
    setSiblingData(updated);
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    applyingForGrade: '',
    previousSchoolName: '',
    previousClassPassed: '',
    yearOfPassing: '',
    percentage: '',
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherEmail: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    motherEmail: '',
    guardianName: '',
    guardianRelationship: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    email: '',
    message: '',
    siblingName: '',
    siblingGrade: '',
    siblingAdmissionNumber: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Include the siblingData array and guardianType in the payload
      const payload = { ...formData, guardianType, siblings: siblingData };
      const response = await axios.post(`${config.BASE_URL}/vadmin/admission/`, payload);
      console.log(response.data);
      alert('Application submitted successfully!');
      
      // Clear all input fields and states
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        applyingForGrade: '',
        previousSchoolName: '',
        previousClassPassed: '',
        yearOfPassing: '',
        percentage: '',
        fatherName: '',
        fatherOccupation: '',
        fatherPhone: '',
        fatherEmail: '',
        motherName: '',
        motherOccupation: '',
        motherPhone: '',
        motherEmail: '',
        guardianName: '',
        guardianRelationship: '',
        guardianPhone: '',
        guardianEmail: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phoneNumber: '',
        email: '',
        message: '',
        siblingName: '',
        siblingGrade: '',
        siblingAdmissionNumber: ''
      });
      setSiblingData([]);
      setSiblingCount(0);
      setDob('');
      setGuardianType('parents');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application: ' + error.message);
    }
  };

  return (
    <div className="admission-container">
      {/* Background layer */}
      <div className="bg-image"></div>
      <div className="bg-overlay"></div>

      <main className="admission-main">
        <div className="admission-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} /> Back to Home
          </Link>
          <h1 className="admission-title">Admission Application</h1>
          <p className="admission-subtitle">Join our community for the upcoming academic year.</p>
        </div>

        <form className="admission-form" onSubmit={handleSubmit}>
          
          {/* Section 1: Student Details */}
          <section className="form-section">
            <h2 className="section-title">Student Details</h2>
            <div className="form-grid">
              <div className="input-group">
                <label>First Name</label>
                <input type="text" name="firstName" placeholder="Student's First Name" required onChange={handleChange} value={formData.firstName}/>
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" name="lastName" placeholder="Student's Last Name" required onChange={handleChange} value={formData.lastName}/>
              </div>
              <div className="input-group">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  name="dateOfBirth"
                  value={dob}
                  onChange={(e) => { setDob(e.target.value); handleChange(e); }}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Age</label>
                <input 
                  type="number" 
                  value={age} 
                  readOnly 
                  placeholder="Calculated automatically" 
                  className="readonly-input"
                />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select name="gender" required onChange={handleChange} value={formData.gender}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <label>Applying For Class</label>
                <select name="applyingForGrade" required onChange={handleChange} value={formData.applyingForGrade}>
                  <option value="">Select Class</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                  ))}
                </select>
              </div>

              {/* Previous School Details */}
              <div className="input-group full-width" style={{ gridColumn: '1 / -1', marginTop: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1.5px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '1.25rem', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>Previous School Details (if any)</h3>
                <div className="form-grid previous-school-grid">
                  <div className="input-group">
                    <label>Previous School Name</label>
                    <input type="text" name="previousSchoolName" placeholder="Name of previous school" onChange={handleChange} value={formData.previousSchoolName}/>
                  </div>
                  <div className="input-group">
                    <label>Previous Class Passed</label>
                    <input type="text" name="previousClassPassed" placeholder="Class/Grade" onChange={handleChange} value={formData.previousClassPassed}/>
                  </div>
                  <div className="input-group">
                    <label>Year of Passing</label>
                    <input type="text" name="yearOfPassing" placeholder="E.g., 2025" onChange={handleChange} value={formData.yearOfPassing}/>
                  </div>
                  <div className="input-group">
                    <label>Percentage/Grade</label>
                    <input type="text" name="percentage" placeholder="Percentage or Grade" onChange={handleChange} value={formData.percentage}/>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Guardian Type Selection */}
          <div className="guardian-toggle-container">
            <label className="guardian-toggle-label">Who is filling this application?</label>
            <div className="guardian-toggle">
              <button 
                type="button"
                className={`toggle-btn ${guardianType === 'parents' ? 'active' : ''}`}
                onClick={() => setGuardianType('parents')}
              >
                Parents (Father & Mother)
              </button>
              <button 
                type="button"
                className={`toggle-btn ${guardianType === 'guardian' ? 'active' : ''}`}
                onClick={() => setGuardianType('guardian')}
              >
                Guardian
              </button>
            </div>
          </div>

          {/* Section 2: Parent/Guardian Details */}
          {guardianType === 'parents' ? (
            <div className="parents-section-wrapper">
              <section className="form-section half-section">
                <h2 className="section-title">Father's Details</h2>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Father's Name</label>
                    <input type="text" name="fatherName" placeholder="Full Name" required onChange={handleChange} value={formData.fatherName}/>
                  </div>
                  <div className="input-group">
                    <label>Occupation</label>
                    <input type="text" name="fatherOccupation" placeholder="Occupation" onChange={handleChange} value={formData.fatherOccupation}/>
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input type="tel" name="fatherPhone" placeholder="Mobile Number" required onChange={handleChange} value={formData.fatherPhone}/>
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" name="fatherEmail" placeholder="Email Address" onChange={handleChange} value={formData.fatherEmail}/>
                  </div>
                </div>
              </section>

              <section className="form-section half-section">
                <h2 className="section-title">Mother's Details</h2>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Mother's Name</label>
                    <input type="text" name="motherName" placeholder="Full Name" required onChange={handleChange} value={formData.motherName}/>
                  </div>
                  <div className="input-group">
                    <label>Occupation</label>
                    <input type="text" name="motherOccupation" placeholder="Occupation" onChange={handleChange} value={formData.motherOccupation}/>
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input type="tel" name="motherPhone" placeholder="Mobile Number" required onChange={handleChange} value={formData.motherPhone}/>
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" name="motherEmail" placeholder="Email Address" onChange={handleChange} value={formData.motherEmail}/>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="form-section">
              <h2 className="section-title">Guardian's Details</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>Guardian's Name</label>
                  <input type="text" name="guardianName" placeholder="Full Name" required onChange={handleChange} value={formData.guardianName}/>
                </div>
                <div className="input-group">
                  <label>Relationship to Student</label>
                  <input type="text" name="guardianRelationship" placeholder="E.g., Uncle, Aunt, Grandparent" required onChange={handleChange} value={formData.guardianRelationship}/>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input type="tel" name="guardianPhone" placeholder="Mobile Number" required onChange={handleChange} value={formData.guardianPhone}/>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" name="guardianEmail" placeholder="Email Address" onChange={handleChange} value={formData.guardianEmail}/>
                </div>
              </div>
            </section>
          )}

          {/* Section: Contact & Address Details */}
          <section className="form-section">
            <h2 className="section-title">Contact & Address Details</h2>
            <div className="form-grid">
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Residential Address</label>
                <input type="text" name="address" placeholder="Street Address / Apartment / Locality" required onChange={handleChange} value={formData.address}/>
              </div>
              <div className="input-group">
                <label>City</label>
                <input type="text" name="city" placeholder="City" required onChange={handleChange} value={formData.city}/>
              </div>
              <div className="input-group">
                <label>State</label>
                <input type="text" name="state" placeholder="State" required onChange={handleChange} value={formData.state}/>
              </div>
              <div className="input-group">
                <label>Zip/Postal Code</label>
                <input type="text" name="zipCode" placeholder="Zip Code" required onChange={handleChange} value={formData.zipCode}/>
              </div>
              <div className="input-group">
                <label>Primary Phone Number</label>
                <input type="tel" name="phoneNumber" placeholder="Primary Contact Number" required onChange={handleChange} value={formData.phoneNumber}/>
              </div>
              <div className="input-group">
                <label>Primary Email Address</label>
                <input type="email" name="email" placeholder="Primary Email" required onChange={handleChange} value={formData.email}/>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Additional Message / Comments</label>
                <textarea name="message" placeholder="Any specific requirements or comments..." rows="3" onChange={handleChange} value={formData.message} style={{ padding: '0.875rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.75rem', fontSize: '1rem', fontFamily: 'inherit', background: 'white', color: '#1e293b', outline: 'none', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </section>

          {/* Section 3: Sibling Details */}
          <section className="form-section">
            <div className="sibling-header">
              <h2 className="section-title">Sibling Details</h2>
              <div className="sibling-count-control">
                <label className="checkbox-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Number of siblings:
                </label>
                <select 
                  value={siblingCount} 
                  onChange={(e) => setSiblingCount(Number(e.target.value))}
                  className="sibling-select"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>
            
            {siblingCount > 0 && (
              <div className="siblings-container">
                {siblingData.map((sibling, index) => (
                  <div key={index} className="form-grid sibling-grid" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: '#1e293b', fontSize: '1.05rem', margin: '0', fontWeight: '700' }}>Sibling {index + 1}</h4>
                    </div>
                    <div className="input-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        placeholder={`Sibling ${index + 1} Full Name`} 
                        value={sibling.name}
                        onChange={(e) => updateSibling(index, 'name', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label>Date of Birth</label>
                      <input 
                        type="date" 
                        value={sibling.dob}
                        onChange={(e) => updateSibling(index, 'dob', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label>Age</label>
                      <input 
                        type="number" 
                        value={sibling.age} 
                        readOnly 
                        placeholder="Calculated automatically" 
                        className="readonly-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>School Name</label>
                      <input 
                        type="text" 
                        placeholder="Current School Details" 
                        value={sibling.school}
                        onChange={(e) => updateSibling(index, 'school', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label>Current Class</label>
                      <select 
                        required
                        value={sibling.class}
                        onChange={(e) => updateSibling(index, 'class', e.target.value)}
                      >
                        <option value="">Select Class</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Submit Application <Send size={20} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Admission;
