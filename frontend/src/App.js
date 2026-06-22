import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CultureList from "@/pages/CultureList";
import CultureDetail from "@/pages/CultureDetail";
import { SpeciesPage, LocationsPage, RecipesPage, UsersPage } from "@/pages/ResourcePages";

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cultures" element={<CultureList />} />
            <Route path="cultures/:id" element={<CultureDetail />} />
            <Route path="species" element={<SpeciesPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="users" element={<AdminOnly><UsersPage /></AdminOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
