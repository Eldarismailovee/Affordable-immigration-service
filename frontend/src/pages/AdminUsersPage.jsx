import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers, updateAdminUserRole } from "../services/api";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminUsers();
      setUsers(result.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, role) {
    setUpdatingUserId(userId);
    setError("");

    try {
      await updateAdminUserRole(userId, role);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update user role");
    } finally {
      setUpdatingUserId("");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Admin
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Users and roles
            </h1>
            <p className="mt-3 text-slate-300">
              Manage registered accounts. Guests are unauthenticated visitors.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/admin"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
            >
              Leads
            </Link>
            <button
              type="button"
              onClick={loadUsers}
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div role="status" className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
            Loading users...
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-950/60">
                  <tr className="border-b border-white/10 text-left text-sm text-slate-300">
                    <th scope="col" className="px-4 py-4 font-medium">Name</th>
                    <th scope="col" className="px-4 py-4 font-medium">Email</th>
                    <th scope="col" className="px-4 py-4 font-medium">Role</th>
                    <th scope="col" className="px-4 py-4 font-medium">Status</th>
                    <th scope="col" className="px-4 py-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/10 align-top text-sm text-slate-200"
                    >
                      <td className="px-4 py-4 font-semibold text-white">
                        {user.fullName || "—"}
                      </td>
                      <td className="px-4 py-4">{user.email}</td>
                      <td className="px-4 py-4">
                        <select
                          value={user.role}
                          onChange={(event) => handleRoleChange(user.id, event.target.value)}
                          disabled={updatingUserId === user.id}
                          aria-label={`Role for ${user.email}`}
                          className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white disabled:opacity-60"
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">{user.status}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
