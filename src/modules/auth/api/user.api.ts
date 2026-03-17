
import { client } from "@/src/lib/axios";
import { 
  InviteUserPayload, 
  UserItem, 
  GetUsersPayload, 
  GetUsersResponse 
} from "./types";




export const userApi = {
  getUsers: async (orgId: string, payload: GetUsersPayload): Promise<GetUsersResponse> => {
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/GetUsers`, payload);
    return response.data;
  },

  getUserCount: async (orgId: string, payload?: { fullTextSearch?: string }) => {
    const response = await client.post(`api/OrganizationUser/org/${orgId}/action/GetUserCount`, payload || {});
    return response.data; 
  },

  addUser: async (orgId: string, userData: any) => {
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/AddUser`, userData);
    return response.data;
  },

  deleteUser: async (orgId: string, userId: string) => {
    const response = await client.delete(`api/OrganizationUser/org/${orgId}/action/DeleteUserById/${userId}`);
    return response.data;
  },

  getUserById: async (orgId: string, userId: string) => {
    const response = await client.get(`api/OrganizationUser/org/${orgId}/action/GetUserById/${userId}`);
    return response.data;
  },

  updateUserById: async (orgId: string, userId: string, payload: any) => {
    const response = await client.post(`api/OrganizationUser/org/${orgId}/action/UpdateUserById/${userId}`, payload);
    return response.data;
  },

  inviteUserWithLink: async (orgId: string, payload: any) => {
    const response = await client.post(
      `/api/OrganizationUser/org/${orgId}/action/InviteUserWithLink`,
      payload
    );
    return response.data;
  },

  enableUserById: async (orgId: string, userId: string) => {
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/EnableUserById/${userId}`,);
    return response.data;
  },

  
  disableUserById: async (orgId: string, userId: string) => {
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/DisableUserById/${userId}`,);
    return response.data;
  },

  confirmInvite: async (orgId: string, token: string, userName: string, data: any) => {
  const response = await client.post(
    `/api/Registration/org/${orgId}/action/ConfirmNewUserInvitation/${token}/${userName}`,
    data
  );
  return response.data;
},
};