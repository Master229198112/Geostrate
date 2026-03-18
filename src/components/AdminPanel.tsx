import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Ticket,
  Check,
  X,
  LogOut,
  Clock,
  Settings,
  Lock,
  Crown,
  BarChart3,
  Sliders,
  Search,
  Plus,
} from "lucide-react";

interface Props {
  onClose: () => void;
}

interface AdminData {
  promoCodes: any[];
  subscribers: any[];
  pendingRequests: any[];
  plans: any[];
  analysisLogs: any[];
  variableConfigs: any[];
}

export default function AdminPanel({ onClose }: Props) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("geostrate_admin_token") || "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<
    "pending" | "subs" | "promos" | "plans" | "logs" | "vars" | "settings"
  >("pending");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Password change state
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");

  // Variable tab state
  const [varSearch, setVarSearch] = useState("");
  const [showAddVar, setShowAddVar] = useState(false);
  const [newVar, setNewVar] = useState<any>({
    symbol: "",
    name: "",
    description: "",
    metric: "SCM",
    layer: 0,
    weight: 0.25,
    defaultValue: 0.5,
    isActive: true,
  });

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Login failed");
      sessionStorage.setItem("geostrate_admin_token", resData.token);
      setToken(resData.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("geostrate_admin_token");
    setToken("");
    setData(null);
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    }
  };

  const saveData = async (updates: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        // Refetch data from server to stay in sync with MongoDB
        await fetchData();
      } else {
        alert("Failed to save data");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  // ----- Actions -----

  const approveRequest = async (req: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/approve-user/${req._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to approve");
      }
      await fetchData();
    } catch (err) {
      alert("Error approving request");
    } finally {
      setSaving(false);
    }
  };

  const rejectRequest = async (reqId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/reject-request/${reqId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
    } catch (err) {
      alert("Error rejecting request");
    } finally {
      setSaving(false);
    }
  };

  const togglePromo = (promoId: string) => {
    const newPromos = data.promoCodes.map((p: any) =>
      p._id === promoId ? { ...p, isActive: !p.isActive } : p,
    );
    saveData({ promoCodes: newPromos });
  };

  const createPromo = () => {
    const code = prompt("Enter new promo code:");
    if (!code) return;
    const uses = parseInt(prompt("Max uses?", "100") || "100");
    if (isNaN(uses)) return;

    const newPromo = {
      code: code.toUpperCase(),
      features: { ppt: true, pdf: true },
      maxUses: uses,
      usedCount: 0,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
    };
    saveData({ promoCodes: [...data.promoCodes, newPromo] });
  };

  const toggleSub = async (subId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/toggle-user/${subId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
    } catch (err) {
      alert("Error toggling user");
    } finally {
      setSaving(false);
    }
  };

  // ----- Password Change -----
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    setPassError("");

    if (newPass !== confirmPass) {
      setPassError("New passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      setPassError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });
      const resData = await res.json();
      if (!res.ok)
        throw new Error(resData.error || "Failed to change password");
      setPassMsg("Password changed successfully!");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      setPassError(err.message);
    }
  };

  // ----- Renders -----

  if (!token) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-w-sm w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider">
            Admin Access
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Admin Password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-center text-lg focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            {error && (
              <p className="text-rose-500 text-sm text-center font-medium">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold py-3 rounded-sm transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-rose-500" />
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
            Geostrate Admin
          </h1>
          {saving && (
            <span className="text-xs text-amber-500 animate-pulse ml-4">
              Saving changes...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 transition-colors uppercase font-bold tracking-wider"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 shrink-0 overflow-y-auto">
          <nav className="space-y-2">
            <button
              onClick={() => setTab("pending")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "pending" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Clock className="w-4 h-4" /> Pending Requests
              {data && data.pendingRequests?.length > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {data.pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("subs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "subs" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Users className="w-4 h-4" /> Subscribers
            </button>
            <button
              onClick={() => setTab("promos")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "promos" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Ticket className="w-4 h-4" /> Promo Codes
            </button>
            <button
              onClick={() => setTab("plans")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "plans" ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Crown className="w-4 h-4" /> Plans
            </button>
            <button
              onClick={() => setTab("logs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "logs" ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics & Logs
            </button>
            <button
              onClick={() => setTab("vars")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "vars" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Sliders className="w-4 h-4" /> Variables & Formulas
            </button>
            <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
            <button
              onClick={() => setTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${tab === "settings" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {!data ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              {/* TAB: PENDING REQUESTS */}
              {tab === "pending" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-5 h-5 text-rose-500" /> Pending
                    Activations
                  </h2>
                  {data.pendingRequests?.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center text-slate-500">
                      No pending requests.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Requested Plan</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                          {data.pendingRequests.map((req: any) => (
                            <tr key={req._id}>
                              <td className="px-6 py-4 font-mono">
                                {req.email}
                              </td>
                              <td className="px-6 py-4 font-bold">
                                {data.plans.find(
                                  (p: any) => p.planId === req.planId,
                                )?.name || req.planId}
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">
                                {new Date(req.requestedAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button
                                  onClick={() => approveRequest(req)}
                                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 px-3 py-1.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => rejectRequest(req._id)}
                                  className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800/50 px-3 py-1.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: SUBSCRIBERS */}
              {tab === "subs" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" /> Subscribers
                    </h2>
                  </div>
                  {data.subscribers?.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center text-slate-500">
                      No active subscribers yet. Approve requests from the
                      Pending tab.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Plan (Status)</th>
                            <th className="px-6 py-4">Usage</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                          {data.subscribers.map((sub: any) => (
                            <tr
                              key={sub._id}
                              className={!sub.isActive ? "opacity-50" : ""}
                            >
                              <td className="px-6 py-4 font-medium">
                                {sub.name || "—"}
                              </td>
                              <td className="px-6 py-4 font-mono font-medium">
                                {sub.email}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold">{sub.plan}</span>
                                {!sub.isActive && (
                                  <span className="ml-2 bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                    Revoked
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{
                                        width: `${Math.min(100, (sub.downloadsUsed / sub.downloadsAllowed) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono">
                                    {sub.downloadsUsed} / {sub.downloadsAllowed}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => toggleSub(sub._id)}
                                    className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 border rounded-sm transition-colors ${sub.isActive ? "text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20"}`}
                                  >
                                    {sub.isActive ? "Revoke" : "Restore"}
                                  </button>
                                  {sub.plan === "Advance" && (
                                    <button
                                      onClick={async () => {
                                        const key = prompt(
                                          `Set Gemini API Key for ${sub.name || sub.email}:\n(Leave empty to remove)`,
                                        );
                                        if (key === null) return;
                                        try {
                                          await fetch(
                                            `/api/admin/user/${sub._id}/api-key`,
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                                Authorization: `Bearer ${token}`,
                                              },
                                              body: JSON.stringify({
                                                apiKey: key || "",
                                              }),
                                            },
                                          );
                                          alert(
                                            key
                                              ? "API key set!"
                                              : "API key removed.",
                                          );
                                          fetchData();
                                        } catch {
                                          alert("Failed");
                                        }
                                      }}
                                      className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 border rounded-sm transition-colors ${sub.encryptedApiKey ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20" : "text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-900/20"}`}
                                    >
                                      {sub.encryptedApiKey
                                        ? "🔑 Key Set"
                                        : "Set Key"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROMOS */}
              {tab === "promos" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-emerald-500" /> Promo
                      Codes
                    </h2>
                    <button
                      onClick={createPromo}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                    >
                      + Create Code
                    </button>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4">Code</th>
                          <th className="px-6 py-4">Features</th>
                          <th className="px-6 py-4">Usage</th>
                          <th className="px-6 py-4">Validity</th>
                          <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {data.promoCodes.map((promo: any) => (
                          <tr
                            key={promo._id}
                            className={!promo.isActive ? "opacity-50" : ""}
                          >
                            <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-lg tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                              {promo.code}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 text-[10px] uppercase font-bold text-white tracking-widest">
                                {promo.features.ppt && (
                                  <span className="bg-indigo-500 px-2 py-0.5 rounded-sm">
                                    PPT
                                  </span>
                                )}
                                {promo.features.pdf && (
                                  <span className="bg-rose-500 px-2 py-0.5 rounded-sm">
                                    PDF
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono">
                                {promo.usedCount}
                              </span>{" "}
                              /{" "}
                              <span className="font-mono text-slate-400">
                                {promo.maxUses}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500">
                              {promo.validFrom} to {promo.validUntil}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => togglePromo(promo._id)}
                                className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 border rounded-sm transition-colors ${promo.isActive ? "text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20"}`}
                              >
                                {promo.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: PLANS */}
              {tab === "plans" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-500" /> Subscription
                    Tiers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.plans.map((p: any) => {
                      const isEditing = editingPlan?._id === p._id;
                      const ep = isEditing ? editingPlan : p;
                      return (
                        <div
                          key={p._id}
                          className={`bg-white dark:bg-slate-800 border rounded-sm p-6 shadow-sm flex flex-col ${isEditing ? "border-purple-400 dark:border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900/50" : "border-slate-200 dark:border-slate-700"}`}
                        >
                          {isEditing ? (
                            <>
                              <div className="mb-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                  Plan Name
                                </label>
                                <input
                                  value={ep.name}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...ep,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm font-bold focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div className="mb-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                  Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={ep.price}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...ep,
                                      price: Number(e.target.value),
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm font-mono focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div className="mb-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                  Downloads Allowed
                                </label>
                                <input
                                  type="number"
                                  value={ep.downloads}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...ep,
                                      downloads: Number(e.target.value),
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm font-mono focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ep.features.pdf}
                                    onChange={(e) =>
                                      setEditingPlan({
                                        ...ep,
                                        features: {
                                          ...ep.features,
                                          pdf: e.target.checked,
                                        },
                                      })
                                    }
                                    className="w-4 h-4 accent-purple-600"
                                  />
                                  PDF
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ep.features.ppt}
                                    onChange={(e) =>
                                      setEditingPlan({
                                        ...ep,
                                        features: {
                                          ...ep.features,
                                          ppt: e.target.checked,
                                        },
                                      })
                                    }
                                    className="w-4 h-4 accent-purple-600"
                                  />
                                  PPT
                                </label>
                              </div>
                              <div className="flex gap-2 mt-auto">
                                <button
                                  onClick={async () => {
                                    setSaving(true);
                                    try {
                                      await fetch(`/api/admin/plan/${ep._id}`, {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                          name: ep.name,
                                          price: ep.price,
                                          downloads: ep.downloads,
                                          features: ep.features,
                                        }),
                                      });
                                      setEditingPlan(null);
                                      await fetchData();
                                    } catch {
                                      alert("Save failed");
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-sm text-xs uppercase tracking-widest transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPlan(null)}
                                  className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-500 font-bold py-2 rounded-sm text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                {p.name}
                              </h3>
                              <div className="text-3xl font-mono text-blue-600 dark:text-blue-400 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                                <span className="text-lg">₹</span>
                                {p.price}
                              </div>
                              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-emerald-500" />{" "}
                                  {p.downloads} Report Downloads
                                </li>
                                <li className="flex items-center gap-2">
                                  {p.features.pdf ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <X className="w-4 h-4 text-slate-300" />
                                  )}{" "}
                                  PDF Export
                                </li>
                                <li className="flex items-center gap-2">
                                  {p.features.ppt ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <X className="w-4 h-4 text-slate-300" />
                                  )}{" "}
                                  PPT Export
                                </li>
                              </ul>
                              <button
                                onClick={() => setEditingPlan({ ...p })}
                                className="w-full py-2 border border-purple-200 dark:border-purple-800 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors rounded-sm"
                              >
                                Edit Plan
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: SETTINGS */}
              {tab === "settings" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-500" /> Settings
                  </h2>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm p-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                          Change Password
                        </h3>
                        <p className="text-xs text-slate-500">
                          Update your admin login password
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={oldPass}
                          onChange={(e) => setOldPass(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500"
                          required
                          minLength={6}
                        />
                      </div>

                      {passError && (
                        <p className="text-rose-500 text-sm font-medium">
                          {passError}
                        </p>
                      )}
                      {passMsg && (
                        <p className="text-emerald-600 text-sm font-medium">
                          {passMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-sm transition-colors uppercase tracking-widest text-xs"
                      >
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ----- LOGS TAB ----- */}
              {tab === "logs" && (
                <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                        System Analytics & Logs
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Recent analyses by guests and logged-in users
                      </p>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">
                        <th className="p-4">Time</th>
                        <th className="p-4">User Type</th>
                        <th className="p-4">Contact Details</th>
                        <th className="p-4">Problem Analyzed</th>
                        <th className="p-4 text-center">Risk</th>
                        <th className="p-4 text-center">Ψ Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {data?.analysisLogs?.map((log, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="p-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300 font-mono">
                            {new Date(log.timestamp).toLocaleDateString()}{" "}
                            <br />
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                                log.userType === "user"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              }`}
                            >
                              {log.userType}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {log.guestDetails?.name || "Anonymous"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {log.guestDetails?.email && (
                                <div>{log.guestDetails.email}</div>
                              )}
                              <div className="flex gap-2 text-[10px]">
                                {log.guestDetails?.mobile && (
                                  <span>• {log.guestDetails.mobile}</span>
                                )}
                                {log.guestDetails?.country && (
                                  <span>• {log.guestDetails.country}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 w-1/3">
                            <p
                              className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed"
                              title={log.problem}
                            >
                              {log.problem}
                            </p>
                          </td>
                          <td className="p-4 text-center font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                            {log.riskScore
                              ? (log.riskScore * 100).toFixed(0) + "%"
                              : "-"}
                          </td>
                          <td className="p-4 text-center">
                            {log.psiScore ? (
                              <span
                                className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${log.psiScore >= 0.387 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}
                              >
                                {log.psiScore.toFixed(3)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                      {!data?.analysisLogs?.length && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500 dark:text-slate-400 italic"
                          >
                            No analysis logs recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: VARIABLES & FORMULAS */}
              {tab === "vars" && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-500" /> Variables & Formulas
                    </h2>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search variables..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm pl-9 pr-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                          value={varSearch}
                          onChange={(e) => setVarSearch(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => setShowAddVar(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Add Variable
                      </button>
                    </div>
                  </div>

                  {showAddVar && (
                    <div className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/50 rounded-sm p-6 shadow-sm mb-6 relative">
                      <button
                        onClick={() => setShowAddVar(false)}
                        className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm text-slate-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">
                        Add New Variable
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Symbol *</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                            placeholder="e.g. TPI"
                            value={newVar.symbol}
                            onChange={(e) => setNewVar({...newVar, symbol: e.target.value.toUpperCase()})}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Name *</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                            placeholder="Variable Name"
                            value={newVar.name}
                            onChange={(e) => setNewVar({...newVar, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Metric</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                            placeholder="e.g. SCM"
                            value={newVar.metric}
                            onChange={(e) => setNewVar({...newVar, metric: e.target.value.toUpperCase()})}
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                        <textarea
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200 resize-none h-16"
                          placeholder="What does this variable measure?"
                          value={newVar.description}
                          onChange={(e) => setNewVar({...newVar, description: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Layer</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                            value={newVar.layer}
                            onChange={(e) => setNewVar({...newVar, layer: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weight</label>
                          <input
                            type="number"
                            step="0.05"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                            value={newVar.weight}
                            onChange={(e) => setNewVar({...newVar, weight: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Default Score</label>
                          <input
                            type="number"
                            step="0.1"
                            max="1.0"
                            min="0.0"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                            value={newVar.defaultValue}
                            onChange={(e) => setNewVar({...newVar, defaultValue: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowAddVar(false)}
                          className="px-4 py-2 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!newVar.symbol || !newVar.name) return alert("Symbol and Name are required");
                            const newConf = [...(data?.variableConfigs || []), newVar];
                            saveData({ variableConfigs: newConf });
                            setShowAddVar(false);
                            setNewVar({
                              symbol: "", name: "", description: "", metric: "SCM", layer: 0, weight: 0.25, defaultValue: 0.5, isActive: true
                            });
                          }}
                          disabled={saving}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Variable"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4 w-12 text-center text-slate-400">#</th>
                          <th className="px-6 py-4">Symbol</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4 text-center">Metric</th>
                          <th className="px-6 py-4 text-center">Weight</th>
                          <th className="px-6 py-4 text-center">Default</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {data.variableConfigs
                          ?.filter((v: any) => {
                            if (!varSearch) return true;
                            const term = varSearch.toLowerCase();
                            return (v.name?.toLowerCase().includes(term) || v.symbol?.toLowerCase().includes(term) || v.metric?.toLowerCase().includes(term));
                          })
                          .sort((a: any, b: any) => (a.layer || 0) - (b.layer || 0))
                          .map((v: any, index: number) => (
                            <tr key={v._id || v.symbol} className={!v.isActive ? "opacity-50" : ""}>
                              <td className="px-6 py-4 font-mono text-xs text-slate-400 text-center">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                {v.symbol}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                <div className="text-sm">{v.name}</div>
                                <div className="text-xs text-slate-500 line-clamp-1">{v.description}</div>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-xs">
                                {v.metric || "-"} <span className="text-slate-400 ml-1">(L{v.layer})</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-sm bg-transparent text-center"
                                  defaultValue={v.weight}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val !== v.weight && !isNaN(val)) {
                                      const newConf = data.variableConfigs.map((c: any) =>
                                        c._id === v._id ? { ...c, weight: val } : c
                                      );
                                      saveData({ variableConfigs: newConf });
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-sm bg-transparent text-center"
                                  defaultValue={v.defaultValue}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val !== v.defaultValue && !isNaN(val)) {
                                      const newConf = data.variableConfigs.map((c: any) =>
                                        c._id === v._id ? { ...c, defaultValue: val } : c
                                      );
                                      saveData({ variableConfigs: newConf });
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    const newConf = data.variableConfigs.map((c: any) =>
                                      c._id === v._id ? { ...c, isActive: !c.isActive } : c
                                    );
                                    saveData({ variableConfigs: newConf });
                                  }}
                                  className={`px-3 py-1.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors ${
                                    v.isActive
                                      ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200"
                                      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                                  }`}
                                >
                                  {v.isActive ? "Disable" : "Enable"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        {!data?.variableConfigs?.length && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                              No variables found. Wait for DB seeding.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
