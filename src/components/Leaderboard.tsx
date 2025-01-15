import { db } from '@/config/firebase';
import { getTopScores } from '@/config/scoring';
import { useUser } from '@/context/UserContext';
import { GameScore } from '@/types';
import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import '../styles/Leaderboard.css';

const Leaderboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user } = useUser();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const topScores = await getTopScores(10);
        console.info('[Leaderboard] Initial data fetched:', topScores);
        setLeaderboard(topScores);
        setIsLoading(false);
      } catch (error) {
        console.error('[Leaderboard] Error fetching initial data:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchInitialData();

    // Set up real-time updates
    console.info('[Leaderboard] Setting up real-time updates');
    const scoresRef = collection(db, 'scores');
    const topScoresQuery = query(
      scoresRef,
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(topScoresQuery, (snapshot) => {
      console.debug('[Leaderboard] Real-time update received, docs:', snapshot.docs.length);
      const updatedScores: GameScore[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId,
          username: data.username,
          score: data.score
        };
      });
      setLeaderboard(updatedScores);
      console.debug('[Leaderboard] Processed scores:', updatedScores);

      // Find user's rank
      if (user?.uid) {
        console.debug('[Leaderboard] Finding rank for user:', user.uid);
        const userIndex = updatedScores.findIndex(score => score.userId === user.uid);
        if (userIndex !== -1) {
          console.debug('[Leaderboard] User found in top 10, rank:', userIndex + 1);
          setUserRank(userIndex + 1);
        } else {
          console.debug('[Leaderboard] User not in top 10, querying position');
          // If user not in top 10, query their position
          const getUserRank = async () => {
            try {
              const userScoreQuery = query(
                scoresRef,
                where('score', '>', updatedScores[updatedScores.length - 1].score)
              );

              const userScoreSnapshot = await getDocs(userScoreQuery);
              const rank = userScoreSnapshot.size + 10;

              console.debug('[Leaderboard] User rank calculated:', rank);
              setUserRank(rank);
            } catch (error) {
              console.error('[Leaderboard] Error calculating user rank:', error);
              window.location.reload();
            }
          };
          getUserRank();
        }
      }
    }, (error) => {
      console.error('[Leaderboard] Real-time update error:', error);
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      console.info('[Leaderboard] Cleaning up subscriptions');
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.uid]);

  useEffect(() => {
    const handleKeyPress = (event: { key: string; }) => {
      if (event.key === 'L' || event.key === 'l') { 
        setIsOpen(prevState => !prevState);
      }
    };
  
    // Only add the event listener if the game is active
    if (document.pointerLockElement) {
      window.addEventListener('keydown', handleKeyPress);
    }
  
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const toggleLeaderboard = () => {
    setIsOpen(!isOpen);
  };

  if (isLoading) {
    return <div className="leaderboardContainer loading">Loading leaderboard...</div>;
  }

  
  return (
    <div className={`leaderboardContainer ${isOpen ? 'open' : ''}`}>
      <button 
        className="toggleButton"
        onClick={(e) => {
          e.preventDefault();
          e.currentTarget.blur(); // Remove focus after click
          toggleLeaderboard();
        }}
        onKeyDown={(e) => {
          // Prevent spacebar from triggering the button
          if (e.code === 'Space') {
            e.preventDefault();
          }
        }}
        aria-expanded={isOpen}
        tabIndex={-1} // Prevent focus via keyboard
      >
        {isOpen ? 'Hide Leaderboard' : 'Show Leaderboard'}
      </button>
      
      {isOpen && (
        <div className="leaderboard">
          <h2>Top Players</h2>
          {isOffline && <span className="offline-indicator">Offline Mode</span>}
          <div className="entries">
            {leaderboard.map((entry, index) => (
              <div 
                key={index} 
                className={`entry ${entry.userId === user?.uid ? 'currentUser' : ''}`}
              >
                <span className="rank">{index + 1}</span>
                <span className="username">{entry.username}</span>
                <span className="score">{entry.score}</span>
              </div>
            ))}
          </div>
          {user && userRank && userRank > 10 && (
            <div className={`entry currentUser userRank`}>
              <span className="rank">#{userRank}</span>
              <span className="username">{user.username}</span>
              <span className="score">
                {leaderboard.find(entry => entry.userId === user.uid)?.score || 0}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
