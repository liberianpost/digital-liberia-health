import React, { useState } from 'react';
import axios from 'axios';

const ProfessionalVerificationModal = ({ isOpen, onClose, onSuccess, userDssn }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        professionalType: '',
        specialization: '',
        licenseNumber: '',
        licenseExpiry: '',
        facilityName: '',
        facilityType: 'hospital',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // NO LONGER NEED TOKEN - Endpoint is public
            const response = await axios.post(
                `${process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health'}/register-professional`,
                { 
                    ...formData, 
                    dssn: userDssn,
                    licenseExpiry: new Date(formData.licenseExpiry).toISOString().split('T')[0]
                }
                // REMOVED: Authorization headers since endpoint is public
            );

            if (response.data.success) {
                setSuccess('Professional registration submitted for verification');
                setStep(3);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            // Enhanced error handling
            console.error('Registration error:', err.response?.data || err.message);
            
            if (err.response?.data?.nextStep === 'register_in_main_app') {
                setError(
                    <div>
                        <strong>No user found with this DSSN.</strong>
                        <br />
                        Please register through the Digital Liberia mobile app first.
                        <br />
                        <a 
                            href="https://digitalliberia.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#00d4aa', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' }}
                        >
                            Download Digital Liberia App →
                        </a>
                    </div>
                );
            } else if (err.response?.data?.action === 'login') {
                setError(
                    <div>
                        <strong>Professional profile already approved!</strong>
                        <br />
                        Please login using your DSSN and password.
                    </div>
                );
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content professional-modal">
                <div className="modal-header">
                    <h2>Healthcare Professional Registration</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                {step === 1 && (
                    <div className="verification-step">
                        <h3>Step 1: Professional Information</h3>
                        <p className="step-description">
                            Please provide your professional details for verification
                            <br />
                            <small style={{ color: '#ef476f', marginTop: '5px', display: 'block' }}>
                                <strong>Note:</strong> You must already have a Digital Liberia account with this DSSN.
                            </small>
                        </p>
                        
                        <div className="form-group">
                            <label>Professional Type *</label>
                            <select 
                                value={formData.professionalType}
                                onChange={(e) => setFormData({...formData, professionalType: e.target.value})}
                                className="form-select"
                            >
                                <option value="">Select professional type</option>
                                <option value="doctor">Medical Doctor</option>
                                <option value="nurse">Nurse</option>
                                <option value="pharmacist">Pharmacist</option>
                                <option value="lab_technician">Lab Technician</option>
                                <option value="medical_assistant">Medical Assistant</option>
                                <option value="administrator">Healthcare Administrator</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Specialization</label>
                            <input 
                                type="text"
                                placeholder="e.g., Cardiology, Pediatrics, General Practice, etc."
                                value={formData.specialization}
                                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Professional License Number *</label>
                            <input 
                                type="text"
                                placeholder="Enter your professional license number"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>License Expiry Date *</label>
                            <input 
                                type="date"
                                value={formData.licenseExpiry}
                                onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                                className="form-input"
                                required
                                min={new Date().toISOString().split('T')[0]} // Today's date
                            />
                            <p className="input-help">License must not be expired</p>
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                className="btn btn-health"
                                onClick={() => setStep(2)}
                                disabled={!formData.professionalType || !formData.licenseNumber || !formData.licenseExpiry}
                            >
                                Next: Facility Information →
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="verification-step">
                        <h3>Step 2: Facility Information</h3>
                        <p className="step-description">
                            Please provide details about your healthcare facility
                        </p>
                        
                        <div className="form-group">
                            <label>Facility Type *</label>
                            <select 
                                value={formData.facilityType}
                                onChange={(e) => setFormData({...formData, facilityType: e.target.value})}
                                className="form-select"
                            >
                                <option value="hospital">Hospital</option>
                                <option value="clinic">Clinic</option>
                                <option value="pharmacy">Pharmacy</option>
                                <option value="lab">Laboratory</option>
                                <option value="private_practice">Private Practice</option>
                                <option value="government">Government Health Facility</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Facility Name *</label>
                            <input 
                                type="text"
                                placeholder="e.g., JFK Medical Center, Redemption Hospital, etc."
                                value={formData.facilityName}
                                onChange={(e) => setFormData({...formData, facilityName: e.target.value})}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Department/Section</label>
                            <input 
                                type="text"
                                placeholder="e.g., Emergency, Pediatrics, Pharmacy, etc."
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-actions">
                            <div className="button-group">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    ← Back
                                </button>
                                <button 
                                    className="btn btn-health"
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.facilityName}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            Submitting Registration...
                                        </>
                                    ) : 'Submit Professional Registration'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="verification-step success-step">
                        <div className="success-icon">✅</div>
                        <h3>Registration Submitted Successfully!</h3>
                        <p>
                            Your professional registration has been submitted for verification.
                        </p>
                        <p>
                            <strong>Verification Process:</strong>
                        </p>
                        <ul className="verification-steps">
                            <li>✅ Registration received</li>
                            <li>⏳ Administrative review (3-5 business days)</li>
                            <li>📧 Email notification upon approval</li>
                            <li>🔓 Access granted to healthcare systems</li>
                        </ul>
                        <p>
                            <strong>After Approval:</strong>
                        </p>
                        <ul className="verification-steps">
                            <li>✅ Login with DSSN + Password (from Digital Liberia app)</li>
                            <li>📱 OR approve via mobile notification</li>
                            <li>🏥 Access healthcare systems</li>
                        </ul>
                        <div className="button-group">
                            <button 
                                className="btn btn-health"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <div className="error-icon">⚠️</div>
                        <div className="error-content">
                            {error}
                        </div>
                    </div>
                )}
                
                {success && (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <div className="success-content">
                            {success}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalVerificationModal;
