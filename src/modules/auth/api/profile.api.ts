import { client } from "@/src/lib/axios";

export const profileApi = {

  getUserByUserName: async (orgId: string, userName: string) => {
    const response = await client.get(`/api/OnlyUser/org/${orgId}/action/GetUserByUserName/${userName}`);
    return response.data;
  },

  updateUserByUserName: async (orgId: string, userName: string, payload: any) => {
    const response = await client.post(`/api/OnlyUser/org/${orgId}/action/UpdateUserByUserName/${userName}`, payload);
    return response.data;
  },

  updatePassword: async (orgId: string, payload: any) => {
    const response = await client.post(`/api/OnlyUser/org/${orgId}/action/UpdatePassword`, payload);
    return response.data;
  }
};