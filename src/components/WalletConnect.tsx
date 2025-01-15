import { useScore } from '@/context/ScoreContext';
import { useConnectWallet } from '@web3-onboard/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const WalletConnect = () => {
  const navigate = useNavigate();
  const [{ wallet, connecting }, connect] = useConnectWallet();
  const { toggleGameState } = useScore();

  useEffect(() => {
    // If wallet is connected, redirect to login
    if (wallet) {
      const walletAddress = wallet.accounts[0].address;
      navigate('/login', { state: { walletAddress }, replace: true });
    }
    toggleGameState(false);
  }, [wallet, navigate]);

  return (
    <div className="wallet-connect-container">
      <div className="wallet-connect-content">
        <div className="wallet-connect-header">
          <h1 className="game-title">404 Metaverse</h1>
          <div className="title-underline"></div>
        </div>
        
        <div className="wallet-connect-body">
          <h2>Welcome to the Game</h2>
          <p className="wallet-connect-description">
            Connect your wallet to start your adventure in the metaverse
          </p>
          
          <button 
            className="wallet-connect-button"
            disabled={connecting} 
            onClick={() => connect()}
          >
            <span className="wallet-icon">💳</span>
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          {connecting && (
            <div className="connecting-indicator">
              <div className="connecting-spinner"></div>
              <p>Connecting to your wallet...</p>
            </div>
          )}
        </div>

        <div className="wallet-connect-footer">
          <p className="wallet-security-note">
            🔒 Secure connection using Web3 technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
