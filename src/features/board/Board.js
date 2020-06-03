import React from "react";

import { useSelector } from "react-redux";

import { placeCard, playCard, storeCard } from "../../api.js";
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

function Card({ id, type, name, colour, energy, charges, numMembers }) {
  // TODO: handle different colours
  colour = "cornflowerblue";

  const onClick = () => {
    if (type === "energy") {
      storeCard(id);
    } else if (["member", "wild"].includes(type)) {
      placeCard(id, null);
    } else {
      playCard(id);
    }
  };

  return (
    <div
      className={styles.card}
      style={{ backgroundColor: colour }}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.energy}>{energy}</div>
        {name}
      </div>
      {charges && (
        <div className={styles.cardBody}>
          <Charges charges={charges} numMembers={numMembers} />
        </div>
      )}
    </div>
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
      <Charge charge={c} index={i} numMembers={numMembers} />,
      <ChargeSpacer />,
    ])
  );
  // Remove last spacer
  chargeEls[chargeEls.length - 1].pop();

  return <div className={styles.charges}>{chargeEls}</div>;
}

function Set({ members, charges, enhancers }) {
  let isComplete = members.length === charges.length;
  let memberEls = members.map((m) => (
    <Card
      key={m.id}
      name={m.id}
      colour={m.colour}
      energy={m.energy}
      charges={charges}
      numMembers={members.length}
    />
  ));
  let enhancerEls = enhancers.map((e) => (
    <Card name={e.name} colour={e.colour} energy={e.energy} />
  ));
  return (
    <div className={`${styles.set} ${isComplete ? styles.complete : ""}`}>
      <div className={styles.setMembers}>{memberEls}</div>
      <div className={styles.setEnhancers}>{enhancerEls}</div>
    </div>
  );
}

function StoreItem({ energy }) {
  return <div className={styles.energy}>{energy}</div>;
}

function Store({ items }) {
  let storeEls = items.map((i) => <StoreItem key={i.id} energy={i.energy} />);
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

export function Board() {
  let game = useSelector(selectGame);
  let board = useSelector(selectBoard(game.activePlayerTab));

  function setCompareFn(a, b) {
    let lengthDiff = setLength(b) - setLength(a);
    if (lengthDiff) {
      return lengthDiff;
    } else {
      return setCharge(b) - setCharge(a);
    }
  }
  // TODO: reenable set sorting
  let sortedSets = board.sets//.sort(setCompareFn);

  let boardEls = sortedSets.map((s) => (
    <Set
      members={s.members}
      charges={s.charges}
      enhancers={s.enhancers || []}
    />
  ));
  boardEls.push(<Store items={board.store} />);

  return <div className={styles.board}>{boardEls}</div>;
}

export function Hand() {
  let hand = useSelector(selectHand);

  // TODO: handle different colours
  let colour = "cornflowerblue";

  let handEls = hand.map((c) => (
    <Card
      key={c.id}
      id={c.id}
      type={c.type}
      name={c.type}
      colour={colour}
      energy={c.energy}
      charges={c.charges}
    />
  ));
  return <div className={styles.hand}>{handEls}</div>;
}
