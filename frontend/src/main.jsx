import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MarketHoursProvider } from "./contexts/MarketHoursContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MarketHoursProvider>
          <App />
        </MarketHoursProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
