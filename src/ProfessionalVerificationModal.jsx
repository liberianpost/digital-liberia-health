import React, { useState } from 'react';
import axios from 'axios';

const ProfessionalVerificationModal = ({ isOpen, onClose, onSuccess, userDssn }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        dssn: userDssn || '', // Added DSSN field
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

    // Frontend validation before sending
    const validateForm = () => {
        // Validate DSSN (REQUIRED - from backend validation)
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
        today.setHours(0, 0, 0, 0); // Reset time part for comparison
        
        if (expiryDate < today) {
            return { valid: false, message: 'License cannot be expired. Please enter a future date.' };
        }

        // Note: facilityName is optional in backend (marked as optional())
        // facilityType has default value 'hospital' in backend

        return { valid: true };
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        
        // Frontend validation
        const validation = validateForm();
        if (!validation.valid) {
            setError(validation.message);
            setLoading(false);
            return;
        }

        try {
            // Format the date properly
            const formattedExpiry = new Date(formData.licenseExpiry).toISOString().split('T')[0];
            
            // Prepare the request data - INCLUDING DSSN
            const requestData = { 
                dssn: formData.dssn.trim(), // Send DSSN from form
                professionalType: formData.professionalType,
                specialization: formData.specialization || null,
                licenseNumber: formData.licenseNumber.trim(),
                licenseExpiry: formattedExpiry,
                facilityName: formData.facilityName.trim() || null,
                facilityType: formData.facilityType,
                department: formData.department.trim() || null
            };

            console.log('Sending registration data:', requestData);
            console.log('API URL:', `${process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health'}/register-professional`);

            // Send the request WITHOUT authorization headers
            const response = await axios.post(
                `${process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health'}/register-professional`,
                requestData
                // No headers needed - endpoint is public
            );

            console.log('Registration response:', response.data);
            
            if (response.data.success) {
                setSuccess('Professional registration submitted for verification');
                setStep(3);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error('Registration error:', err);
            console.error('Error response data:', err.response?.data);
            console.error('Error status:', err.response?.status);
            
            // Enhanced error handling
            if (err.response?.data?.errors) {
                // Show validation errors from backend
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
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (error) {
            setError(null);
        }
    };

    const handleDssnChange = (e) => {
        const value = e.target.value.toUpperCase(); // Convert to uppercase for consistency
        handleInputChange('dssn', value);
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
                        <h3>Step 1: DSSN & Professional Information</h3>
                        <p className="step-description">
                            Enter your DSSN and professional details for verification
                            <br />
                            <small style={{ color: '#ef476f', marginTop: '5px', display: 'block' }}>
                                <strong>Important:</strong> You must have a registered DSSN from the Digital Liberia app
                            </small>
                        </p>
                        
                        {/* DSSN FIELD ADDED HERE */}
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
                                {userDssn && (
                                    <span style={{ color: '#00d4aa', fontWeight: 'bold' }}>
                                        &nbsp;• Detected DSSN: {userDssn}
                                    </span>
                                )}
                            </p>
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
                                minLength="3"
                            />
                            <p className="input-help">e.g., MED123456, LIC789012</p>
                        </div>
                        
                        <div className="form-group">
                            <label>License Expiry Date *</label>
                            <input 
                                type="date"
                                value={formData.licenseExpiry}
                                onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                                className="form-input"
                                required
                                min={new Date().toISOString().split('T')[0]} // Today's date
                            />
                            <p className="input-help">License must not be expired</p>
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                className="btn btn-health"
                                onClick={() => {
                                    // Validate DSSN before moving to next step
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
                                disabled={!formData.dssn || formData.dssn.length < 15 || !formData.professionalType || !formData.licenseNumber || !formData.licenseExpiry}
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
                            <br />
                            <small style={{ color: '#00d4aa', marginTop: '5px', display: 'block' }}>
                                DSSN: <strong>{formData.dssn}</strong>
                            </small>
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
                            <p className="input-help">Optional - Default is "Hospital"</p>
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
                            <p className="input-help">Optional - Leave blank if not applicable</p>
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
                        
                        <div className="dssn-review" style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '15px', 
                            borderRadius: '8px',
                            margin: '20px 0',
                            borderLeft: '4px solid #00d4aa'
                        }}>
                            <h4 style={{ marginTop: 0, color: '#333' }}>Registration Summary</h4>
                            <p><strong>DSSN:</strong> {formData.dssn}</p>
                            <p><strong>Professional Type:</strong> {formData.professionalType}</p>
                            <p><strong>License Number:</strong> {formData.licenseNumber}</p>
                            <p><strong>License Expiry:</strong> {new Date(formData.licenseExpiry).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="form-actions">
                            <div className="button-group">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    ← Back to DSSN & Details
                                </button>
                                <button 
                                    className="btn btn-health"
                                    onClick={handleSubmit}
                                    disabled={loading}
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
                            Your professional registration for DSSN: <strong>{formData.dssn}</strong> has been submitted for verification.
                        </p>
                        <p>
                            <strong>Verification Process:</strong>
                        </p>
                        <ul className="verification-steps">
                            <li>✅ Registration received for DSSN: {formData.dssn}</li>
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
                            <button 
                                className="btn btn-small"
                                onClick={() => setError(null)}
                                style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '5px 10px' }}
                            >
                                Dismiss
                            </button>
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
