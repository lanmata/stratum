export interface Notice {
  id: string;
  createdAt?: string;
  userId: string;
  applicationId: string;
  noticeTypeId: string;
}

export interface NoticeRequest {
  notice: Notice;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
