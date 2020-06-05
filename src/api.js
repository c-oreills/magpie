import io from "socket.io-client";

import store from "./app/store";
import { updateBoards, updateHand, updateLog, updatePlayers, updatePlayerId } from "./features/board/boardsSlice";

var socket;

function socketConnect(e) {
  let urlParams = new URLSearchParams(window.location.search);
  let pid = urlParams.get('p');
  if (pid) {
    socket.emit("register", Number(pid));
    store.dispatch(updatePlayerId(pid));
  }
}

function socketServerStateUpdate(m) {
  store.dispatch(updateBoards(m.boards));
  store.dispatch(updateHand(m.hand));
  store.dispatch(updatePlayers(m.players));
  store.dispatch(updateLog(m.log));
}

export function drawCards() {
  socket.emit("draw");
}

export function endTurn() {
  socket.emit("end");
}

export function giveCard(cardId, toPlayerId) {
  socket.emit("give", cardId, toPlayerId);
}

export function flipCard(cardId) {
  socket.emit("flip", cardId);
}

export function playCard(cardId) {
  socket.emit("play", cardId);
}

export function placeCard(cardId, setId) {
  socket.emit("place", cardId, setId);
}

export function storeCard(cardId) {
  socket.emit("store", cardId);
}

export default function initSocket() {
  socket = io(`http://${window.location.hostname}:5000`);
  socket.on("connect", socketConnect);
  socket.on("server_state_update", socketServerStateUpdate);
}
