import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const token = localStorage.getItem("token");
if (token === "undefined" || token === "null" || token === "") {
    localStorage.removeItem("token");
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
