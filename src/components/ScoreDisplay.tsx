import { useScore } from '@/context/ScoreContext';
import '../styles/ScoreDisplay.css';

const ScoreDisplay = () => {
  const { score, isActive } = useScore();

  return (
    <div 
      className={`scoreContainer ${isActive ? 'active' : ''}`}
    >
      <div className="scoreLabel">SCORE</div>
      <div className="scoreValue">
        {score.toString().padStart(6, '0')}
      </div>
      {isActive && (
        <div className="activeIndicator">
          ● ACTIVE
        </div>
      )}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default ScoreDisplay;
