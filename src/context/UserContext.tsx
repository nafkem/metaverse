import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  uid: string;
  username: string;
  walletId: string;
  points?: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  updatePoints: (newPoints: number) => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  updatePoints: () => {},
  setLoading: () => {}
});

const SESSION_DURATION = 1000 * 60 * 60; // 1 hour
const ACTIVITY_TIMEOUT = 1000 * 60 * 30; // 30 minutes
const SESSION_CHECK_INTERVAL = 1000 * 60; // 1 minute

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('lastActiveUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Handle session storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('lastActiveUser', JSON.stringify({
        uid: user.uid,
        username: user.username
      }));
      localStorage.setItem('sessionStart', Date.now().toString());
    } else {
      localStorage.removeItem('lastActiveUser');
      localStorage.removeItem('sessionStart');
    }
  }, [user]);

  // Session timeout check
  useEffect(() => {
    if (user) {
      const checkSession = () => {
        const sessionStart = localStorage.getItem('sessionStart');
        if (sessionStart && Date.now() - Number(sessionStart) > SESSION_DURATION) {
          setUser(null);
        }
      };

      const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // User activity monitoring
  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const resetActivityTimer = () => {
      if (activityTimer) clearTimeout(activityTimer);
      if (user) {
        activityTimer = setTimeout(() => {
          setUser(null);
        }, ACTIVITY_TIMEOUT);
      }
    };

    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetActivityTimer();
    };

    if (user) {
      activities.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      resetActivityTimer();
    }

    return () => {
      activities.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimer) clearTimeout(activityTimer);
    };
  }, [user]);

  const updatePoints = (newPoints: number) => {
    if (user) {
      setUser({ ...user, points: newPoints });
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, updatePoints, setLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
