export interface GetAgentsPayload {
  offset: number;
  limit: number;
  fullTextSearch?: string;
}

export interface AddAgentPayload {
  AgentCode: string;
  Description: string;
  Tag?: string; 
}