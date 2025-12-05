import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';

const ProfessionalVerificationModal = ({ open, onClose, onVerificationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    dssn: '',
    professionalType: '',
    licenseNumber: '',
    licenseExpiry: null,
    facilityName: '',
    facilityType: '',
    specialization: '',
    department: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const professionalTypes = [
    { value: 'doctor', label: 'Medical Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'lab_technician', label: 'Laboratory Technician' },
    { value: 'administrator', label: 'Healthcare Administrator' },
    { value: 'medical_assistant', label: 'Medical Assistant' }
  ];

  const facilityTypes = [
    { value: 'hospital', label: 'Hospital' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'private_practice', label: 'Private Practice' },
    { value: 'government', label: 'Government Facility' }
  ];

  const specializations = [
    { value: '', label: 'None (General)' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'anesthesiology', label: 'Anesthesiology' },
    { value: 'emergency_medicine', label: 'Emergency Medicine' },
    { value: 'family_medicine', label: 'Family Medicine' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate DSSN
    if (!formData.dssn.trim()) {
      errors.dssn = 'DSSN is required';
    } else if (formData.dssn.length < 15 || formData.dssn.length > 20) {
      errors.dssn = 'DSSN must be between 15 and 20 characters';
    } else if (!/^[A-Za-z0-9]{15,20}$/.test(formData.dssn)) {
      errors.dssn = 'DSSN must contain only letters and numbers';
    }
    
    if (!formData.professionalType) {
      errors.professionalType = 'Professional type is required';
    }
    
    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'License number is required';
    }
    
    if (!formData.licenseExpiry) {
      errors.licenseExpiry = 'License expiry date is required';
    } else if (dayjs(formData.licenseExpiry).isBefore(dayjs(), 'day')) {
      errors.licenseExpiry = 'License cannot be expired';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        dssn: formData.dssn,
        professionalType: formData.professionalType,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: dayjs(formData.licenseExpiry).format('YYYY-MM-DD'),
        facilityName: formData.facilityName || null,
        facilityType: formData.facilityType || 'hospital',
        specialization: formData.specialization || null,
        department: formData.department || null
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/health/register-professional`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message || 'Registration submitted successfully!');
        
        // Store professional info in localStorage for future use
        if (response.data.professionalId) {
          localStorage.setItem('professional_id', response.data.professionalId);
          localStorage.setItem('professional_status', 'pending');
        }
        
        // Reset form
        setFormData({
          dssn: '',
          professionalType: '',
          licenseNumber: '',
          licenseExpiry: null,
          facilityName: '',
          facilityType: '',
          specialization: '',
          department: ''
        });
        
        // If verification complete callback exists, call it after delay
        if (onVerificationComplete) {
          setTimeout(() => {
            onVerificationComplete({
              success: true,
              message: response.data.message,
              professionalId: response.data.professionalId,
              userId: response.data.userId
            });
            onClose();
          }, 2000);
        }
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle specific error cases from backend
        if (errorData.message?.includes('No user found with this DSSN')) {
          setError('No user found with this DSSN. Please register through the main Digital Liberia app first.');
        } else if (errorData.message?.includes('License number already registered')) {
          setError('This license number is already registered. Please use a different license number.');
        } else if (errorData.message?.includes('Professional profile already exists')) {
          setError('A professional profile already exists for this DSSN. Please login instead.');
        } else if (errorData.errors) {
          // Handle validation errors
          const validationErrors = errorData.errors.reduce((acc, curr) => {
            acc[curr.path] = curr.msg;
            return acc;
          }, {});
          setFormErrors(validationErrors);
          setError('Please correct the errors in the form.');
        } else {
          setError(errorData.message || 'Registration failed. Please try again.');
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      const errors = {};
      if (!formData.dssn.trim()) errors.dssn = 'DSSN is required';
      if (!formData.professionalType) errors.professionalType = 'Professional type is required';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setError('Please fill in all required fields');
        return;
      }
      
      setCurrentStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Step 1: Basic Information
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Your DSSN is required to verify your identity and link to your main Digital Liberia account.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="DSSN *"
            value={formData.dssn}
            onChange={(e) => handleInputChange('dssn', e.target.value)}
            error={!!formErrors.dssn}
            helperText={formErrors.dssn || 'Enter your Digital Social Security Number (15-20 characters)'}
            placeholder="e.g., LIB2024ABC123456"
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!formErrors.professionalType} required>
            <InputLabel>Professional Type *</InputLabel>
            <Select
              value={formData.professionalType}
              label="Professional Type *"
              onChange={(e) => handleInputChange('professionalType', e.target.value)}
            >
              {professionalTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {formErrors.professionalType && (
              <Typography variant="caption" color="error">
                {formErrors.professionalType}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        {formData.professionalType === 'doctor' && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Specialization (Optional)</InputLabel>
              <Select
                value={formData.specialization}
                label="Specialization (Optional)"
                onChange={(e) => handleInputChange('specialization', e.target.value)}
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec.value} value={spec.value}>
                    {spec.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Department (Optional)"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            placeholder="e.g., Emergency Department, Pediatrics"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Step 2: License & Facility Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="License Number *"
            value={formData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            error={!!formErrors.licenseNumber}
            helperText={formErrors.licenseNumber || 'Enter your official professional license number'}
            placeholder="e.g., MD-2024-12345"
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="License Expiry Date *"
              value={formData.licenseExpiry}
              onChange={(date) => handleInputChange('licenseExpiry', date)}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!formErrors.licenseExpiry,
                  helperText: formErrors.licenseExpiry || 'Select when your license expires',
                  required: true
                }
              }}
              minDate={dayjs()}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Facility Name (Optional)"
            value={formData.facilityName}
            onChange={(e) => handleInputChange('facilityName', e.target.value)}
            placeholder="e.g., John F. Kennedy Medical Center"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Facility Type (Optional)</InputLabel>
            <Select
              value={formData.facilityType}
              label="Facility Type (Optional)"
              onChange={(e) => handleInputChange('facilityType', e.target.value)}
            >
              {facilityTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            <strong>Important Notes:</strong>
            <ul>
              <li>Your DSSN must match your Digital Liberia account</li>
              <li>License information will be verified by administrators</li>
              <li>Verification typically takes 3-5 business days</li>
              <li>You'll receive email notification upon approval</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setTimeout(() => {
        setFormData({
          dssn: '',
          professionalType: '',
          licenseNumber: '',
          licenseExpiry: null,
          facilityName: '',
          facilityType: '',
          specialization: '',
          department: ''
        });
        setFormErrors({});
        setCurrentStep(1);
        setError('');
        setSuccess('');
      }, 300);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Healthcare Professional Registration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete your professional profile to access healthcare features
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        {/* Progress indicator */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: currentStep >= 1 ? 'primary.main' : 'grey.300',
                color: currentStep >= 1 ? 'white' : 'grey.700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              1
            </Box>
            <Box sx={{ flex: 1, height: 2, bgcolor: currentStep >= 2 ? 'primary.main' : 'grey.300' }} />
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: currentStep >= 2 ? 'primary.main' : 'grey.300',
                color: currentStep >= 2 ? 'white' : 'grey.700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              2
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color={currentStep >= 1 ? 'primary' : 'text.secondary'}>
              Basic Info
            </Typography>
            <Typography variant="caption" color={currentStep >= 2 ? 'primary' : 'text.secondary'}>
              License & Facility
            </Typography>
          </Box>
        </Box>
        
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        {currentStep === 2 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        {currentStep === 1 ? (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProfessionalVerificationModal;
