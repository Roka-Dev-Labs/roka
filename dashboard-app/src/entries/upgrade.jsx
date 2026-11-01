import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Upgrade } from "../pages/Upgrade.jsx";
import "../styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Upgrade />
  </StrictMode>,
);
