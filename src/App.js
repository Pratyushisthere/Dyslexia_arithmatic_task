import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Game from './components/Game';
import Home from './components/Home';
import { GameProvider } from './context/GameContext';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'OpenDyslexic', Arial, sans-serif;
`;

function App() {
  return (
    <GameProvider>
      <AppContainer>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </Router>
      </AppContainer>
    </GameProvider>
  );
}

export default App; 