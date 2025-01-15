import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// const loadingTips = [
//   "Did you know? Diamonds are found between layers 5-12!",
//   "Pro tip: Never dig straight down!",
//   "Hint: Creepers are afraid of cats!",
//   "Fun fact: A Minecraft day is 20 minutes long!",
//   "Remember: Always carry a water bucket!",
// ];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useUser();
  // const randomTip = loadingTips[Math.floor(Math.random() * loadingTips.length)];

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {children}
      {loading && (
        <div 
          className="minecraft-loader-container" 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000 
          }}
        >
          <div className="minecraft-loading-text">Loading</div>
          <div className="minecraft-progress-bar" />
          {/* <div className="minecraft-tip">{randomTip}</div> */}
        </div>
      )}
    </div>
  );
};

export default ProtectedRoute;
