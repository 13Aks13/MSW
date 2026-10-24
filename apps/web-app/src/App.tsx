import { App as AntApp, ConfigProvider, theme } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import BackupsPage from "./pages/BackupsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import LogsPage from "./pages/LogsPage";
import NotFoundPage from "./pages/NotFoundPage";
import PacksPage from "./pages/PacksPage";
import ServerPage from "./pages/ServerPage";
import SettingsPage from "./pages/SettingsPage";
import WorldsPage from "./pages/WorldsPage";

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1f6f43",
          borderRadius: 10,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/packs" element={<PacksPage />} />
              <Route path="/worlds" element={<WorldsPage />} />
              <Route path="/backups" element={<BackupsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/server" element={<ServerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
