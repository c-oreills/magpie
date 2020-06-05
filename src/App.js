import React from "react";
import { Board, Hand } from "./features/board/Board";
import {
  ActionBar,
  AlertBox,
  Log,
  SelectorBar,
  SettingMenu,
} from "./features/controls/Controls";
import "./App.css";

function App() {
  return (
    <div className="app">
      <AlertBox />
      <SettingMenu />
      <SelectorBar />
      <Board />
      <Hand />
      <ActionBar />
      <Log />
    </div>
  );
}

export default App;
