import { useContext } from "react";
import { RolesContext, RolesState } from "../contexts/RolesContext";

export function useRoles(): RolesState {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error("useRoles must be used within a RolesProvider");
  }
  return context;
}
