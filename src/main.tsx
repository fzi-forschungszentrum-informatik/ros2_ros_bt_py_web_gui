import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import "./main.scss";
import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/solid";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <div id="react-container">
      <App />
    </div>
    {/* <div id="loading-icon">
      <div className="wave">
        <span>L</span>
        <span>O</span>
        <span>A</span>
        <span>D</span>
        <span>I</span>
        <span>N</span>
        <span>G</span>
      </div>

    </div> */}
  </React.StrictMode>
);
