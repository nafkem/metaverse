import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authenticateUser } from "./config/firebase";
import { useScore } from "./context/ScoreContext";
import { useUser } from './context/UserContext';
import "./styles/auth.css";
import { validateUsername } from './utils/validation';

const AuthForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  const [formData, setFormData] = useState({ username: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {toggleGameState} = useScore();

  // Get wallet address from location state
  const walletAddress = location.state?.walletAddress;

  useEffect(() => {
    toggleGameState(false);
    if (!walletAddress) {
      console.log('No wallet address found. Redirecting to wallet connect...');
      navigate('/', {replace: true});
    }
  }, [walletAddress, navigate]);

  if (!walletAddress) {
    return null;
  }

  const handleChange = (e: { target: { name: string; value: string; }; }) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const usernameValidation = validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        setError(usernameValidation.error as string);
        return;
      }

      const result = await authenticateUser(formData.username, walletAddress);
      
      if (result.success && result.user) {
        setUser(result.user);
        setSuccessMessage("Authentication successful! Redirecting to game...");
        setTimeout(() => {
          navigate("/game");
        }, 1000);
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      console.error('[Auth] Error:', err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h1 className="auth-title">404 Metaverse</h1>
          <div className="auth-subtitle">Begin Your Adventure</div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Choose your username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                className="form-input"
                required
              />
            </div>
            <small className="input-hint">This will be your in-game identity</small>
          </div>
          
          <div className="wallet-info">
            <div className="wallet-label">Connected Wallet</div>
            <div className="wallet-address">
              <span className="address-text">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              <div className="connection-status">
                <span className="status-dot"></span>
                Connected
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Processing...</span>
              </>
            ) : (
              'Enter Metaverse'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
