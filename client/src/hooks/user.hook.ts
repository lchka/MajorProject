import { useCallback, useState } from "react";
import { userService, User } from "../services/userService";
// The useUser hook provides a convenient way to manage user-related data and operations within React components. It encapsulates the logic for fetching, updating, and deleting user data, as well as handling loading and error states. By using this hook, components can easily access and manipulate user data without having to directly interact with the underlying service layer, promoting cleaner and more maintainable code.
interface UseUserReturn {
  users: User[];
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  setUser: (user: User | null) => void;
  fetchUsers: () => Promise<User[]>;
  fetchUserById: (id: string) => Promise<User | null>;
  updateUser: (id: string, data: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
}

export const useUser = (): UseUserReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (): Promise<User[]> => {
    try {
      const response = await withLoading(() => userService.getAllUsers());
      setUsers(response);
      return response;
    } catch {
      return [];
    }
  }, [withLoading]);

  const fetchUserById = useCallback(
    async (id: string): Promise<User | null> => {
      try {
        const response = await withLoading(() => userService.getUserById(id));
        setUser(response);
        return response;
      } catch {
        return null;
      }
    },
    [withLoading],
  );

  const updateUser = useCallback(
    async (id: string, data: Partial<User>): Promise<User | null> => {
      try {
        const response = await withLoading(() => userService.updateUser(id, data));
        setUser(response);
        setUsers((prev) => prev.map((item) => (item.id === id ? response : item)));
        return response;
      } catch {
        return null;
      }
    },
    [withLoading],
  );

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await withLoading(() => userService.deleteUser(id));
        setUsers((prev) => prev.filter((item) => item.id !== id));
        setUser((prev) => (prev?.id === id ? null : prev));
        return true;
      } catch {
        return false;
      }
    },
    [withLoading],
  );

  return {
    users,
    user,
    loading,
    error,
    clearError,
    setUser,
    fetchUsers,
    fetchUserById,
    updateUser,
    deleteUser,
  };
};

export default useUser;