import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { HomeBuilderLoader } from "./features/home-builder/state/HomeBuilderLoader";
import { migrateGuestBuildsToAccount } from "./features/auth/migrationHelpers";
import { App } from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider onNewAccount={migrateGuestBuildsToAccount}>
        <HomeBuilderLoader>
          <App />
        </HomeBuilderLoader>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
