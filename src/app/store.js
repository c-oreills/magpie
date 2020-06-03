import { configureStore } from "@reduxjs/toolkit";
import {
  boardsReducer,
  gameReducer,
  handReducer,
} from "../features/board/boardsSlice";

export default configureStore({
  reducer: {
    boards: boardsReducer,
    game: gameReducer,
    hand: handReducer,
  },
});
