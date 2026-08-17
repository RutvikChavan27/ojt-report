import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./store/AuthContext";
import { SavedListingsProvider } from "./store/SavedListingsContext";
import { SavedSearchesProvider } from "./store/SavedSearchesContext";
import "./index.css";

/**
 * Entry point.
 *
 * BrowserRouter is outermost so every provider below it can navigate, and the
 * auth provider wraps the rest because whether someone is signed in decides what
 * the navbar and the seller pages show.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SavedListingsProvider>
          <SavedSearchesProvider>
            <App />
          </SavedSearchesProvider>
        </SavedListingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
