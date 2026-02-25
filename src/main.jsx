import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter } from 'react-router-dom'
import { runIdentityMigrations } from "./services/identityMigrations";
import './index.css'

// Run BEFORE rendering the app
runIdentityMigrations();

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);