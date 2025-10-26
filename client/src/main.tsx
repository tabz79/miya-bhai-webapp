// client/src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/overrides.css"; // ← ensure prod fallback grid is loaded

createRoot(document.getElementById("root")!).render(<App />);
