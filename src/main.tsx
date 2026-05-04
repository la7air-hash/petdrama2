import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDraftOwner } from "./lib/draft-owner";

initDraftOwner();

createRoot(document.getElementById("root")!).render(<App />);
