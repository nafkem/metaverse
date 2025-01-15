import { useScore } from '@/context/ScoreContext';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/logoutButton.css';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const {stopScoring} = useScore()

  const handleLogout = async () => {
    console.log('[Auth] User logging out');
    stopScoring();
    setUser(null);
    localStorage.removeItem('lastActiveUser');
    localStorage.removeItem('sessionStart');
    navigate('/', { replace: true });
  };

  return (
    <button
      className="logout-button"
      onClick={handleLogout}
      aria-label="Logout"
      tabIndex={-1}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
