console.log('=== MAIN.TSX LOADING ===');

import { createRoot } from "react-dom/client";

console.log('=== REACT-DOM IMPORTED ===');

import App from "./App.tsx";

console.log('=== APP IMPORTED ===');

import "./index.css";

console.log('=== CSS IMPORTED ===');

const rootElement = document.getElementById("root");

if (!rootElement) {
    document.body.innerHTML = '<h1 style="color:red">ERROR: Root element not found!</h1>';
    throw new Error('Root element not found');
}

console.log('=== CREATING ROOT ===');

createRoot(rootElement).render(<App />);

console.log('=== APP RENDERED ===');
