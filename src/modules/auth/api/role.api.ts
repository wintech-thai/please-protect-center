import { client } from "@/src/lib/axios";
import { GetRolesPayload } from "./types";
import { GetCustomRolesPayload } from "./types";
import { RoleItem } from "./types";
import { CustomRoleItem } from "./types";

export const roleApi = {
  getRoles: async (orgId: string, payload: GetRolesPayload) => {
    const data = {
      offset: payload.offset || 0,
      limit: payload.limit || 100, 
      fullTextSearch: payload.fullTextSearch || "",
      ...(payload.fromDate && { fromDate: payload.fromDate }),
      ...(payload.toDate && { toDate: payload.toDate }),
    };

    const response = await client.post(`/api/Role/org/${orgId}/action/GetRoles`, data);
    return response.data;
  },

  getCustomRoles: async (orgId: string, payload: GetCustomRolesPayload) => {
    const data = {
      offset: payload.offset || 0,
      limit: payload.limit || 100,
      fullTextSearch: payload.fullTextSearch || "",
      ...(payload.level && { level: payload.level }),
      ...(payload.fromDate && { fromDate: payload.fromDate }),
      ...(payload.toDate && { toDate: payload.toDate }),
    };

    const response = await client.post(`/api/CustomRole/org/${orgId}/action/GetCustomRoles`, data);
    return response.data;
  },

  getCustomRoleCount: async (orgId: string, payload: { fullTextSearch?: string } = {}) => {
    const response = await client.post(
      `/api/CustomRole/org/${orgId}/action/GetCustomRoleCount`,
      payload
    );
    return response.data;
  },

  getInitialUserRolePermissions: async (orgId: string) => {
    const response = await client.get(
      `/api/CustomRole/org/${orgId}/action/GetInitialUserRolePermissions`
    );
    return response.data;
  },

  addCustomRole: async (orgId: string, payload: any) => {
    const response = await client.post(
      `/api/CustomRole/org/${orgId}/action/AddCustomRole`,
      payload
    );
    return response.data;
  },

  deleteCustomRoleById: async (orgId: string, customRoleId: string) => {
    const response = await client.delete(
      `/api/CustomRole/org/${orgId}/action/DeleteCustomRoleById/${customRoleId}`
    );
    return response.data;
  },

  getCustomRoleById: async (orgId: string, customRoleId: string) => {
    const response = await client.get(
      `/api/CustomRole/org/${orgId}/action/GetCustomRoleById/${customRoleId}`
    );
    return response.data;
  },

  updateCustomRoleById: async (orgId: string, customRoleId: string, payload: any) => {
    const response = await client.post(
      `/api/CustomRole/org/${orgId}/action/UpdateCustomRoleById/${customRoleId}`,
      payload
    );
    return response.data;
  },
};