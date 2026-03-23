import { client } from "@/src/lib/axios";
import { GetAgentsPayload, AddAgentPayload} from "./types";

export const agentApi = {
  addAgent: async (orgId: string, payload: AddAgentPayload) => {
    const response = await client.post(`/api/Agent/org/${orgId}/action/AddAgent`, payload);
    return response.data;
  },

  deleteAgentById: async (orgId: string, agentId: string) => {
    const response = await client.delete(`/api/Agent/org/${orgId}/action/DeleteAgentById/${agentId}`);
    return response.data;
  },

  getAgentById: async (orgId: string, agentId: string) => {
    const response = await client.get(`/api/Agent/org/${orgId}/action/GetAgentById/${agentId}`);
    return response.data;
  },

  updateAgentById: async (orgId: string, agentId: string, payload: any) => {
    const response = await client.post(`/api/Agent/org/${orgId}/action/UpdateAgentById/${agentId}`, payload);
    return response.data;
  },

  getAgents: async (orgId: string, payload: GetAgentsPayload) => {
    const response = await client.post(`/api/Agent/org/${orgId}/action/GetAgents`, payload);
    return response.data;
  },

  getAgentCount: async (orgId: string, payload?: { fullTextSearch?: string }) => {
    const response = await client.post(`/api/Agent/org/${orgId}/action/GetAgentCount`, payload || {});
    return response.data;
  },

  heartbeat: async (orgId: string, agentId: string, payload?: any) => {
    const response = await client.post(`/api/Agent/org/${orgId}/action/Heartbeat/${agentId}`, payload || {});
    return response.data;
  }
};