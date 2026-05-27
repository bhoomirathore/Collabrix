import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../lib/axios";

export default function Billing() {
  const { activeWorkspace } = useOutletContext();
  
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;

    const fetchBilling = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/workspaces/${wsId}/billing`);
        setBillingData(res.data);
      } catch (err) {
        console.error("Fetch billing error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [activeWorkspace]);

  return (
    <div className="p-6 md:p-8 space-y-6 font-mono select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Workspace settings</div>
          <h1 className="text-xl font-bold text-[#f8fafc]">Billing & Resource Quotas</h1>
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-[10px] text-[#64748b] uppercase font-mono">Querying billing server...</span>
        </div>
      ) : billingData ? (
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="bg-gradient-to-br from-[#10141f] to-[#0f131a] border border-indigo-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            
            <div className="space-y-2">
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider">
                CURRENT PLAN: PRO
              </span>
              <h3 className="text-base font-bold text-[#f8fafc] uppercase tracking-wide">
                {activeWorkspace?.name || "Collabrix Workspace"}
              </h3>
              <p className="text-[10px] text-[#64748b] leading-none">
                Next Billing Date: <span className="text-[#94a3b8]">{billingData.nextBillingDate}</span> ($12 / seat / month)
              </p>
            </div>

            <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shrink-0 shadow-lg shadow-indigo-600/10">
              UPGRADE TO ENTERPRISE
            </button>
          </div>

          {/* Quotas Meters Grid */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
              WORKSPACE RESOURCE USAGE
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Seats (Active Developers)",
                  current: billingData.usage.seats.current,
                  limit: billingData.usage.seats.limit,
                  unit: "seats",
                  color: "bg-indigo-500"
                },
                {
                  label: "Persistent Wiki & Storage",
                  current: billingData.usage.storage.current,
                  limit: billingData.usage.storage.limit,
                  unit: "GB",
                  color: "bg-emerald-500"
                },
                {
                  label: "API Gateway Requests",
                  current: billingData.usage.apiRequests.current,
                  limit: billingData.usage.apiRequests.limit,
                  unit: "reqs",
                  color: "bg-sky-500"
                },
                {
                  label: "AI Code Review Credits",
                  current: billingData.usage.aiCredits.current,
                  limit: billingData.usage.aiCredits.limit,
                  unit: "reviews",
                  color: "bg-purple-500"
                }
              ].map((quota, i) => {
                const percent = Math.round((quota.current / quota.limit) * 100);
                return (
                  <div key={i} className="p-5 bg-[#0f131a] border border-[#1e293b] rounded-xl space-y-3 font-mono shadow-md">
                    <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                      <span className="font-bold uppercase text-[#94a3b8]">{quota.label}</span>
                      <span className="text-[#f8fafc] font-bold">
                        {quota.current.toLocaleString()} / {quota.limit.toLocaleString()} {quota.unit}
                      </span>
                    </div>

                    <div className="w-full bg-[#0c0e15] h-2 rounded-full overflow-hidden border border-[#1e293b]/70">
                      <div className={`${quota.color} h-full rounded-full transition-all duration-300`} style={{ width: `${percent}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-[#64748b]">{percent}% of monthly quota consumed</span>
                      {percent > 70 ? (
                        <span className="text-amber-500/80 font-bold">⚠️ Quota near limit</span>
                      ) : (
                        <span className="text-emerald-500/80">✓ Within safe limits</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-xs text-[#475569] uppercase text-center border border-dashed border-[#1e293b] rounded-xl">
          Billing specifications unavailable.
        </div>
      )}
    </div>
  );
}
