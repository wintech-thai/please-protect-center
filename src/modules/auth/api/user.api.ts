
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

  confirmInvite: async (orgId: string, token: string, payload: any) => {
    const url = `/api/Registration/org/${orgId}/action/ConfirmNewUserInvitation/${token}/${payload.username}`;
    const body = {
      Email: payload.email,
      UserName: payload.username,
      Password: payload.password,
      Name: payload.firstName,
      LastName: payload.lastName,
      OrgUserId: payload.orgUserId
    };
    const response = await client.post(url, body);
    return response.data;
  },

  confirmExistingUserInvite: async (orgId: string, token: string, username: string, payload: any) => {
    const url = `/api/Registration/org/${orgId}/action/ConfirmExistingUserInvitation/${token}/${username}`;
    
    const body = {
      Email: payload.email,
      UserName: payload.username,
      OrgUserId: payload.orgUserId
    };
    
    const response = await client.post(url, body);
    return response.data;
  },

  getForgotPasswordLink: async (orgId: string, userId: string): Promise<string> => {
    const response = await client.get(`/api/OrganizationUser/org/${orgId}/action/GetForgotPasswordLink/${userId}`);
    return response.data;
  },

  confirmResetPassword: async (
    orgId: string, 
    token: string, 
    payload: { 
      password: string; 
      username: string; 
      email: string;      
      orgUserId: string;  
    }
  ) => {
    
    const url = `/api/Registration/org/${orgId}/action/ConfirmForgotPasswordReset/${token}/${payload.username}`;

    const body = {
      Password: payload.password,
      UserName: payload.username,
      Email: payload.email,         
      OrgUserId: payload.orgUserId, 
    };

    console.log("🚀 Calling API:", url);
    console.log("📦 Payload:", body);

    const response = await client.post(url, body);
    return response.data;
  },
};