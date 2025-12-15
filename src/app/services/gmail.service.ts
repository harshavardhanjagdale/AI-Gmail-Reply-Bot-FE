import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EmailListItem {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export interface EmailDetail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body?: string;
  category?: string;
  action?: string;
  justification?: string;
}

export interface ReplyResponse {
  success: boolean;
  replyDraft: string;
  subject: string;
  messageId: string;
}

export interface SendResponse {
  success: boolean;
  message?: string;
}

interface ListEmailsResponse {
  messages: EmailListItem[];
}

interface FetchEmailResponse {
  result: {
    category?: string;
    action?: string;
    justification?: string;
    rawModelResponse?: string;
  };
  message?: {
    id: string;
    subject: string;
    snippet: string;
    body: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GmailService {
  private baseUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  listEmails(userId: string): Observable<EmailListItem[]> {
    return this.http.get<ListEmailsResponse>(`${this.baseUrl}/gmail/list/${userId}`).pipe(
      map(response => response.messages || [])
    );
  }

  fetchEmail(userId: string, messageId: string, emailListItem: EmailListItem): Observable<EmailDetail> {
    return this.http.get<FetchEmailResponse>(`${this.baseUrl}/gmail/fetch/${userId}/${messageId}`).pipe(
      map(response => ({
        ...emailListItem,
        category: response.result?.category,
        action: response.result?.action,
        justification: response.result?.justification,
        // Use body from API response (properly formatted with line breaks)
        snippet: response.message?.body || response.message?.snippet || emailListItem.snippet,
        body: response.message?.body
      }))
    );
  }

  generateReply(userId: string, messageId: string): Observable<ReplyResponse> {
    return this.http.post<ReplyResponse>(`${this.baseUrl}/gmail/reply/${userId}/${messageId}`, {}).pipe(
      map(response => ({
        success: response.success,
        replyDraft: response.replyDraft || '',
        subject: response.subject || '',
        messageId: response.messageId || messageId
      }))
    );
  }

  sendReply(userId: string, messageId: string, replyText: string): Observable<SendResponse> {
    return this.http.post<SendResponse>(`${this.baseUrl}/gmail/send/${userId}/${messageId}`, { replyText });
  }
}
