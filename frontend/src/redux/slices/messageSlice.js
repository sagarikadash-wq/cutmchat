import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name: "message",
    initialState: {
        message: [],
        newMessageId: "",
    },
    reducers: {
        addAllMessages: (state, action) => {
            state.message = action.payload;
        },
        addNewMessage: (state, action) => {
            state.message = [...state.message, action.payload];
        },
        addNewMessageId: (state, action) => {
            state.newMessageId = action.payload;
        },
        deleteMessage: (state, action) => {
            state.message = state.message.filter(m => m._id !== action.payload);
        },
    },
});

export const { addAllMessages, addNewMessage, addNewMessageId, deleteMessage } =
    messageSlice.actions;
export default messageSlice.reducer;
