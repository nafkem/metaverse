import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/NotFound.css';

const NotFound = () => {
  const { user} = useUser();
  const navigate = useNavigate();

  useEffect(() => {
      setTimeout(() => {
        navigate(user ? '/game' : '/', { replace: true });
      }, 2000);
  }, [user, navigate]);

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Oops! World Not Found</p>
        <p className="notfound-text">Respawning in another dimension...</p>
      </div>
    </div>
  );
};

export default NotFound;
