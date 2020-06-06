import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { useSelector } from "react-redux";

import {
  flipCard,
  giveCard,
  placeCard,
  playCard,
  storeCard,
} from "../../api.js";
import { selectBoard, selectGame, selectHand } from "./boardsSlice";
import styles from "./Board.module.css";

var sets = [
  {
    charges: [2, 4, 6],
    members: [
      { name: "Item", colour: "red", energy: 3 },
      { name: "Item", colour: "red", energy: 3 },
    ],
    enhancers: [],
  },
  {
    charges: [1, 2, 3],
    members: [
      { name: "Item", colour: "green", energy: 1 },
      { name: "Item", colour: "green", energy: 1 },
      { name: "Item", colour: "green", energy: 1 },
    ],
    enhancers: [],
  },
  {
    charges: [3, 8],
    members: [
      { name: "Item", colour: "cornflowerblue", energy: 4 },
      { name: "Item", colour: "cornflowerblue", energy: 4 },
    ],
    enhancers: [],
  },
  {
    charges: [2, 4, 7],
    members: [
      { name: "Item", colour: "yellow", energy: 3 },
      { name: "Item", colour: "yellow", energy: 3 },
      { name: "Item", colour: "yellow", energy: 3 },
    ],
    enhancers: [
      { name: "Enhancer", colour: "green", energy: 3 },
      { name: "Enhancer", colour: "red", energy: 4 },
    ],
  },
  {
    charges: [1, 2],
    members: [{ name: "Item", colour: "orange", energy: 1 }],
    enhancers: [],
  },
];

var store = [
  { energy: 1 },
  { energy: 2 },
  { energy: 3 },
  { energy: 10 },
  { energy: 1 },
  { energy: 2 },
  { energy: 3 },
  { energy: 10 },
];

var hand = [
  { name: "Item", colour: "green", energy: 1 },
  { name: "Item", colour: "red", energy: 2 },
  { name: "Item", colour: "cornflowerblue", energy: 4 },
  { name: "Item", colour: "green", energy: 1 },
  { name: "Item", colour: "red", energy: 2 },
  { name: "Item", colour: "cornflowerblue", energy: 4 },
];

function cardIsSuperwild(type, colours) {
  return type === "wild" && colours.length > 2;
}

function cardIsMember(type) {
  return ["member", "wild"].includes(type);
}

function cardIsEnhancer(type) {
  return ["enhance_primary", "enhance_secondary"].includes(type);
}

function cardIsOnlySetMember(numMembers) {
  return numMembers === 1;
}

function cardIsStorable(type) {
  return !cardIsMember(type);
}

function cardIsPlaceable(type) {
  return cardIsMember(type) || cardIsEnhancer(type);
}

function cardIsPlaceableInNew(type, numMembers) {
  // TODO: handle disabling placement of superwild in new sets
  return cardIsMember(type) && !cardIsOnlySetMember(numMembers);
}

function cardIsPlayable(type) {
  return type !== "energy" && !cardIsPlaceable(type);
}

function cardIsFlippable(type, numMembers, colours) {
  return (
    type === "wild" &&
    cardIsOnlySetMember(numMembers) &&
    !cardIsSuperwild(type, colours)
  );
}

function cardIsGivable(location) {
  return location !== "hand";
}

function CardActionPopoverContent({
  id,
  type,
  location,
  matchingSets,
  numMembers,
  colours,
}) {
  const [isGiving, setIsGiving] = useState(false);
  if (isGiving) {
    return <CardGivePopoverContent id={id} />;
  }

  const placeSetEls =
    matchingSets &&
    cardIsPlaceable(type) &&
    matchingSets.map((s) => (
      <Button key={s.id} onClick={() => placeCard(id, s.id)}>
        Place with {s.members[0].name}
      </Button>
    ));

  return (
    <Popover.Content className={styles.actionPopover}>
      {cardIsPlaceableInNew(type, numMembers) && (
        <Button onClick={() => placeCard(id)}>Place in New</Button>
      )}
      {placeSetEls}
      {cardIsFlippable(type, numMembers, colours) && (
        <Button onClick={() => flipCard(id)}>Flip</Button>
      )}
      {cardIsPlayable(type) && (
        <Button onClick={() => playCard(id)}>Play</Button>
      )}
      {cardIsStorable(type) && (
        <Button onClick={() => storeCard(id)}>Store</Button>
      )}
      {cardIsGivable(location) && (
        <Button onClick={() => setIsGiving(true)}>Give...</Button>
      )}
    </Popover.Content>
  );
}

function CardGivePopoverContent({ id }) {
  const { players, playerId } = useSelector(selectGame);

  let playerEls = players
    .map((p, pId) => (
      <Button key={pId} onClick={() => giveCard(id, pId)}>
        {p}
      </Button>
    ))
    .filter((_, pId) => playerId !== pId);

  return (
    <Popover.Content className={styles.actionPopover}>
      Give to...
      {playerEls}
    </Popover.Content>
  );
}

function Card({
  id,
  type,
  name,
  location,
  colours,
  energy,
  charges,
  matchingSets,
  numMembers,
  lightText,
}) {
  // Default background to white
  const popover = (
    <Popover>
      <CardActionPopoverContent
        id={id}
        type={type}
        location={location}
        matchingSets={matchingSets}
        numMembers={numMembers}
        colours={colours}
      />
    </Popover>
  );

  const headerStyle = colours ? { backgroundColor: colours[0] } : {};

  const altColourEls =
    colours &&
    colours.slice(1).map((c) => (
      <div key={c} className={styles.altColour} style={{ backgroundColor: c }}>
        <br />
      </div>
    ));

  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement="bottom"
      overlay={popover}
    >
      <div className={styles.card}>
        <div className={styles.cardHeader} style={headerStyle}>
          <Energy energy={energy} />
          {altColourEls && altColourEls.length > 0 && (
            <div className={styles.altColours}>{altColourEls}</div>
          )}
          <span className={lightText && styles.lightText}>{name}</span>
        </div>
        {charges && (
          <div className={styles.cardBody}>
            <Charges charges={charges} numMembers={numMembers} />
          </div>
        )}
      </div>
    </OverlayTrigger>
  );
}

