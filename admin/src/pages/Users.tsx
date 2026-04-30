import { useEffect, useState } from "react";
import {
  getUsers,
  softDeleteUser,
  forceDeleteUser,
  restoreUser,
} from "../services/userService";
import type { User } from "../services/userService";
import BackButton from "../components/general/BackButtonAdmin";
import Banner from "../components/general/Banner";
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
    const run = async () => {
      await loadUsers();
    };

    void run();
  }, []);


const handleSoftDelete = async (id: string) => {
  try {
    setActionLoading(id);
    await softDeleteUser(id);
    showBanner("User disabled successfully"); // <-- Add this
    await loadUsers();
  } catch (err) {
    showBanner("Failed to disable user", "error"); // <-- Add this
    console.error("Soft delete failed:", err);
  } finally {
    setActionLoading(null);
  }
};

const handleForceDelete = async (id: string) => {
  try {
    setActionLoading(id);
    await forceDeleteUser(id);
    showBanner("User permanently deleted"); // <-- Add this
    await loadUsers();
  } catch (err) {
    showBanner("Failed to delete user", "error"); // <-- Add this
    console.error("Force delete failed:", err);
  } finally {
    setActionLoading(null);
  }
};

const handleRestore = async (id: string) => {
  try {
    setActionLoading(id);
    await restoreUser(id);
    showBanner("User restored successfully"); // <-- Add this
    await loadUsers();
  } catch (err) {
    showBanner("Failed to restore user", "error"); // <-- Add this
    console.error("Restore failed:", err);
  } finally {
    setActionLoading(null);
  }
};
  const activeUsers = users.filter((u) => !u.deletedAt);
  const removedUsers = users.filter((u) => u.deletedAt);
  const displayedUsers = tab === "active" ? activeUsers : removedUsers;
// Inside your Users component
const [banner, setBanner] = useState<{
  message: string;
  type: "success" | "error" | "info";
  isVisible: boolean;
}>({
  message: "",
  type: "info",
  isVisible: false,
});

// Helper to show banner and hide it after 2 seconds
const showBanner = (message: string, type: "success" | "error" | "info" = "success") => {
  setBanner({ message, type, isVisible: true });
  setTimeout(() => {
    setBanner((prev) => ({ ...prev, isVisible: false }));
  }, 2000);
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
<Banner 
      message={banner.message} 
      type={banner.type} 
      isVisible={banner.isVisible} 
    />
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Users
              </h1>
              <p className="text-zinc-400 text-sm">
                Manage user accounts
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "active"
                ? "bg-white text-black"
                : "bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
            }`}
          >
            Active ({activeUsers.length})
          </button>

          <button
            onClick={() => setTab("removed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "removed"
                ? "bg-white text-black"
                : "bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
            }`}
          >
            Removed ({removedUsers.length})
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <p className="text-zinc-400">Loading users...</p>
        ) : (
          <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            {displayedUsers.length === 0 ? (
              <p className="p-4 text-zinc-400 text-sm">
                No users found.
              </p>
            ) : (
              displayedUsers.map((user) => {
                const isBusy = actionLoading === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex justify-between items-center px-4 py-4 border-b border-white/10 last:border-none"
                  >
                    {/* USER INFO */}
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-zinc-400">
                        {user.first_name} {user.last_name} • {user.role.name}
                      </p>

                      {user.deletedAt && (
                        <p className="text-xs text-red-400 mt-1">
                          Removed
                        </p>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3">
                      {tab === "active" ? (
                        <button
                          onClick={() => handleSoftDelete(user.id)}
                          disabled={isBusy}
                          className="text-yellow-400 hover:text-yellow-300 text-sm disabled:opacity-50 transition"
                        >
                          {isBusy ? "Disabling..." : "Disable"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(user.id)}
                            disabled={isBusy}
                            className="text-green-400 hover:text-green-300 text-sm disabled:opacity-50 transition"
                          >
                            {isBusy ? "Restoring..." : "Restore"}
                          </button>

                          <button
                            onClick={() => handleForceDelete(user.id)}
                            disabled={isBusy}
                            className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50 transition"
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
    </div>
  );
}