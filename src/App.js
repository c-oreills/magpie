import React from "react";
import { Board, Hand } from "./features/board/Board";
import { ActionBar, Log, SelectorBar } from "./features/controls/Controls";
import "./App.css";

function App() {
  return (
    <div className="app">
      <SelectorBar />
      <Board />
      <Hand />
      <ActionBar />
      <Log />
    </div>
  );
}

export default App;
