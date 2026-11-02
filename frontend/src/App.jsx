import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import GamePage from "./pages/GamePage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import LessonsPage from "./pages/LessonsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OpeningPage from "./pages/OpeningPage.jsx";
import PuzzlesPage from "./pages/PuzzlesPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

const THEME_STORAGE_KEY = "theme_mode";

export default function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
      />
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/:gameId"
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            }
          />
          <Route path="/opening" element={<ProtectedRoute><OpeningPage /></ProtectedRoute>} />
          <Route path="/puzzles" element={<ProtectedRoute><PuzzlesPage /></ProtectedRoute>} />
          <Route path="/lessons" element={<ProtectedRoute><LessonsPage /></ProtectedRoute>} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
