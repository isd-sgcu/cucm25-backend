export type GiftHistoryRecord = {
  recipientName: string;
  amount: number;
  timestamp: Date;
};

export type CoinHistoryRecord = {
  correspondentName: string;
  amount: number;
  action: string; // 'sent' | 'received'
  timestamp: Date;
};