function Charge({ charge, index, numMembers }) {
  let className = `${styles.charge} ${
    index + 1 === numMembers ? styles.active : ""
  }`;
  return <span className={className}>{charge}</span>;
}

function ChargeSpacer() {
  return <span className={styles.chargeSpacer}>→</span>;
}

function Charges({ charges, numMembers }) {
  let chargeEls = Array.from(
    charges.map((c, i) => [
      <Charge key={"c" + i} charge={c} index={i} numMembers={numMembers} />,
      <ChargeSpacer key={"s" + i} />,
    ])
  );
  // Remove last spacer
  chargeEls[chargeEls.length - 1].pop();

  return <div className={styles.charges}>{chargeEls}</div>;
}

function Set({ members, charges, enhancers, findMatchingSets }) {
  let isComplete = members.length === charges.length;
  let memberEls = members.map((m) => (
    <Card
      key={m.id}
      id={m.id}
      type={m.type}
      name={m.name}
      location="set"
      colours={m.colours}
      energy={m.energy}
      charges={charges}
      sets={m.sets}
      matchingSets={findMatchingSets(m)}
      numMembers={members.length}
      lightText={m.lightText}
    />
  ));
  let enhancerEls = enhancers.map((e) => (
    <Card
      key={e.id}
      id={e.id}
      type={e.type}
      name={e.name}
      location="set"
      colours={e.colours}
      energy={e.energy}
    />
  ));
  return (
    <div className={`${styles.set} ${isComplete ? styles.complete : ""}`}>
      <div className={styles.setMembers}>{memberEls}</div>
      <div className={styles.setEnhancers}>{enhancerEls}</div>
    </div>
  );
}

function StoreItem({ id, energy }) {
  const popover = (
    <Popover>
      <CardGivePopoverContent id={id} />
    </Popover>
  );
  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement="bottom"
      overlay={popover}
    >
      {/* Need to wrap in div to work around
      https://github.com/react-bootstrap/react-bootstrap/issues/2208 */}
      <div>
        <Energy energy={energy} />
      </div>
    </OverlayTrigger>
  );
}

function Energy({ energy }) {
  return <div className={`${styles.energy} ${styles[energy]}`}>{energy}</div>;
}

function Store({ items }) {
  let storeEls = items.map((i) => (
    <StoreItem key={i.id} id={i.id} energy={i.energy} />
  ));
  return (
    <div className={styles.store}>
      <div className={styles.storeHeader}>Store</div>
      {storeEls}
    </div>
  );
}

function setLength(set) {
  return set.members.length + set.enhancers.length;
}

function setCharge(set) {
  // Rather than working out current value, just use most valueable final charge
  return set.charges[set.charges.length - 1];
}

function setIsComplete(set) {
  return set.members.length === set.charges.length;
}

function makeFindMatchingSets(board) {
  return function findMatchingSets(card) {
    if (!board) {
      return [];
    } else if (card.sets) {
      return board.sets.filter(
        (s) => card.sets.includes(s.set) && !s.members.includes(card)
      );
    } else if (card.type === "enhance_primary") {
      return board.sets.filter((s) => setIsComplete(s) && !s.enhancers.length);
    } else if (card.type === "enhance_secondary") {
      return board.sets.filter(
        (s) => setIsComplete(s) && s.enhancers.length === 1
      );
    } else {
      return [];
    }
  };
}

export function Board({ displayOwn }) {
  let game = useSelector(selectGame);
  let board = useSelector(
    selectBoard(displayOwn ? game.playerId : game.activePlayerTab)
  );
  let ownBoard = useSelector(selectBoard(game.playerId));
  if (!board) {
    return null;
  }

  const findMatchingSets = makeFindMatchingSets(ownBoard);

  function setCompareFn(a, b) {
    let lengthDiff = setLength(b) - setLength(a);
    if (lengthDiff) {
      return lengthDiff;
    } else {
      return setCharge(b) - setCharge(a);
    }
  }
  // TODO: reenable set sorting
  let sortedSets = board.sets; //.sort(setCompareFn);

  let boardEls = sortedSets.map((s) => (
    <Set
      key={s.id}
      members={s.members}
      charges={s.charges}
      enhancers={s.enhancers || []}
      findMatchingSets={findMatchingSets}
    />
  ));
  boardEls.push(<Store key={"store"} items={board.store} />);

  return <div className={styles.board}>{boardEls}</div>;
}

export function Hand() {
  let hand = useSelector(selectHand);
  let game = useSelector(selectGame);
  let playerBoard = useSelector(selectBoard(game.playerId));

  const findMatchingSets = makeFindMatchingSets(playerBoard);

  let handEls = hand.map((c) => (
    <Card
      key={c.id}
      id={c.id}
      type={c.type}
      name={c.name || c.type}
      location="hand"
      colours={c.colours}
      energy={c.energy}
      charges={c.charges}
      matchingSets={findMatchingSets(c)}
      lightText={c.lightText}
    />
  ));
  return <div className={styles.hand}>{handEls}</div>;
}
