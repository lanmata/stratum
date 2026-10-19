export interface Notice {
  createdAt?: string;
  userId: string;
  applicationId: string;
  noticeTypeId: string;
}

export interface NoticeRequest {
  notice: Notice;
}
