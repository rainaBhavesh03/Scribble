'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  loading: true,
  setIsLoggedIn: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        console.log("Checking login status...");
        const response = await axios.get('/api/users/checklogin');
        console.log("API response:", response.data);
        setIsLoggedIn(response.data.success);
      } catch (error) {
        console.error('Failed to check login status:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
        console.log("Finished checking login status. Loading set to false.");
      }
    };

    checkLogin();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth (){
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

