import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.5:5000/api/auth';

// Get stored token
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Get Profile
export const getProfile = async () => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('❌ Get profile error:', error);
    throw error;
  }
};

// Update Profile
export const updateProfile = async (profileData) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
};

// ✅ Forgot Password - Send Reset Code
export const forgotPassword = async (email) => {
  try {
    console.log('📩 Sending forgot password request for:', email);

    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification code');
    }

    console.log('✅ Forgot password response:', data);
    return data;
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw error;
  }
};

// ✅ Verify Reset Code
export const verifyResetCode = async (email, code) => {
  try {
    console.log('🔍 Verifying code for:', email);

    const response = await fetch(`${API_URL}/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Invalid verification code');
    }

    console.log('✅ Code verified successfully');
    return data;
  } catch (error) {
    console.error('❌ Verify code error:', error);
    throw error;
  }
};

// ✅ Reset Password
export const resetPassword = async (email, newPassword) => {
  try {
    console.log('🔐 Resetting password for:', email);

    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    console.log('✅ Password reset successfully');
    return data;
  } catch (error) {
    console.error('❌ Reset password error:', error);
    throw error;
  }
};

// Report Lost Watch
export const reportLostWatch = async (data) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('📡 Reporting lost watch:', data);

    const response = await fetch(`${API_URL.replace('/auth', '')}/lost-watch/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to report lost watch');
    }

    const result = await response.json();
    console.log('✅ Report successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Report error:', error);
    throw error;
  }
};

// Upload Profile Image
export const uploadProfileImage = async (imageUri) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('📤 Uploading profile image...');

    // Create form data
    const formData = new FormData();
    
    // Get file extension
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

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    console.log('✅ Image uploaded successfully');
    return data;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

// ✅ Default Export
export default {
  getAuthToken,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  reportLostWatch,
  uploadProfileImage,
};