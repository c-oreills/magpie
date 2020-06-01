import React from 'react';
import { Board } from './features/board/Board';
import { ActionBar, SelectorBar } from './features/controls/Controls';
import { Hand } from './features/hand/Hand';
import './App.css';

function App() {
  return (
    <div className="app">
      <SelectorBar />
      <Board />
      <ActionBar />
    </div>
  );
}

export default App;
