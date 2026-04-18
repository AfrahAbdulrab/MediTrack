// Frontend/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { API_ENDPOINTS } from '../services/api';

export const authService = {
  // Sign Up
  signup: async (userData) => {
    try {
      console.log('🔄 Starting signup...');
      console.log('📍 Endpoint:', API_ENDPOINTS.SIGNUP);
      console.log('📦 Data:', userData);
      
      const response = await api.post('/api/auth/signup', userData);
      
      console.log('✅ Signup successful:', response.data);
      
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user || response.data));
        
        // ✅ userId alag se save karo
        const userId = response.data.user?._id || response.data._id || response.data.user?.id || response.data.id;
        if (userId) {
          await AsyncStorage.setItem('userId', userId);
          console.log('💾 userId saved:', userId);
        }

        console.log('💾 Token saved');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { message: 'Cannot connect to server. Please check your internet connection.' };
      } else {
        throw { message: error.message || 'Signup failed' };
      }
    }
  },

  // Login
  login: async (credentials) => {
    try {
      console.log('🔄 Starting login...');
      const response = await api.post('/api/auth/login', credentials);
      
      console.log('✅ Login successful');
      
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user || response.data));

        // ✅ userId alag se save karo
        const userId = response.data.user?._id || response.data._id || response.data.user?.id || response.data.id;
        if (userId) {
          await AsyncStorage.setItem('userId', userId);
          console.log('💾 userId saved:', userId);
        }

        // ✅ userName bhi save karo emergency alert ke liye
        const userName = response.data.user?.name || response.data.name;
        if (userName) {
          await AsyncStorage.setItem('userName', userName);
          console.log('💾 userName saved:', userName);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { message: 'Cannot connect to server. Please check your internet connection.' };
      } else {
        throw { message: error.message || 'Login failed' };
      }
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userName');
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      return userDataStr ? JSON.parse(userDataStr) : null;
    } catch (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
  },

  // Check if authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },
};

export default authService;