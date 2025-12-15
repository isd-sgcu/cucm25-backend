import { TARGET_ROLES } from '@/constant/systemConfig';

export interface GenerateCodeRequest {
  targetRole: (typeof TARGET_ROLES)[keyof typeof TARGET_ROLES];
  activityName: string;
  rewardCoin: number;
  expiresAt: string;
}

export interface GenerateCodeResponse {
  id: number;
  codeString: string;
  targetRole: string;
  activityName: string;
  rewardCoin: number;
  createdByUserId: string;
  expiresAt: string;
  createdAt: string;
}

export interface RedeemCodeRequest {
  codeString: string;
}

export interface RedeemCodeResponse {
  success: boolean;
  message: string;
  rewardCoin: number;
  newBalance: number;
  transactionId: number;
  redeemedAt?: string;
}

export interface CodeWithCreator {
  id: number;
  code_string: string;
  target_role: string;
  activity_name: string;
  reward_coin: number;
  created_by_user_id: string;
  expires_at: Date | null;
  created_at: Date | null;
}

export interface CodeHistoryResponse {
  data: Array<CodeWithCreator>;
}
