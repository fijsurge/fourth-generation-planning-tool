import { useState, useEffect, useCallback } from "react";
import { Role } from "../models/Role";
import { useAuth } from "../auth/AuthContext";
import {
  getRoles,
  addRole as apiAddRole,
  updateRole as apiUpdateRole,
  deleteRole as apiDeleteRole,
} from "../api/googleSheets";
import { generateId } from "../utils/uuid";

export function useRoles() {
  const { getValidAccessToken } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getValidAccessToken();
      const data = await getRoles(token);
      setRoles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getValidAccessToken]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const addRole = useCallback(
    async (name: string, description: string) => {
      const now = new Date().toISOString();
      const newRole: Role = {
        id: generateId(),
        name,
        description,
        sortOrder: roles.length + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic update
      setRoles((prev) => [...prev, newRole]);

      try {
        const token = await getValidAccessToken();
        await apiAddRole(token, newRole);
      } catch (err: any) {
        // Revert on failure
        setRoles((prev) => prev.filter((r) => r.id !== newRole.id));
        setError(err.message);
        throw err;
      }

      return newRole;
    },
    [roles.length, getValidAccessToken]
  );

  const updateRole = useCallback(
    async (role: Role) => {
      const updated = { ...role, updatedAt: new Date().toISOString() };

      // Optimistic update
      setRoles((prev) => prev.map((r) => (r.id === role.id ? updated : r)));

      try {
        const token = await getValidAccessToken();
        await apiUpdateRole(token, updated);
      } catch (err: any) {
        await loadRoles(); // Revert by reloading
        setError(err.message);
        throw err;
      }
    },
    [getValidAccessToken, loadRoles]
  );

  const deleteRoleById = useCallback(
    async (roleId: string) => {
      const previous = roles;

      // Optimistic update
      setRoles((prev) => prev.filter((r) => r.id !== roleId));

      try {
        const token = await getValidAccessToken();
        await apiDeleteRole(token, roleId);
      } catch (err: any) {
        setRoles(previous); // Revert
        setError(err.message);
        throw err;
      }
    },
    [roles, getValidAccessToken]
  );

  return {
    roles,
    isLoading,
    error,
    addRole,
    updateRole,
    deleteRole: deleteRoleById,
    refresh: loadRoles,
  };
}
