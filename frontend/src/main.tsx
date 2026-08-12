import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WishlistProvider } from "./store/WishlistContext";
import { CartProvider } from "./store/CartContext";
import { AuthProvider } from "./store/AuthContext";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  </React.StrictMode>
);