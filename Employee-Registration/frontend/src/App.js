import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, User, GraduationCap, Briefcase, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const UserDataApp = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sessionId, setSessionId] = useState('');
  
  // Form data state
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    phone_number: '',
    email: '',
    date_of_birth: ''
  });

  const [educationInfo, setEducationInfo] = useState({
    tenth_percentage: '',
    twelfth_percentage: '',
    graduation_marks: ''
  });

  const [experienceInfo, setExperienceInfo] = useState({
    company_name: '',
    domain: '',
    years_of_experience: '',
    last_salary: ''
  });

  // Initialize session on app load
  useEffect(() => {
    createSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        console.log('Session created:', data.session_id);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      // Fallback to generate session ID locally
      setSessionId(generateUUID());
    }
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  };

  // API call function
  const apiCall = async (endpoint, method, data = null) => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const config = {
        method,
        headers,
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveToRedis = async (pageData, pageType) => {
    try {
      const response = await apiCall(`/api/${pageType}`, 'POST', pageData);
      if (response.success) {
        setMessage({ type: 'success', text: `${pageType} data saved successfully!` });
        
        // Update session ID if returned from server
        if (response.session_id && response.session_id !== sessionId) {
          setSessionId(response.session_id);
        }
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save data. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const loadFromRedis = async (pageType) => {
    try {
      const response = await apiCall(`/api/${pageType}`, 'GET');
      if (response.success && response.data) {
        if (pageType === 'personal') {
          setPersonalInfo(response.data);
        } else if (pageType === 'education') {
          setEducationInfo(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load data from Redis:', error);
    }
  };

  const submitToPostgreSQL = async () => {
    try {
      const response = await apiCall('/api/submit-final', 'POST');
      if (response) {
        setMessage({ 
          type: 'success', 
          text: `All data submitted successfully! User ID: ${response.id}` 
        });
        
        // Reset form after successful submission
        setTimeout(() => {
          setPersonalInfo({ name: '', phone_number: '', email: '', date_of_birth: '' });
          setEducationInfo({ tenth_percentage: '', twelfth_percentage: '', graduation_marks: '' });
          setExperienceInfo({ company_name: '', domain: '', years_of_experience: '', last_salary: '' });
          setCurrentPage(1);
          setMessage({ type: '', text: '' });
          createSession(); // Create new session for next user
        }, 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit data. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Load data when navigating to pages
  useEffect(() => {
    if (sessionId && currentPage === 1) {
      loadFromRedis('personal');
    } else if (sessionId && currentPage === 2) {
      loadFromRedis('education');
    }
  }, [currentPage, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const validatePersonalInfo = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    
    if (!personalInfo.name.trim()) return 'Name is required';
    if (!phoneRegex.test(personalInfo.phone_number)) return 'Phone number must be 10 digits';
    if (!emailRegex.test(personalInfo.email)) return 'Valid email is required';
    if (!personalInfo.date_of_birth) return 'Date of birth is required';
    return null;
  };

  const validateEducationInfo = () => {
    const percentage10 = parseFloat(educationInfo.tenth_percentage);
    const percentage12 = parseFloat(educationInfo.twelfth_percentage);
    const gradMarks = parseFloat(educationInfo.graduation_marks);
    
    if (isNaN(percentage10) || percentage10 < 0 || percentage10 > 100) return '10th percentage must be between 0-100';
    if (isNaN(percentage12) || percentage12 < 0 || percentage12 > 100) return '12th percentage must be between 0-100';
    if (isNaN(gradMarks) || gradMarks < 0 || gradMarks > 100) return 'Graduation marks must be between 0-100';
    return null;
  };

  const validateExperienceInfo = () => {
    const years = parseFloat(experienceInfo.years_of_experience);
    const salary = parseFloat(experienceInfo.last_salary);
    
    if (!experienceInfo.company_name.trim()) return 'Company name is required';
    if (!experienceInfo.domain.trim()) return 'Domain is required';
    if (isNaN(years) || years < 0) return 'Years of experience must be a positive number';
    if (isNaN(salary) || salary < 0) return 'Last salary must be a positive number';
    return null;
  };

  const handleNext = async () => {
    let validationError = null;
    let dataToSave = null;
    let pageType = '';

    if (currentPage === 1) {
      validationError = validatePersonalInfo();
      dataToSave = personalInfo;
      pageType = 'personal';
    } else if (currentPage === 2) {
      validationError = validateEducationInfo();
      dataToSave = educationInfo;
      pageType = 'education';
    }

    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    await saveToRedis(dataToSave, pageType);
    setCurrentPage(currentPage + 1);
  };

  const handlePrevious = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleSubmit = async () => {
    const validationError = validateExperienceInfo();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Save experience data to Redis first
    await saveToRedis(experienceInfo, 'experience');
    // Then submit all data to PostgreSQL
    await submitToPostgreSQL();
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-full">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
          <p className="text-gray-600">Please provide your basic details</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <input
            type="text"
            value={personalInfo.name}
            onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={personalInfo.phone_number}
            onChange={(e) => setPersonalInfo({...personalInfo, phone_number: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter 10-digit phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <input
            type="date"
            value={personalInfo.date_of_birth}
            onChange={(e) => setPersonalInfo({...personalInfo, date_of_birth: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderEducationInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-green-100 rounded-full">
          <GraduationCap className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Education Background</h2>
          <p className="text-gray-600">Please provide your academic details</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">10th Percentage *</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={educationInfo.tenth_percentage}
            onChange={(e) => setEducationInfo({...educationInfo, tenth_percentage: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter percentage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">12th Percentage *</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={educationInfo.twelfth_percentage}
            onChange={(e) => setEducationInfo({...educationInfo, twelfth_percentage: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter percentage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Marks *</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={educationInfo.graduation_marks}
            onChange={(e) => setEducationInfo({...educationInfo, graduation_marks: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter marks/percentage"
          />
        </div>
      </div>
    </div>
  );

  const renderExperienceInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-full">
          <Briefcase className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Experience Information</h2>
          <p className="text-gray-600">Please provide your professional details</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
          <input
            type="text"
            value={experienceInfo.company_name}
            onChange={(e) => setExperienceInfo({...experienceInfo, company_name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Domain *</label>
          <input
            type="text"
            value={experienceInfo.domain}
            onChange={(e) => setExperienceInfo({...experienceInfo, domain: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Software Development, Marketing"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={experienceInfo.years_of_experience}
            onChange={(e) => setExperienceInfo({...experienceInfo, years_of_experience: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter years of experience"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Salary *</label>
          <input
            type="number"
            min="0"
            value={experienceInfo.last_salary}
            onChange={(e) => setExperienceInfo({...experienceInfo, last_salary: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter last salary"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Data Management</h1>
          <p className="text-gray-600">Complete all three steps to submit your information</p>
          {sessionId && (
            <p className="text-xs text-gray-500 mt-2">Session ID: {sessionId}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center ${currentPage >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPage >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Personal</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentPage >= 2 ? 'bg-blue-600' : 'bg-gray-200'} rounded`}></div>
            
            <div className={`flex items-center ${currentPage >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPage >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Education</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentPage >= 3 ? 'bg-green-600' : 'bg-gray-200'} rounded`}></div>
            
            <div className={`flex items-center ${currentPage >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPage >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Experience</span>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          {currentPage === 1 && renderPersonalInfo()}
          {currentPage === 2 && renderEducationInfo()}
          {currentPage === 3 && renderExperienceInfo()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentPage > 1 && (
            <button
              onClick={handlePrevious}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>
          )}
          
          <div className="flex-1"></div>
          
          {currentPage < 3 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>{loading ? 'Saving...' : 'Next'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Submitting...' : 'Submit'}</span>
            </button>
          )}
        </div>

        {/* API Status (for development) */}
        {loading && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 animate-pulse">
              Processing API request to {API_BASE_URL}...
            </p>
          </div>
        )}
        
        {/* Connection Status */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Backend: {API_BASE_URL} | 
            Status: {sessionId ? 'Connected' : 'Connecting...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDataApp;