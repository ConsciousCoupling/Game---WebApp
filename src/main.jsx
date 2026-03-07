import ReactDOM from 'react-dom/client'
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter } from 'react-router-dom'
import { runIdentityMigrations } from "./services/identityMigrations";
import { ensureAnonymousAuth } from "./services/firebase";
import './index.css'

async function bootstrap() {
  // Run BEFORE rendering the app
  runIdentityMigrations();

  try {
    await ensureAnonymousAuth();
  } catch (error) {
    console.error("Firebase anonymous auth failed:", error);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

bootstrap();
