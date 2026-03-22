
export interface LoginResponse {
  status: string;
  message: string;
  userName: string;
  description?: string;
  token: {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    id_token: string;
  };
}

export interface GetUsersParams {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetCustomRolesParams extends GetUsersParams {
  level?: string;
}

export interface GetApiKeysParams {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
  status?: string;
}

export interface UpdateUserPayload {
  userId?: string | null;
  userName: string;
  userEmail: string;
  name: string;
  lastName: string;
  phoneNumber: string;
  secondaryEmail?: string;
}

export interface UpdatePasswordPayload {
  userName: string;
  currentPassword: string;
  newPassword: string;
}

export interface InviteUserPayload {
  orgUserId?: string;
  orgCustomId?: string;
  userId?: string;
  userName?: string;
  createdDate?: string;
  rolesList?: string;
  isOrgInitialUser?: string;
  userStatus?: string;
  tmpUserEmail?: string;
  previousUserStatus?: string;
  invitedDate?: string;
  invitedBy?: string;
  tags?: string;
  customRoleId?: string;
  TmpUserEmail: string;
  orgName?: string;
  orgDesc?: string;
  orgType?: string;
  roles?: string[];
  customRoleName?: string;
  customRoleDesc?: string;
}

export interface CreateApiKeyPayload {
  keyName: string;
  description: string;
  customRoleId: string;
  roles: string[];
}

export interface ApiKeyResponse {
  keyId: string;
  apiKey: string; 
  orgId: string;
  keyName: string;
  keyDescription: string;
  keyStatus: string;
  rolesList: string;
  customRoleName?: string;
  customRoleDesc?: string;
}

export interface GetSubnetsParams {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
}

export interface GetRolesPayload {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
  fromDate?: string; 
  toDate?: string;   
}

export interface GetCustomRolesPayload extends GetRolesPayload {
  level?: string;
}

export interface RoleItem {
  id?: string;
  name?: string;
  description?: string;
}

export interface CustomRoleItem {
  id?: string;
  name?: string;
  level?: string;
}

export interface UserItem {
  orgUserId: string;
  orgCustomId: string;
  userId: string;
  userName: string;
  createdDate: string;
  rolesList: string;
  isOrgInitialUser: string;
  userStatus: string;
  tmpUserEmail: string | null;
  previousUserStatus: string;
  invitedDate: string;
  invitedBy: string | null;
  tags: string | null;
  customRoleId: string | null;
  userEmail: string | null;
  orgName: string | null;
  orgDesc: string | null;
  orgType: string | null;
  roles: string[];
  customRoleName: string | null;
  customRoleDesc: string | null;
}

export interface GetUsersPayload {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
}

export interface GetUsersResponse {
  data: UserItem[];
  totalCount: number;
  status?: string;
  message?: string;
}

export interface ApiKeyItem {
  keyId?: string;
  id?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  description?: string;
  isActive?: boolean | string;
  createdDate?: string;
  tags?: string | null;
}

export interface GetApiKeysPayload {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
}

export interface GetApiKeysResponse {
  data: ApiKeyItem[];
  totalCount?: number;
  status?: string;
  message?: string;
}