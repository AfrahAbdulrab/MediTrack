import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/constants';

const API_URL    = `${API_BASE_URL}/api/auth`;
const VITALS_URL = `${API_BASE_URL}/api/vitals`;

// ===== Get stored token =====
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// ===== Get Profile =====
export const getProfile = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token found');

   const url = `${API_BASE_URL}/api/auth/profile`;
    console.log('🌐 Fetching profile from:', url);
    console.log('🔑 Token:', token ? 'exists' : 'missing');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Status:', response.status);
    const data = await response.json();
console.log('📥 Data:', JSON.stringify(data));
if (!response.ok) throw new Error('Failed to fetch profile');
return data.user; 
  } catch (error) {
    console.error('❌ Get profile error:', error);
    throw error;
  }
};

// ===== Update Profile =====
export const updateProfile = async (profileData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) throw new Error('Failed to update profile');

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
};

// ===== Update Manual Vitals =====
export const updateVitalSigns = async (vitalsData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const payload = {
      bpSystolic:  vitalsData.bpSystolic  ? Number(vitalsData.bpSystolic)  : undefined,
      bpDiastolic: vitalsData.bpDiastolic ? Number(vitalsData.bpDiastolic) : undefined,
      bloodSugar:  vitalsData.bloodSugar  ? Number(vitalsData.bloodSugar)  : undefined,
      temperature: vitalsData.temperature ? Number(vitalsData.temperature) : undefined,
      recordedAt:  new Date().toISOString(),
    };

    console.log('📤 Sending vitals:', JSON.stringify(payload));

    const response = await fetch(`${API_URL}/vitals`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Response status:', response.status);
    const data = await response.json();
    console.log('📥 Response body:', JSON.stringify(data));

    if (!response.ok) throw new Error(data.message || 'Failed to update vitals');

    return {
      vitals: data.vitals || {
        bpSystolic:  payload.bpSystolic  || null,
        bpDiastolic: payload.bpDiastolic || null,
        bloodSugar:  payload.bloodSugar  || null,
        temperature: payload.temperature || null,
        recordedAt:  payload.recordedAt,
      }
    };
  } catch (error) {
    console.error('❌ Update vitals error:', error);
    throw error;
  }
};

// ===== Check Vitals Reminder =====
export const checkVitalsReminder = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/vitals-reminder`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Check reminder error:', error);
    return null;
  }
};

// ===== Forgot Password =====
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send verification code');
    return data;
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw error;
  }
};

// ===== Verify Reset Code =====
export const verifyResetCode = async (email, code) => {
  try {
    const response = await fetch(`${API_URL}/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Invalid verification code');
    return data;
  } catch (error) {
    console.error('❌ Verify code error:', error);
    throw error;
  }
};

// ===== Reset Password =====
export const resetPassword = async (email, newPassword) => {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to reset password');
    return data;
  } catch (error) {
    console.error('❌ Reset password error:', error);
    throw error;
  }
};

// ===== Upload Profile Image =====
export const uploadProfileImage = async (imageUri) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const formData = new FormData();
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('profileImage', {
      uri: imageUri,
      name: `profile.${fileType}`,
      type: `image/${fileType}`,
    });

    const response = await fetch(`${API_URL}/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image');
    return await response.json();
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

// ===== Upload Profile Photo =====
export const uploadProfilePhoto = async (formData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const url = `${API_BASE_URL}/api/user/profile/upload-photo`;
    console.log('📤 URL:', url);
    console.log('📤 Token:', token ? 'exists' : 'missing');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) throw new Error('Failed to upload photo');
    return await response.json();
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

export default {
  getAuthToken,
  getProfile,
  updateProfile,
  updateVitalSigns,
  checkVitalsReminder,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  uploadProfileImage,
  uploadProfilePhoto,
};