import React from "react";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useDispatch, useSelector } from "react-redux";

import { drawCards } from "../../api.js";

import { selectGame, updateActivePlayerTab } from "../board/boardsSlice";

import styles from "./Controls.module.css";

export function ActionBar() {
  return (
    <div className={styles.actionBar}>
      <Button variant="success" onClick={drawCards}>
        Draw
      </Button>
      <Button variant="primary">Give</Button>
      <Button variant="danger">Done</Button>
    </div>
  );
}

export function SelectorBar() {
  let dispatch = useDispatch();
  let game = useSelector(selectGame);

  let playerEls = game.players.map((p, i) => (
    <Tab key={i} eventKey={i} title={p} />
  ));

  return (
    <Tabs onSelect={(k) => dispatch(updateActivePlayerTab(k))}>
      {playerEls}
    </Tabs>
  );
}

export function Log() {
  let game = useSelector(selectGame);

  let logEls = game.log.map((l, i) => <li key={i}>{l}</li>);
  logEls.reverse();

  return <ul className={styles.log}>{logEls}</ul>;
}
