import React from "react";

import styles from "./Board.module.css";

var sets = [
  {
    charges: [2, 4, 6],
    items: [
      { name: "Item", colour: "red", energy: 3 },
      { name: "Item", colour: "red", energy: 3 },
    ],
    enhancers: [],
  },
  {
    charges: [1, 2, 3],
    items: [
      { name: "Item", colour: "green", energy: 1 },
      { name: "Item", colour: "green", energy: 1 },
      { name: "Item", colour: "green", energy: 1 },
    ],
    enhancers: [],
  },
  {
    charges: [3, 8],
    items: [
      { name: "Item", colour: "cornflowerblue", energy: 4 },
      { name: "Item", colour: "cornflowerblue", energy: 4 },
    ],
    enhancers: [],
  },
  {
    charges: [2, 4, 7],
    items: [
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
    items: [{ name: "Item", colour: "orange", energy: 1 }],
    enhancers: [],
  },
];

var store = {
  items: [
    { energy: 1 },
    { energy: 2 },
    { energy: 3 },
    { energy: 10 },
    { energy: 1 },
    { energy: 2 },
    { energy: 3 },
    { energy: 10 },
  ],
};

function Item({ name, colour, energy }) {
  return (
    <div className={styles.item} style={{ backgroundColor: colour }}>
      {name}
      <span className={styles.energy}>{energy}</span>
    </div>
  );
}
function Charge({ charge, index, numItems }) {
  let className = `${styles.charge} ${
    index + 1 === numItems ? styles.active : ""
  }`;
  return <span className={className}>{charge}</span>;
}

function ChargeSpacer() {
  return <span className={styles.chargeSpacer}>→</span>;
}

function Charges({ charges, numItems }) {
  let chargeEls = Array.from(
    charges.map((c, i) => [
      <Charge charge={c} index={i} numItems={numItems} />,
      <ChargeSpacer />,
    ])
  );
  // Remove last spacer
  chargeEls[chargeEls.length - 1].pop();

  return <div className={styles.charges}>{chargeEls}</div>;
}

function Set({ items, charges, enhancers }) {
  let isComplete = items.length === charges.length;
  let itemEls = items.map((i) => (
    <Item name={i.name} colour={i.colour} energy={i.energy} />
  ));
  let enhancerEls = enhancers.map((e) => (
    <Item name={e.name} colour={e.colour} energy={e.energy} />
  ));
  return (
    <div className={`${styles.set} ${isComplete ? styles.complete : ""}`}>
      <div className={styles.setInner}>
        {itemEls}
        <Charges charges={charges} numItems={items.length} />
        {enhancerEls}
      </div>
    </div>
  );
}

function StoreItem({ energy }) {
  return (
    <div className={styles.storeItem}>
      <div className={styles.energy}>{energy}</div>
    </div>
  );
}

function Store({ items }) {
  let storeEls = items.map((i) => <StoreItem energy={i.energy} />);
  return (
    <div className={styles.store}>
      <div className={styles.storeInner}>
        <div className={styles.storeHeader}>Store</div>
        {storeEls}
      </div>
    </div>
  );
}

function setLength(set) {
  return set.items.length + set.enhancers.length;
}

function setCharge(set) {
  // Rather than working out current value, just use most valueable final charge
  return set.charges[set.charges.length - 1];
}

export function Board() {
  function setCompareFn(a, b) {
    let lengthDiff = setLength(b) - setLength(a);
    if (lengthDiff) {
      return lengthDiff;
    } else {
      return setCharge(b) - setCharge(a);
    }
  }
  let sortedSets = sets.sort(setCompareFn);

  let boardEls = sortedSets.map((s) => (
    <Set items={s.items} charges={s.charges} enhancers={s.enhancers || []} />
  ));
  boardEls.push(<Store items={store.items} />);

  return <div className={styles.board}>{boardEls}</div>;
}
