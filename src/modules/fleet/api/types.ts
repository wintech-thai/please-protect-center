export interface GetAgentsPayload {
  offset: number;
  limit: number;
  fullTextSearch?: string;
}

export interface AddAgentPayload {
  Code: string;
  Description: string;
  Tags: string; 
}