import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from './AuthContext';

// Create context
const UserProfileContext = createContext(null);

// Custom hook to use the user profile context
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

// Provider component that will wrap your app
export const UserProfileProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState({
    avatarUrl: '/dummy1.jpg', // Default avatar
    wallpaper: '/assets/wallpapers/wallpaper1.jpg', // Default wallpaper
    characterName: '',
    statusMessage: '',
    favoritePet: null,
    selectedAchievements: [],
    isLoading: true
  });

  // Fetch user profile on auth change
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    
    if (user && user.id) {
      fetchUserProfile(user.id);
    } else {
      // Reset profile if user is not logged in
      setProfileData(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [user, authLoading]);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      setProfileData(prev => ({ ...prev, isLoading: true }));
      
      // Fetch user profile data
      const response = await axios.get(`${API_URL}/users/${userId}/profile`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.data && response.data.success) {
        const userData = response.data.profile || {};
        
        setProfileData({
          avatarUrl: userData.avatar_url || '/dummy1.jpg',
          wallpaper: userData.wallpaper || '/assets/wallpapers/wallpaper1.jpg',
          characterName: userData.username || userData.display_name || 'Character name',
          statusMessage: userData.status_message || '',
          favoritePet: userData.favorite_pet ? {
            id: userData.favorite_pet,
            name: userData.favorite_pet_name || '',
            image_url: userData.favorite_pet_image || ''
          } : null,
          selectedAchievements: userData.displayed_achievements || [],
          isLoading: false
        });
      } else {
        throw new Error('Invalid profile data format');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfileData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Function to update profile (used after actions that change profile)
  const updateUserProfile = async (updates) => {
    if (!user || !user.id) return;
    
    try {
      // Optimistically update local state first
      setProfileData(prev => ({
        ...prev,
        ...updates
      }));
      
      // Then update the backend
      await axios.post(`${API_URL}/users/${user.id}/update-profile`, updates);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      // If there's an error, reload the profile to ensure consistency
      fetchUserProfile(user.id);
    }
  };

  const value = {
    ...profileData,
    fetchUserProfile,
    updateUserProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
