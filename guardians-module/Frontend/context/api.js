import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.4:5001'; // Guardian backend port 5001

export const getToken = async () => {
  return await AsyncStorage.getItem('guardianToken');
};

export const authFetch = async (endpoint, options = {}) => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return response.json();
};

export default API_BASE_URL;