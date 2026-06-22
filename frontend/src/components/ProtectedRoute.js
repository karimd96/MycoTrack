import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (user === null) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen flex items-center justify-center bg-[#0d100c] text-lime-300"
      >
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }
  if (user === false) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
