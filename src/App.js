import React from "react";
import { Boards, Hand } from "./features/board/Board";
import {
  ActionBar,
  AlertBox,
  Log,
  SettingMenu,
} from "./features/controls/Controls";
import "./App.css";

function App() {
  return (
    <div className="app">
      <AlertBox />
      <SettingMenu />
      <Boards />
      <Hand />
      <ActionBar />
      <Log />
    </div>
  );
}

export default App;
