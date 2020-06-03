import io from "socket.io-client";

import store from "./app/store";
import { updateBoards, updateHand, updatePlayers } from "./features/board/boardsSlice";

var socket;

function socketConnect(e) {
  let urlParams = new URLSearchParams(window.location.search);
  let pid = Number(urlParams.get('p')) || 0;
  socket.emit("register", pid);
}

function socketServerStateUpdate(m) {
  store.dispatch(updateBoards(m.boards));
  store.dispatch(updateHand(m.hand));
  store.dispatch(updatePlayers(m.players));
}

export function drawCards() {
  socket.emit("draw");
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
