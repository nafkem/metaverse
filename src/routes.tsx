import { Route, Routes } from 'react-router-dom';
import AuthForm from './AuthForm';
import Game from './components/Game';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import WalletConnect from './components/WalletConnect';
import { UserProvider } from './context/UserContext';
import { ScoreProvider } from './context/ScoreContext';

const GameRoutes = () => {
  return (
    <UserProvider>
      <ScoreProvider>
        <Routes>
          <Route path="/" element={<WalletConnect />} />
          <Route path="/login" element={<AuthForm />} />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ScoreProvider>
    </UserProvider>
  );
};

export default GameRoutes;
