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
