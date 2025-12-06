import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfessionalVerificationModal = ({ isOpen, onClose, onSuccess, userDssn }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        dssn: userDssn || '',
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
    const [userInfo, setUserInfo] = useState(null);

    // Fetch user info when DSSN is provided
    useEffect(() => {
        if (userDssn && userDssn.length >= 15) {
            setFormData(prev => ({ ...prev, dssn: userDssn }));
            fetchUserInfo(userDssn);
        }
    }, [userDssn]);

    const fetchUserInfo = async (dssn) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health'}/verify-dssn/patient`,
                { dssn }
            );
            if (response.data.success && response.data.user) {
                setUserInfo(response.data.user);
            }
        } catch (error) {
            console.log('Could not fetch user info:', error);
        }
    };

    const validateForm = () => {
        // Validate DSSN
        if (!formData.dssn || formData.dssn.trim() === '') {
            return { valid: false, message: 'DSSN is required. Please enter your Digital Social Security Number.' };
        } else if (formData.dssn.length < 15 || formData.dssn.length > 20) {
            return { valid: false, message: 'DSSN must be between 15 and 20 characters.' };
        } else if (!/^[A-Za-z0-9]{15,20}$/.test(formData.dssn)) {
            return { valid: false, message: 'DSSN must contain only letters and numbers (no special characters).' };
        }

        if (!formData.professionalType) {
            return { valid: false, message: 'Please select a professional type.' };
        }

        if (!formData.licenseNumber || formData.licenseNumber.trim() === '') {
            return { valid: false, message: 'License number is required.' };
        }

        if (!formData.licenseExpiry) {
            return { valid: false, message: 'License expiry date is required.' };
        }

        // Check if license is expired
        const expiryDate = new Date(formData.licenseExpiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expiryDate < today) {
            return { valid: false, message: 'License cannot be expired. Please enter a future date.' };
        }

        return { valid: true };
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        
        const validation = validateForm();
        if (!validation.valid) {
            setError(validation.message);
            setLoading(false);
            return;
        }

        try {
            const formattedExpiry = new Date(formData.licenseExpiry).toISOString().split('T')[0];
            
            const requestData = { 
                dssn: formData.dssn.trim(),
                professionalType: formData.professionalType,
                specialization: formData.specialization || null,
                licenseNumber: formData.licenseNumber.trim(),
                licenseExpiry: formattedExpiry,
                facilityName: formData.facilityName.trim() || null,
                facilityType: formData.facilityType,
                department: formData.department.trim() || null
            };

            const response = await axios.post(
                `${process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health'}/register-professional`,
                requestData
            );

            if (response.data.success) {
                setSuccess({
                    title: 'Registration Submitted Successfully!',
                    message: response.data.message,
                    nextSteps: response.data.nextSteps,
                    professionalId: response.data.professionalId
                });
                setStep(3);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error('Registration error:', err);
            
            if (err.response?.data?.errors) {
                const validationErrors = err.response.data.errors.map(err => err.msg).join(', ');
                setError(`Validation errors: ${validationErrors}`);
            } else if (err.response?.data?.message?.includes('No user found with this DSSN')) {
                setError(
                    <div>
                        <strong>No user found with this DSSN!</strong>
                        <br />
                        DSSN: <code>{formData.dssn}</code> is not registered in the system.
                        <br />
                        Please register through the Digital Liberia mobile app first.
                        <br />
                        <a 
                            href="https://digitalliberia.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="app-link"
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
                        A professional profile with DSSN: <code>{formData.dssn}</code> already exists and is approved.
                        <br />
                        Please login using your DSSN and password.
                    </div>
                );
            } else if (err.response?.data?.message?.includes('Professional profile already exists')) {
                setError(
                    <div>
                        <strong>Professional profile already exists!</strong>
                        <br />
                        A professional profile is already registered with DSSN: <code>{formData.dssn}</code>
                        <br />
                        {err.response.data.existingStatus === 'pending' 
                            ? 'Your registration is pending verification. Please wait for admin approval.'
                            : 'Please login or contact support.'}
                    </div>
                );
            } else if (err.response?.data?.message?.includes('License number already registered')) {
                setError(
                    <div>
                        <strong>License number already registered!</strong>
                        <br />
                        The license number <code>{formData.licenseNumber}</code> is already in use.
                        <br />
                        Please use a different license number or contact support.
                    </div>
                );
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const handleDssnChange = (e) => {
        const value = e.target.value.toUpperCase();
        handleInputChange('dssn', value);
        
        // Auto-fetch user info when DSSN is valid
        if (value.length >= 15 && /^[A-Za-z0-9]{15,20}$/.test(value)) {
            fetchUserInfo(value);
        } else {
            setUserInfo(null);
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
                
                {/* Step 1: DSSN & Basic Info */}
                {step === 1 && (
                    <div className="verification-step">
                        <h3>Step 1: DSSN & Professional Information</h3>
                        <p className="step-description">
                            Enter your DSSN and professional details for verification
                        </p>
                        
                        {/* DSSN Input with User Info */}
                        <div className="form-group">
                            <label>Digital Social Security Number (DSSN) *</label>
                            <input 
                                type="text"
                                placeholder="Enter your 15-20 character DSSN"
                                value={formData.dssn}
                                onChange={handleDssnChange}
                                className="form-input"
                                required
                                minLength="15"
                                maxLength="20"
                                pattern="[A-Za-z0-9]{15,20}"
                                title="DSSN must be 15-20 alphanumeric characters"
                            />
                            <p className="input-help">
                                Your DSSN from the Digital Liberia app (letters and numbers only)
                            </p>
                            
                            {/* User Info Display */}
                            {userInfo && (
                                <div className="user-info-display">
                                    <div className="user-info-header">
                                        ✅ User Found
                                    </div>
                                    <div className="user-info-content">
                                        <p><strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}</p>
                                        <p><strong>Email:</strong> {userInfo.email}</p>
                                        <p><strong>Phone:</strong> {userInfo.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label>Professional Type *</label>
                            <select 
                                value={formData.professionalType}
                                onChange={(e) => handleInputChange('professionalType', e.target.value)}
                                className="form-select"
                                required
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
                            <label>Specialization (Optional)</label>
                            <input 
                                type="text"
                                placeholder="e.g., Cardiology, Pediatrics, General Practice, etc."
                                value={formData.specialization}
                                onChange={(e) => handleInputChange('specialization', e.target.value)}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Professional License Number *</label>
                            <input 
                                type="text"
                                placeholder="Enter your professional license number"
                                value={formData.licenseNumber}
                                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>License Expiry Date *</label>
                            <input 
                                type="date"
                                value={formData.licenseExpiry}
                                onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                                className="form-input"
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                className="btn btn-health"
                                onClick={() => {
                                    if (!formData.dssn || formData.dssn.length < 15) {
                                        setError('Please enter a valid DSSN (15-20 characters)');
                                        return;
                                    }
                                    if (!formData.professionalType || !formData.licenseNumber || !formData.licenseExpiry) {
                                        setError('Please fill all required fields');
                                        return;
                                    }
                                    setError(null);
                                    setStep(2);
                                }}
                            >
                                Next: Facility Information →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Facility Information */}
                {step === 2 && (
                    <div className="verification-step">
                        <h3>Step 2: Facility Information</h3>
                        <p className="step-description">
                            Please provide details about your healthcare facility
                        </p>
                        
                        <div className="form-group">
                            <label>Facility Type</label>
                            <select 
                                value={formData.facilityType}
                                onChange={(e) => handleInputChange('facilityType', e.target.value)}
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
                            <label>Facility Name (Optional)</label>
                            <input 
                                type="text"
                                placeholder="e.g., JFK Medical Center, Redemption Hospital, etc."
                                value={formData.facilityName}
                                onChange={(e) => handleInputChange('facilityName', e.target.value)}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Department/Section (Optional)</label>
                            <input 
                                type="text"
                                placeholder="e.g., Emergency, Pediatrics, Pharmacy, etc."
                                value={formData.department}
                                onChange={(e) => handleInputChange('department', e.target.value)}
                                className="form-input"
                            />
                        </div>
                        
                        {/* Registration Summary */}
                        <div className="registration-summary">
                            <h4>Registration Summary</h4>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <strong>DSSN:</strong>
                                    <span>{formData.dssn}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>Professional Type:</strong>
                                    <span>{formData.professionalType}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>License Number:</strong>
                                    <span>{formData.licenseNumber}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>License Expiry:</strong>
                                    <span>{new Date(formData.licenseExpiry).toLocaleDateString()}</span>
                                </div>
                                {userInfo && (
                                    <>
                                        <div className="summary-item">
                                            <strong>Name:</strong>
                                            <span>{userInfo.firstName} {userInfo.lastName}</span>
                                        </div>
                                        <div className="summary-item">
                                            <strong>Email:</strong>
                                            <span>{userInfo.email}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-actions">
                            <div className="button-group">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    ← Back
                                </button>
                                <button 
                                    className="btn btn-health"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            Submitting...
                                        </>
                                    ) : 'Submit Registration'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="verification-step success-step">
                        <div className="success-icon">✅</div>
                        <h3>{success?.title || 'Registration Successful!'}</h3>
                        <p className="success-message">
                            {success?.message || 'Your professional registration has been submitted for verification.'}
                        </p>
                        
                        <div className="success-details">
                            <div className="detail-card">
                                <div className="detail-icon">📝</div>
                                <h4>Registration ID</h4>
                                <p className="detail-value">{success?.professionalId || 'Pending'}</p>
                            </div>
                            
                            <div className="detail-card">
                                <div className="detail-icon">⏳</div>
                                <h4>Verification Time</h4>
                                <p className="detail-value">3-5 Business Days</p>
                            </div>
                            
                            <div className="detail-card">
                                <div className="detail-icon">📧</div>
                                <h4>Notification</h4>
                                <p className="detail-value">Email upon approval</p>
                            </div>
                        </div>
                        
                        <div className="next-steps">
                            <h4>Next Steps:</h4>
                            <ul className="steps-list">
                                <li>✅ Registration submitted for DSSN: {formData.dssn}</li>
                                <li>⏳ Administrative review (3-5 business days)</li>
                                <li>📧 You will receive email notification upon approval</li>
                                <li>🔓 Once approved, login with DSSN + Password</li>
                                <li>📱 OR approve access via mobile notification</li>
                            </ul>
                        </div>
                        
                        <div className="action-buttons">
                            <button 
                                className="btn btn-health"
                                onClick={onClose}
                            >
                                Close
                            </button>
                            <a 
                                href="https://digitalliberia.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-mobile"
                            >
                                Download Mobile App
                            </a>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="error-message">
                        <div className="error-icon">⚠️</div>
                        <div className="error-content">
                            {error}
                            <button 
                                className="btn btn-small btn-error"
                                onClick={() => setError(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalVerificationModal;
