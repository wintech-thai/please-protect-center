import { client } from "@/src/lib/axios";

export interface AuditLogQueryPayload {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
  [key: string]: any;
}

export const auditLogApi = {
  getAuditLogs: async (orgId: string, payload: AuditLogQueryPayload = {}) => {
    const response = await client.post(
      `/api/AuditLog/org/${orgId}/action/GetAuditLogs`,
      payload
    );
    return response.data;
  },

  getAuditLogCount: async (orgId: string, payload: AuditLogQueryPayload = {}) => {
    const response = await client.post(
      `/api/AuditLog/org/${orgId}/action/GetAuditLogCount`,
      payload
    );
    return response.data;
  },

  getAuditLogById: async (orgId: string, auditLogId: string) => {
    const response = await client.get(
      `/api/AuditLog/org/${orgId}/action/GetAuditLogById/${auditLogId}`
    );
    return response.data;
  },

  searchAuditLogs: async (orgId: string, esPayload: any) => {
    const response = await client.post(
      `/api/AuditLog/org/${orgId}/action/GetAuditLogs`,
      esPayload 
    );
    return response.data;
  },
};