import React from 'react';
import { Board, Hand } from './features/board/Board';
import { ActionBar, SelectorBar } from './features/controls/Controls';
import './App.css';

function App() {
  return (
    <div className="app">
      <SelectorBar />
      <Board />
      <hr />
      <Hand />
      <ActionBar />
    </div>
  );
}

export default App;
