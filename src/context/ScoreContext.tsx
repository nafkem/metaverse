import { getTopScores, saveScore } from '@/config/scoring';
import { GameScore, ScoreContextType } from '@/types';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from './UserContext';

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export const ScoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [lastSavedScore, setLastSavedScore] = useState(0);
  const [topScores, setTopScores] = useState<GameScore[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  const INACTIVITY_TIMEOUT = 10 * 1000; // 10 seconds
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
  const expiryTime = useRef(Date.now() + INACTIVITY_TIMEOUT); 

  // console.log('[ScoreContext] Game state:', isGameActive);
  // console.log("expiryTime",Date.now() <= expiryTime.current);
  // console.log("user",user);
  // console.log("isUserActive",isActive);
  // console.log("isOnline",navigator.onLine);
  

  const updateExpiryTime = () => {
    if (user && isGameActive) {
      expiryTime.current = Date.now() + INACTIVITY_TIMEOUT;
      setIsActive(true);
      console.info('[ScoreContext] User activity detected');
    }
  };

  const checkForInactivity = () => {
    if (Date.now() >= expiryTime.current && user && isGameActive) {
      setIsActive(false);
      console.info('[ScoreContext] User became inactive - saving current session');
    }
  };

  // Update expiry time on any user activity
  useEffect(() => {
    if (user && isGameActive) {
      updateExpiryTime();
      
      activityEvents.forEach(event => {
        window.addEventListener(event, updateExpiryTime);
      });

      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, updateExpiryTime);
        });
      };
    }
  }, [user, isGameActive]);

  // checking for inactivity
  useEffect(() => {
    if (user && isGameActive) {
      const inactivityInterval = setInterval(checkForInactivity, 1000);
      return () => clearInterval(inactivityInterval);
    }
  }, [user, isGameActive]);

  // update score every 20 seconds
  const updateScore = async () => {
    if (!isActive || !startTime) {
      console.info('[ScoreContext] Score update skipped - user is inactive or no start time');
      return;
    };

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const newScore = Math.floor(elapsedSeconds / 20);

    if (newScore !== score) {
      setScore(newScore);

      if (user) {
        const increment = newScore - lastSavedScore;
        const scoreData = {
          userId: user.uid,
          username: user.username || 'Anonymous',
          score: increment
        } as GameScore;

        try {
          await saveScore(scoreData);
          setLastSavedScore(newScore);
          const latestTopScores = await getTopScores(10);
          setTopScores(latestTopScores);
        } catch (error) {
          console.error('[ScoreContext] Error saving or fetching top scores:', error);
        }
      }
    }
  };

  useEffect(() => {
    let scoreUpdateInterval: NodeJS.Timeout | null = null;

    if (isActive && startTime && user) {
      scoreUpdateInterval = setInterval(updateScore, 20000);
      updateScore(); // Initial score update
    }

    return () => {
      if (scoreUpdateInterval) {
        clearInterval(scoreUpdateInterval);
      }
    };
  }, [isActive, startTime, score, user]);

  const startScoring = () => {
    setStartTime(Date.now());
    setIsActive(true);
    setScore(0);
    setLastSavedScore(0);
  };

  const stopScoring = async () => {
    setIsActive(false);
    setStartTime(null);
    setScore(0);
    setLastSavedScore(0);
  };

  const toggleGameState = (active: boolean) => {
    setIsGameActive(active);
  };

  return (
    <ScoreContext.Provider
      value={{
        score,
        startTime,
        isActive,
        isGameActive,
        startScoring,
        stopScoring,
        toggleGameState,
        topScores,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
};

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (context === undefined) {
    throw new Error('useScore must be used within a ScoreProvider');
  }
  return context;
};
