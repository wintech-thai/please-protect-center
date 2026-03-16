import { client } from "@/src/lib/axios";
import { LoginSchemaType } from "../schema/login.schema"; 
import { LoginResponse } from "./types";

export const authApi = {
  signIn: async (data: LoginSchemaType): Promise<LoginResponse> => {
    const payload = {
      userName: data.username,
      password: data.password, 
    };
    
    const response = await client.post("/api/Auth/org/temp/action/Login", payload);
    return response.data;
  },

  refreshToken: async (orgId: string, payload: { userName: string, refreshToken: string }) => {
    const response = await client.post(`/api/Auth/org/${orgId}/action/Refresh`, payload);
    return response.data;
  },

  
  getUserAllowedOrg: async (): Promise<string[]> => {
    const orgType = "PLEASE-PROTECT";
    const response = await client.get(`/api/OnlyUser/org/temp/action/GetUserAllowedOrganization/${orgType}`);
    return response.data;
  },

  signOut: async () => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const response = await client.post(`/api/OnlyUser/org/${orgId}/action/Logout`);
    return response.data;
  },
};