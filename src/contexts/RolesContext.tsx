import React, { createContext, useState, useEffect, useCallback } from "react";
import { Role } from "../models/Role";
import { useAuth } from "../auth/AuthContext";
import {
  getRoles,
  addRole as apiAddRole,
  updateRole as apiUpdateRole,
  deleteRole as apiDeleteRole,
} from "../api/googleSheets";
import { generateId } from "../utils/uuid";

export interface RolesState {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  addRole: (name: string, description: string, colorId?: string) => Promise<Role>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const RolesContext = createContext<RolesState | null>(null);

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const { getValidAccessToken, isLoggedIn } = useAuth();
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
    if (isLoggedIn) {
      loadRoles();
    } else {
      setRoles([]);
      setIsLoading(false);
    }
  }, [isLoggedIn, loadRoles]);

  const addRole = useCallback(
    async (name: string, description: string, colorId?: string) => {
      const now = new Date().toISOString();
      const newRole: Role = {
        id: generateId(),
        name,
        description,
        sortOrder: roles.length + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
        colorId,
      };

      setRoles((prev) => [...prev, newRole]);

      try {
        const token = await getValidAccessToken();
        await apiAddRole(token, newRole);
      } catch (err: any) {
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

      setRoles((prev) => prev.map((r) => (r.id === role.id ? updated : r)));

      try {
        const token = await getValidAccessToken();
        await apiUpdateRole(token, updated);
      } catch (err: any) {
        await loadRoles();
        setError(err.message);
        throw err;
      }
    },
    [getValidAccessToken, loadRoles]
  );

  const deleteRoleById = useCallback(
    async (roleId: string) => {
      const previous = roles;

      setRoles((prev) => prev.filter((r) => r.id !== roleId));

      try {
        const token = await getValidAccessToken();
        await apiDeleteRole(token, roleId);
      } catch (err: any) {
        setRoles(previous);
        setError(err.message);
        throw err;
      }
    },
    [roles, getValidAccessToken]
  );

  return (
    <RolesContext.Provider
      value={{
        roles,
        isLoading,
        error,
        addRole,
        updateRole,
        deleteRole: deleteRoleById,
        refresh: loadRoles,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
}
