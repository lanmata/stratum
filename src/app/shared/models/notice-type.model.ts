export interface NoticeType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoticeTypeRequest {
  noticeType: NoticeType;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
