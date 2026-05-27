import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      await register(formData);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Registration failed, please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b11] text-[#e2e8f0] flex items-center justify-center p-6 relative font-mono select-none overflow-hidden">
      {/* Background details */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none"></div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0f131a] border border-[#1e293b] p-8 rounded-2xl shadow-2xl relative z-10 space-y-5 animate-fade-in"
      >
        <div className="space-y-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">SPACE INITIALIZER</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">CREATE ACCOUNT</h1>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-[#64748b] uppercase">Developer Name</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Aryan Patel"
            className="w-full p-3 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-[#64748b] uppercase">Email Address</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="aryan@collabrix.dev"
            className="w-full p-3 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-[#64748b] uppercase">Password</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="•••••••• (Min 6 chars)"
            className="w-full p-3 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:bg-slate-800 disabled:text-[#475569] shadow-lg shadow-indigo-600/10"
        >
          {loading ? "Initializing..." : "Create Developer Space"}
        </button>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
          >
            Already registered? Login here ↗
          </Link>
        </div>
      </form>
    </div>
  );
}