import { createSlice } from "@reduxjs/toolkit";

export const boardsSlice = createSlice({
  name: "boards",
  initialState: {
    // TODO: handle configurable number of players
    0: {sets: [], store: []},
    1: {sets: [], store: []},
  },
  reducers: {
    updateBoards: (state, action) => {
      return action.payload;
    },
  },
});

export const { updateBoards } = boardsSlice.actions;
export const selectBoard = playerId => state => state.boards[playerId];
export const boardsReducer = boardsSlice.reducer;

export const handSlice = createSlice({
  name: "hand",
  initialState: [],
  reducers: {
    updateHand: (state, action) => {
      return action.payload;
    },
  },
});

export const { updateHand } = handSlice.actions;
export const selectHand = state => state.hand;
export const handReducer = handSlice.reducer;

export const gameSlice = createSlice({
  name: "game",
  initialState: {
    // TODO: select my player by default
    activePlayerTab: 0,
    log: [],
    players: [],
    playerId: null,
  },
  reducers: {
    updateActivePlayerTab: (state, action) => {
      state.activePlayerTab = action.payload;
    },
    updateAlert: (state, action) => {
      state.alert = action.payload;
    },
    updateLog: (state, action) => {
      state.log = action.payload;
    },
    updatePlayers: (state, action) => {
      state.players = action.payload;
    },
    updatePlayerId: (state, action) => {
      state.playerId = Number(action.payload);
    },
  },
});

export const {
  updateAlert,
  updateActivePlayerTab,
  updateLog,
  updatePlayers,
  updatePlayerId,
} = gameSlice.actions;
export const selectGame = (state) => state.game;
export const gameReducer = gameSlice.reducer;
