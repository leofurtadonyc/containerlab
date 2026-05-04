import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import "./styles.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/design-system.css";
import "./styles/shell.css";
import "./styles/workspace.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
