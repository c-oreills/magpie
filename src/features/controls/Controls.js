import React from "react";

import { drawCards } from "../../api.js";

import styles from "./Controls.module.css";

var players = ["Player1", "Player2", "Player3", "Player4"];
var activePlayer = "Player2";

export function ActionBar() {
  return (
    <div className={styles.actionBar}>
      <button className="btn btn-success" onClick={drawCards}>
        Draw
      </button>
      <button className="btn btn-primary">Give</button>
      <button className="btn btn-danger">Done</button>
    </div>
  );
}

export function SelectorBar() {
  let playerEls = players.map((p) => (
    <button
      className={`btn ${p === activePlayer ? "btn-success" : "btn-primary"}`}
    >
      {p}
    </button>
  ));
  return <div className={styles.selectorBar}>{playerEls}</div>;
}
