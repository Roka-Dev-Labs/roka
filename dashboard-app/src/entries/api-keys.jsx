import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApiKeys } from "../pages/ApiKeys.jsx";
import "../styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ApiKeys />
  </StrictMode>,
);
