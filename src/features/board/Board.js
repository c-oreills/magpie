import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { useSelector } from "react-redux";

import {
  discardCard,
  flipCard,
  giveCard,
  giveSet,
  placeCard,
  playCard,
  storeCard,
} from "../../api.js";
import { selectBoard, selectGame, selectHand } from "./boardsSlice";
import styles from "./Board.module.css";

const descriptions = {
  enhance_primary: "Add to Flock",
  enhance_secondary: "Add to Nest",
  steal_member: "Steal a Bird",
  steal_set: "Steal a Flock",
  swap: "Swap 2 Birds",
  charge_all: "All give 2",
  charge_single: "One gives 5",
  negate: "Cancel action",
  double_charge: "Feed twice",
  draw: "Draw 2 cards",
};

function setNameToCSSClass(setName) {
  const letter = setName.slice(-1);
  return `set${letter.toUpperCase()}`;
}

function cardIsSuperwild(type, sets) {
  return type === "wild" && sets.length > 2;
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

function cardIsFlippable(type, numMembers, sets) {
  return (
    type === "wild" &&
    // numMembers is undefined in hand, allow flipping here
    (cardIsOnlySetMember(numMembers) || typeof numMembers === "undefined") &&
    !cardIsSuperwild(type, sets)
  );
}

function cardIsDiscardable(location, handIsOverfull) {
  return location === "hand" && handIsOverfull;
}

function cardIsGivable(location) {
  return location !== "hand";
}

function cardSetIsGivable(location) {
  return location !== "hand";
}

function CardActionPopoverContent({
  id,
  type,
  location,
  matchingSets,
  numMembers,
  sets,
  handIsOverfull,
}) {
  const [givingType, setGivingType] = useState(null);
  if (givingType) {
    return <CardGivePopoverContent id={id} givingType={givingType} />;
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
      {cardIsFlippable(type, numMembers, sets) && (
        <Button onClick={() => flipCard(id)}>Flip</Button>
      )}
      {cardIsPlayable(type) && (
        <Button onClick={() => playCard(id)}>Play</Button>
      )}
      {cardIsStorable(type) && (
        <Button onClick={() => storeCard(id)}>Store</Button>
      )}
      {cardIsGivable(location) && (
        <Button onClick={() => setGivingType("card")}>Give...</Button>
      )}
      {cardSetIsGivable(location) && (
        <Button onClick={() => setGivingType("set")}>Give flock...</Button>
      )}
      {cardIsDiscardable(location, handIsOverfull) && (
        <Button onClick={() => discardCard(id)}>Discard</Button>
      )}
    </Popover.Content>
  );
}

function CardGivePopoverContent({ id, givingType }) {
  const { players, playerId } = useSelector(selectGame);

  let giveFn;
  if (givingType === "card") {
    giveFn = giveCard;
  } else {
    giveFn = giveSet;
  }

  let playerEls = players
    .map((p, pId) => (
      <Button key={pId} onClick={() => giveFn(id, pId)}>
        {p}
      </Button>
    ))
    .filter((_, pId) => playerId !== pId);

  return (
    <Popover.Content className={styles.actionPopover}>
      Give {givingType === "set" && "flock "}to...
      {playerEls}
    </Popover.Content>
  );
}

function Card({
  id,
  type,
  name,
  location,
  sets,
  energy,
  charges,
  matchingSets,
  numMembers,
  lightText,
  handIsOverfull,
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
        sets={sets}
        handIsOverfull={handIsOverfull}
      />
    </Popover>
  );

  let headerSetClass, altColourEls;
  if (sets) {
    let altColours;
    if (type === "charge" || cardIsSuperwild(type, sets)) {
      // For charges and superwildcards, display all colours in set with blank header
      altColours = sets.map(setNameToCSSClass);
    } else {
      // For members and other wildcards, display header in first colour and
      // single alt colour
      headerSetClass = setNameToCSSClass(sets[0]);
      altColours = sets.slice(1).map(setNameToCSSClass);
    }
    if (altColours && altColours.length > 0) {
      altColourEls = altColours.map((ac) => (
        <div key={ac} className={[styles.altColour, styles[ac]].join(" ")}>
          <br />
        </div>
      ));
    }
  }
  const description = descriptions[type];

  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement="bottom"
      overlay={popover}
    >
      <div className={styles.card}>
        <div className={[styles.cardHeader, styles[headerSetClass]].join(" ")}>
          <Energy energy={energy} />
          {altColourEls && (
            <div className={styles.altColours}>{altColourEls}</div>
          )}
          <span>{name}</span>
        </div>
        {charges && (
          <div className={styles.cardBody}>
            <Charges charges={charges} numMembers={numMembers} />
          </div>
        )}
        {description && location != "set" && (
          <div className={styles.cardBody}>{description}</div>
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
      sets={m.sets}
      energy={m.energy}
      charges={charges}
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
      <CardGivePopoverContent id={id} givingType="card" />
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

export function Board({ player, playerId }) {
  let game = useSelector(selectGame);
  let board = useSelector(selectBoard(playerId));
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

  return (
    <div
      className={`${styles.boardWrapper} ${
        playerId === game.playerId && styles.ownBoard
      }`}
    >
      <div className={styles.playerName}>{player}</div>
      <div className={styles.board}>{boardEls}</div>
    </div>
  );
}

export function Hand() {
  let hand = useSelector(selectHand);
  let game = useSelector(selectGame);
  let playerBoard = useSelector(selectBoard(game.playerId));

  const findMatchingSets = makeFindMatchingSets(playerBoard);
  const handIsOverfull = hand.length > 7;

  let handEls = hand.map((c) => (
    <Card
      key={c.id}
      id={c.id}
      type={c.type}
      name={c.name || c.type}
      location="hand"
      sets={c.sets}
      energy={c.energy}
      charges={c.charges}
      matchingSets={findMatchingSets(c)}
      lightText={c.lightText}
      handIsOverfull={handIsOverfull}
    />
  ));
  return <div className={styles.hand}>{handEls}</div>;
}

export function Boards() {
  let game = useSelector(selectGame);

  let boardEls = game.players.map((p, i) => <Board player={p} playerId={i} />);
  return boardEls;
}
