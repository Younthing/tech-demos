import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NotebookApp } from "@/notebook/NotebookApp";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <NotebookApp />
  </StrictMode>,
);
