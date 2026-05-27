import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b11] flex items-center justify-center text-[#94a3b8] font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold glow-text">Synchronizing environment...</div>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
