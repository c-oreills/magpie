import React from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { useDispatch, useSelector } from "react-redux";

import { drawCards, endTurn, restartGame } from "../../api.js";

import { Card } from "../board/Board";
import { selectGame, updateAlert } from "../board/boardsSlice";

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

const logMessages = {
  redeal: (k, p) => (
    <LogItem
      key={k}
      playerId={p}
      parts={[p, "ran out the deck and had to reshuffle"]}
    />
  ),
  draw: (k, p, n) => (
    <LogItem key={k} playerId={p} parts={[p, `drew ${n} cards`]} />
  ),
  end_turn: (k, p, nextP) => (
    <LogItem
      key={k}
      playerId={p}
      parts={[p, "ended their turn. Now for ", nextP]}
    />
  ),
  play: (k, p, c) => <LogItem key={k} playerId={p} parts={[p, "played", c]} />,
  place: (k, p, c) => <LogItem key={k} playerId={p} parts={[p, "placed", c]} />,
  store: (k, p, c) => <LogItem key={k} playerId={p} parts={[p, "stored", c]} />,
  give_card: (k, p, c, to) => (
    <LogItem key={k} playerId={p} parts={[p, "gave", c, "to ", to]} />
  ),
  give_set: (k, p, c, to) => (
    <LogItem
      key={k}
      playerId={p}
      parts={[p, "gave Flock containing", c, "to ", to]}
    />
  ),
  discard: (k, p, c) => (
    <LogItem key={k} playerId={p} parts={[p, "discarded", c]} />
  ),
};

export function Log() {
  let game = useSelector(selectGame);

  let logEls = game.log.map(([playerId, action, ...args], i) =>
    logMessages[action](i, playerId, ...args)
  );
  logEls.reverse();

  return <div className={styles.log}>{logEls}</div>;
}

function LogItem({ parts }) {
  let game = useSelector(selectGame);

  function logPart(part) {
    switch (typeof part) {
      case "string":
        return <span>{part}</span>;
        break;
      case "number":
        return <span>{game.players[part]} </span>;
        break;
      case "object":
        return (
          <Card
            id={part.id}
            type={part.type}
            name={part.name}
            location="log"
            sets={part.sets}
            energy={part.energy}
            charges={part.charges}
          />
        );
        break;
    }
  }

  let partEls = parts.map(logPart);

  return <div className={styles.logItem}>{partEls}</div>;
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
