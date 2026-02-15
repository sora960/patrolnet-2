import './RegisterModal.css';

import React, { useState } from 'react';
import { BASE_URL } from '../../config';
import { 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEye, 
  FaEyeSlash,
  FaUserPlus,
  FaCheck,
  FaExclamationTriangle,
  FaShieldAlt,
  FaUsers,
  FaHome,
  FaPaperPlane
} from 'react-icons/fa';

const RegisterModal = ({ show, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
    agreeTerms: false,
    emailVerificationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const roles = [
    { 
      value: "Resident", 
      label: "Resident", 
      icon: <FaHome />,
      description: "Community Member",
      color: "#27ae60"
    }
  ];

  if (!show) {
    return null;
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Email verification functions
  const sendEmailVerification = async () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/pre-register-send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationSent(true);
        setResendCooldown(60); // 60 seconds cooldown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        alert("Verification code sent to your email!");
      } else {
        alert(`Failed to send verification: ${data.message}`);
      }
    } catch (error) {
      console.error("Email verification error:", error);
      alert("Failed to send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!formData.emailVerificationCode) {
      setErrors(prev => ({ ...prev, emailVerificationCode: 'Please enter the verification code' }));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/pre-register-verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.emailVerificationCode
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailVerified(true);
        setErrors(prev => ({ ...prev, emailVerificationCode: '' }));
        alert("Email verified successfully!");
      } else {
        setErrors(prev => ({ ...prev, emailVerificationCode: data.message || 'Invalid verification code' }));
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setErrors(prev => ({ ...prev, emailVerificationCode: 'Verification failed. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      } else if (!emailVerified) {
        newErrors.email = 'Please verify your email address';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }
    
    if (step === 2) {
      if (!formData.username.trim()) newErrors.username = 'Username is required';
      if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (step === 3) {
      if (!formData.role) newErrors.role = 'Please select a role';
      if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(3)) {
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            role: formData.role,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            address: formData.address,
            status: 'Pending' // Set status to Pending for admin approval
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert("Account created successfully! Your account is now pending approval.");
          onClose();
        } else {
          alert(`Registration failed: ${data.message}`);
        }
      } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred during registration. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

const getStepTitle = () => {
  switch (currentStep) {
    case 1:
      return <span style={{ color: "#2c3e50" }}>Personal Information</span>;
    case 2:
      return <span style={{ color: "#16a085" }}>Account Security</span>;
    case 3:
      return <span style={{ color: "#2980b9" }}>Role & Confirmation</span>;
    default:
      return <span style={{ color: "#8e44ad" }}>Create Account</span>;
  }
};


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">
              <FaUserPlus />
            </div>
            <div>
              <h2 style={{ color: "#2c3e50" }}>Create New Account</h2>
              <p>{getStepTitle()}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="progress-container">
          <div className="progress-steps">
            {[1, 2, 3].map((step) => (
              <div 
                key={step} 
                className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
              >
                <div className="step-circle">
                  {currentStep > step ? <FaCheck /> : step}
                </div>
                <span className="step-label">
                  {step === 1 ? 'Personal' : step === 2 ? 'Security' : 'Role'}
                </span>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="form-content">
          {currentStep === 1 && (
            <div className="step-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <div className="input-wrapper-horizontal">
                    <div className="input-icon-external">
                      <FaUser />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`form-input-horizontal ${errors.firstName ? 'error' : ''}`}
                    />
                  </div>
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="input-wrapper-horizontal">
                    <div className="input-icon-external">
                      <FaUser />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`form-input-horizontal ${errors.lastName ? 'error' : ''}`}
                    />
                  </div>
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              {/* Email Verification Section */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="email-verification-section">
                  <div className="input-wrapper-horizontal">
                    <div className="input-icon-external">
                      <FaEnvelope />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`form-input-horizontal ${errors.email ? 'error' : ''} ${emailVerified ? 'verified' : ''}`}
                      disabled={emailVerified}
                    />
                    {emailVerified && (
                      <div className="verification-status verified">
                        <FaCheck />
                      </div>
                    )}
                  </div>
                  
                  {!emailVerified && (
                    <div className="email-verification-controls">
                      <button
                        type="button"
                        className="verification-button"
                        onClick={sendEmailVerification}
                        disabled={isLoading || resendCooldown > 0}
                      >
                        <FaPaperPlane />
                        {verificationSent ? 
                          (resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code') : 
                          'Send Verification'
                        }
                      </button>
                    </div>
                  )}

                  {verificationSent && !emailVerified && (
                    <div className="verification-code-section">
                      <div className="input-wrapper-horizontal">
                        <input
                          type="text"
                          placeholder="Enter 6-digit verification code"
                          value={formData.emailVerificationCode}
                          onChange={(e) => handleInputChange('emailVerificationCode', e.target.value)}
                          className={`form-input-horizontal ${errors.emailVerificationCode ? 'error' : ''}`}
                          maxLength={6}
                        />
                        <button
                          type="button"
                          className="verify-code-button"
                          onClick={verifyEmailCode}
                          disabled={isLoading || !formData.emailVerificationCode}
                        >
                          Verify
                        </button>
                      </div>
                      {errors.emailVerificationCode && (
                        <span className="error-text">{errors.emailVerificationCode}</span>
                      )}
                    </div>
                  )}
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrapper-horizontal">
                  <div className="input-icon-external">
                    <FaPhone />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`form-input-horizontal ${errors.phone ? 'error' : ''}`}
                  />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <div className="input-wrapper-horizontal">
                  <div className="input-icon-external">
                    <FaMapMarkerAlt />
                  </div>
                  <textarea
                    id="address"
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`form-textarea-horizontal ${errors.address ? 'error' : ''}`}
                    rows={3}
                  />
                </div>
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper-horizontal">
                  <div className="input-icon-external">
                    <FaUser />
                  </div>
                  <input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`form-input-horizontal ${errors.username ? 'error' : ''}`}
                  />
                </div>
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper-horizontal">
                  <div className="input-icon-external">
                    <FaLock />
                  </div>
                  <div className="input-with-toggle">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`form-input-horizontal ${errors.password ? 'error' : ''}`}
                    />
                    <button 
                      type="button"
                      className="password-visibility-external"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper-horizontal">
                  <div className="input-icon-external">
                    <FaLock />
                  </div>
                  <div className="input-with-toggle">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`form-input-horizontal ${errors.confirmPassword ? 'error' : ''}`}
                    />
                    <button 
                      type="button"
                      className="password-visibility-external"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li className={formData.password.length >= 6 ? 'valid' : ''}>
                    At least 6 characters long
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                    Contains uppercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                    Contains number
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-form">
              <div className="form-group">
                <label>Select Your Role:</label>
                <div className="role-selection-grid">
                  {roles.map((role) => (
                    <div
                      key={role.value}
                      className={`role-card-register ${formData.role === role.value ? 'selected' : ''}`}
                      onClick={() => handleInputChange('role', role.value)}
                      style={formData.role === role.value ? {
                        borderColor: role.color,
                        backgroundColor: `${role.color}15`
                      } : {}}
                    >
                      <div className="role-icon" style={{color: role.color}}>
                        {role.icon}
                      </div>
                      <h4>{role.label}</h4>
                      <p>{role.description}</p>
                    </div>
                  ))}
                </div>
                {errors.role && <span className="error-text">{errors.role}</span>}
              </div>

              <div className="summary-section">
                <h4>Account Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Name:</span>
                    <span>{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Email:</span>
                    <span>
                      {formData.email}
                      {emailVerified && <FaCheck className="verified-icon" />}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Username:</span>
                    <span>{formData.username}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Role:</span>
                    <span>{roles.find(r => r.value === formData.role)?.label || 'Not selected'}</span>
                  </div>
                </div>
              </div>

              <div className="terms-section">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    I agree to the <a href="#terms">Terms and Conditions</a> and <a href="#privacy">Privacy Policy</a>
                  </span>
                </label>
                {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <div className="footer-actions">
            {currentStep > 1 && (
              <button 
                type="button" 
                className="modal-button modal-button-secondary"
                onClick={handlePrevious}
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button 
                type="button" 
                className="modal-button modal-button-primary"
                onClick={handleNext}
              >
                Next Step
              </button>
            ) : (
              <button 
                type="button" 
                className={`modal-button modal-button-primary ${isLoading ? 'loading' : ''}`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;