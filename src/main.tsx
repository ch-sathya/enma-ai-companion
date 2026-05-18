import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootTheme } from "./hooks/useTheme";

bootTheme();
createRoot(document.getElementById("root")!).render(<App />);
