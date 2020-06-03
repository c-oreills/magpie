import io from 'socket.io-client';
const socket = io('http://0.0.0.0:5000');

function socketConnect(e) {
  socket.emit('register', 0);
}

function socketServerStateUpdate(m) {
  console.log(m);
}

export function drawCards(numCards) {
  socket.emit('draw');
}

export default function registerSocketCallbacks() {
  socket.on('connect', socketConnect);
  socket.on('server_state_update', socketServerStateUpdate);
}

