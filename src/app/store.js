import { configureStore } from "@reduxjs/toolkit";
import {
  boardsReducer,
  handReducer,
  // setsReducer,
} from "../features/board/boardsSlice";

export default configureStore({
  reducer: {
    boards: boardsReducer,
    hand: handReducer,
    // sets: setsReducer,
  },
});
