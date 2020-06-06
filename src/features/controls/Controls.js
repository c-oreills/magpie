import React from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Toast from "react-bootstrap/Toast";
import { useDispatch, useSelector, useState } from "react-redux";

import { drawCards, endTurn, restartGame } from "../../api.js";

import {
  selectGame,
  updateAlert,
  updateActivePlayerTab,
} from "../board/boardsSlice";

import styles from "./Controls.module.css";

export function ActionBar() {
  return (
    <div className={styles.actionBar}>
      <Button variant="success" onClick={drawCards}>
        Draw
      </Button>
      <Button variant="danger" onClick={endTurn}>
        Done
      </Button>
    </div>
  );
}

export function SelectorBar() {
  let dispatch = useDispatch();
  let game = useSelector(selectGame);

  let playerEls = game.players.map((p, i) => (
    <Tab key={i} eventKey={i} title={i === game.playerId ? "You" : p} />
  ));

  return (
    <Tabs
      activeKey={game.activePlayerTab}
      onSelect={(k) => dispatch(updateActivePlayerTab(k))}
    >
      {playerEls}
    </Tabs>
  );
}

export function SettingMenu() {
  const popover = (
    <Popover>
      <Popover.Content>
        <Button onClick={() => restartGame()}>Restart</Button>
      </Popover.Content>
    </Popover>
  );
  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement="bottom"
      overlay={popover}
    >
      <div className={styles.settings}>⚙️</div>
    </OverlayTrigger>
  );
}

export function Log() {
  let game = useSelector(selectGame);

  let logEls = game.log.map((l, i) => <li key={i}>{l}</li>);
  logEls.reverse();

  return <ul className={styles.log}>{logEls}</ul>;
}

export function AlertBox() {
  const dispatch = useDispatch();
  const game = useSelector(selectGame);

  if (!game.alert) {
    return null;
  }
  return (
    <Alert
      className={styles.alert}
      variant="danger"
      onClose={() => dispatch(updateAlert(null))}
      dismissible
    >
      {game.alert}
    </Alert>
  );
}
