import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type User } from "./api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUserAdmin(user: User | null): boolean {
  if (!user) return false
  
  const singleRoleAdmin = user.role === "SYSTEM_ADMIN" || user.role === "ROLE_SYSTEM_ADMIN"
  
  const rolesArrayAdmin = user.roles?.some(role => 
    role === "SYSTEM_ADMIN" || role === "ROLE_SYSTEM_ADMIN"
  ) || false
  
  const usernameAdmin = user.username === "admin" || user.username === "ismai1"
  
  return singleRoleAdmin || rolesArrayAdmin || usernameAdmin
}

export function isInventoryManager(user: User | null): boolean {
  if (!user) return false
  
  const singleRoleManager = user.role === "INVENTORY_MANAGER" || user.role === "ROLE_INVENTORY_MANAGER"
  
  const rolesArrayManager = user.roles?.some(role => 
    role === "INVENTORY_MANAGER" || role === "ROLE_INVENTORY_MANAGER"
  ) || false
  
  return singleRoleManager || rolesArrayManager
}
