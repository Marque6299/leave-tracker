import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getSession, getCurrentUser } from '../services/supabase';
import { fetchUserProfile } from '../services/userService';
import { checkUserRole } from '../services/userService';

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Check for existing session
        const { data: { session } } = await getSession();
        
        if (session) {
          const { data: { user: authUser }, error: userError } = await getCurrentUser();
          
          if (userError) throw userError;
          
          if (authUser) {
            setUser(authUser);
            
            // Fetch user profile details
            const { data: profileData, error: profileError } = await fetchUserProfile(authUser.id);
            
            if (!profileError && profileData) {
              setProfile(profileData);
              
              // Fetch user roles
              await fetchUserRoles(authUser.id);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setSessionChecked(true);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: { user: authUser } } = await getCurrentUser();
          setUser(authUser);
          
          // Fetch user profile details
          const { data: profileData } = await fetchUserProfile(authUser.id);
          
          if (profileData) {
            setProfile(profileData);
            
            // Fetch user roles
            await fetchUserRoles(authUser.id);
          }
          
          setSessionChecked(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setUserRoles([]);
        }
      }
    );

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Helper to fetch user roles
  const fetchUserRoles = async (userId) => {
    try {
      // Check for each role type (simplified for this implementation)
      const roles = [];
      
      const { hasRole: isAdmin } = await checkUserRole(userId, 'admin');
      if (isAdmin) roles.push('admin');
      
      const { hasRole: isSupervisor } = await checkUserRole(userId, 'supervisor');
      if (isSupervisor) roles.push('supervisor');
      
      const { hasRole: isEmployee } = await checkUserRole(userId, 'employee');
      if (isEmployee) roles.push('employee');
      
      setUserRoles(roles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles(['employee']); // Default to employee role on error
    }
  };

  // Check if user has a specific role
  const hasRole = (roleName) => {
    return userRoles.includes(roleName);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await fetchUserProfile(user.id);
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  // Context value
  const value = {
    user,
    profile,
    userRoles,
    loading,
    sessionChecked,
    isAuthenticated,
    hasRole,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 