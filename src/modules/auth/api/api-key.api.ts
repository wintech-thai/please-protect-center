import { client } from "@/src/lib/axios";
import { 
  GetApiKeysPayload, 
  GetApiKeysResponse 
} from "./types";

export const apiKeyApi = {
  verifyApiKey: async (orgId: string, apiKey: string) => {
    const response = await client.get(`/api/ApiKey/org/${orgId}/action/VerifyApiKey/${apiKey}`);
    return response.data;
  },

  addApiKey: async (orgId: string, payload: any) => {
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/AddApiKey`, payload);
    return response.data;
  },

  deleteApiKeyById: async (orgId: string, keyId: string) => {
    const response = await client.delete(`/api/ApiKey/org/${orgId}/action/DeleteApiKeyById/${keyId}`);
    return response.data;
  },

  getApiKeys: async (orgId: string, payload: GetApiKeysPayload): Promise<GetApiKeysResponse> => {
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/GetApiKeys`, payload);
    return response.data;
  },

  getApiKeyCount: async (orgId: string, payload?: { fullTextSearch?: string }) => {
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/GetApiKeyCount`, payload || {});
    return response.data;
  },

  updateApiKeyById: async (orgId: string, keyId: string, payload: any) => {
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/UpdateApiKeyById/${keyId}`, payload);
    return response.data;
  },

  enableApiKeyById: async (orgId: string, keyId: string) => {
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/EnableApiKeyById/${keyId}`);
    return response.data;
  },

  disableApiKeyById: async (orgId: string, keyId: string) => {
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/DisableApiKeyById/${keyId}`);
    return response.data;
  },

  getApiKeyById: async (orgId: string, keyId: string) => {
    const response = await client.get(`/api/ApiKey/org/${orgId}/action/GetApiKeyById/${keyId}`);
    return response.data;
  },
};