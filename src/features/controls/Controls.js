import React from "react";

import { useDispatch, useSelector } from "react-redux";

import { drawCards } from "../../api.js";

import { selectGame, updateActivePlayerTab } from "../board/boardsSlice";

import styles from "./Controls.module.css";

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
  let dispatch = useDispatch();
  let game = useSelector(selectGame);

  let playerEls = game.players.map((p, i) => (
    <div className="nav-item" role="tablist" key={i}>
      <button className={`nav-link ${i === game.activePlayerTab && "active"}`}
         onClick={() => dispatch(updateActivePlayerTab(i))}
      >{p}</button>
    </div>
  ));
  return <div className="nav nav-tabs">{playerEls}</div>;
}
