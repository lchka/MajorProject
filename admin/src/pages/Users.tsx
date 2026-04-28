import { useEffect, useState } from "react";
import {
  getUsers,
  softDeleteUser,
  forceDeleteUser,
  restoreUser,
} from "../services/userService";
import type { User } from "../services/userService";
import BackButton from "../components/general/BackButtonAdmin";
export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "removed">("active");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSoftDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await softDeleteUser(id);
      await loadUsers();
    } catch (err) {
      console.error("Soft delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await forceDeleteUser(id);
      await loadUsers();
    } catch (err) {
      console.error("Force delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      setActionLoading(id);
      await restoreUser(id);
      await loadUsers();
    } catch (err) {
      console.error("Restore failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const activeUsers = users.filter((u) => !u.deletedAt);
  const removedUsers = users.filter((u) => u.deletedAt);

  const displayedUsers = tab === "active" ? activeUsers : removedUsers;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <div className="py-4">
      <BackButton /></div>
      {/* TABS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-lg ${
            tab === "active" ? "bg-white text-black" : "bg-white/10"
          }`}
        >
          Active ({activeUsers.length})
        </button>

        <button
          onClick={() => setTab("removed")}
          className={`px-4 py-2 rounded-lg ${
            tab === "removed" ? "bg-white text-black" : "bg-white/10"
          }`}
        >
          Removed ({removedUsers.length})
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading users...</p>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {displayedUsers.length === 0 ? (
            <p className="p-4 text-zinc-400 text-sm">No users found.</p>
          ) : (
            displayedUsers.map((user) => {
              const isBusy = actionLoading === user.id;

              return (
                <div
                  key={user.id}
                  className="flex justify-between items-center px-4 py-3 border-b border-white/10"
                >
                  {/* USER INFO */}
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-zinc-400">
                      {user.first_name} {user.last_name} • {user.role.name}
                    </p>

                    {user.deletedAt && (
                      <p className="text-xs text-red-400 mt-1">Removed</p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3">
                    {tab === "active" ? (
                      <button
                        onClick={() => handleSoftDelete(user.id)}
                        disabled={isBusy}
                        className="text-yellow-400 hover:text-yellow-300 text-sm disabled:opacity-50"
                      >
                        {isBusy ? "Disabling..." : "Disable"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(user.id)}
                          disabled={isBusy}
                          className="text-green-400 hover:text-green-300 text-sm disabled:opacity-50"
                        >
                          {isBusy ? "Restoring..." : "Restore"}
                        </button>

                        <button
                          onClick={() => handleForceDelete(user.id)}
                          disabled={isBusy}
                          className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                        >
                          {isBusy ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
