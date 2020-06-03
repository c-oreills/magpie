import io from "socket.io-client";

import store from "./app/store";
import { updateBoards, updateHand } from "./features/board/boardsSlice";

var socket;

function socketConnect(e) {
  socket.emit("register", 0);
}

function socketServerStateUpdate(m) {
  store.dispatch(updateBoards(m.boards));
  store.dispatch(updateHand(m.hand));
  console.log(m);
}

export function drawCards(numCards) {
  socket.emit("draw");
}

export default function initSocket() {
  socket = io(`http://${window.location.hostname}:5000`);
  socket.on("connect", socketConnect);
  socket.on("server_state_update", socketServerStateUpdate);
}
