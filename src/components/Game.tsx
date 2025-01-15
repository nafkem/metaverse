import { useScore } from '@/context/ScoreContext';
import { useUser } from '@/context/UserContext.js';
import { useEffect } from 'react';
import { initGame } from "../../scripts/main.js";
import Leaderboard from './Leaderboard';
import LogoutButton from './LogoutButton.js';
import ScoreDisplay from './ScoreDisplay';

const Game = () => {
  const { setLoading } = useUser();
  const { startScoring, stopScoring, toggleGameState } = useScore();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    console.log('[Game] Initializing game...');
    const cleanup = initGame();
    toggleGameState(true);
    startScoring();
    const delay = navigator.userAgent.includes('Chrome') ? 1800 : 1000;
    setTimeout(() => setLoading(false), delay);

    return () => {
      console.log('[Game] Unloading game...');
      stopScoring();
      toggleGameState(false);
      if (cleanup) {
        cleanup();
      }
      // Remove any lil-gui elements from the DOM
      const guiElements = document.getElementsByClassName('lil-gui');
      while (guiElements.length > 0) {
        guiElements[0].remove();
      }
      setLoading(true);
    };
  }, [user]);

  return (
    <div className="game-container">
      <LogoutButton />
      <ScoreDisplay />
      <Leaderboard />
      <div id="game">
        <div id="info">
          <div id="info-player-position"></div>
        </div>
        <div id="toolbar-container">
          <div id="toolbar">
            <img className="toolbar-icon" id="toolbar-1" src="/textures/grass.png" alt="grass" />
            <img className="toolbar-icon" id="toolbar-2" src="/textures/dirt.png" alt="dirt" />
            <img className="toolbar-icon" id="toolbar-3" src="/textures/stone.png" alt="stone" />
            <img className="toolbar-icon" id="toolbar-4" src="/textures/coal_ore.png" alt="coal ore" />
            <img className="toolbar-icon" id="toolbar-5" src="/textures/iron_ore.png" alt="iron ore" />
            <img className="toolbar-icon" id="toolbar-6" src="/textures/tree_top.png" alt="tree top" />
            <img className="toolbar-icon" id="toolbar-7" src="/textures/leaves.png" alt="leaves" />
            <img className="toolbar-icon" id="toolbar-8" src="/textures/sand.png" alt="sand" />
            <img className="toolbar-icon selected" id="toolbar-0" src="/textures/pickaxe.png" alt="pickaxe" />
          </div>
        </div>
        <div id="overlay">
          <div id="instructions">
            <h1>404 Metaverse</h1>
            W,A,S,D - Move ( Up,Down,Left,Right )<br />
            SHIFT - Sprint<br />
            SPACE - Jump<br />
            Mouse - Look around<br />
            Click - Break blocks<br />
            1-9 - Select block type<br />
            ESC - Pause game<br />
            L - Toggle leaderboard<br /><br />
            Press any key to continue
          </div>
        </div>
        <div id="status"></div>
      </div>
    </div>
  );
};

export default Game;
