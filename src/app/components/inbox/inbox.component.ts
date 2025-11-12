import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GmailService, EmailListItem, EmailDetail } from '../../services/gmail.service';
import { EmailDetailComponent } from '../email-detail/email-detail.component';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, EmailDetailComponent],
  template: `
    <div class="inbox-container">
      <nav class="navbar navbar-dark bg-dark">
        <div class="container-fluid">
          <span class="navbar-brand mb-0 h1">Email Action Bot</span>
          <button class="btn btn-outline-light" (click)="logout()">
            <i class="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </nav>

      <div class="container-fluid">
        <div class="row">
          <div class="col-md-4 email-list-column">
            <div class="p-3">
              <h5 class="mb-3">
                <i class="bi bi-inbox-fill me-2"></i>Inbox
                <button
                  class="btn btn-sm btn-primary float-end"
                  (click)="loadEmails()"
                  [disabled]="loading">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </h5>

              <div *ngIf="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div *ngIf="error" class="alert alert-danger">
                {{ error }}
              </div>

              <div *ngIf="!loading && emails.length === 0" class="text-center text-muted py-5">
                No emails found
              </div>

              <div class="email-list">
                <div
                  *ngFor="let email of emails"
                  class="email-item"
                  [class.active]="selectedEmail?.id === email.id"
                  (click)="selectEmail(email)">
                  <div class="email-from">{{ email.from }}</div>
                  <div class="email-subject">{{ email.subject }}</div>
                  <div class="email-snippet">{{ email.snippet }}</div>
                  <div class="email-date">{{ formatDate(email.date) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-8 email-detail-column">
            <div *ngIf="!selectedEmail" class="text-center text-muted py-5">
              <i class="bi bi-envelope-open display-1"></i>
              <p class="mt-3">Select an email to view</p>
            </div>

            <app-email-detail
              *ngIf="selectedEmail"
              [email]="selectedEmail"
              [userId]="userId!"
              (emailSent)="onEmailSent()">
            </app-email-detail>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inbox-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .navbar {
      flex-shrink: 0;
    }

    .container-fluid {
      flex: 1;
      overflow: hidden;
    }

    .row {
      height: 100%;
    }

    .email-list-column {
      height: 100%;
      overflow-y: auto;
      background: white;
      border-right: 1px solid #dee2e6;
    }

    .email-detail-column {
      height: 100%;
      overflow-y: auto;
      padding: 20px;
    }

    .email-list {
      display: flex;
      flex-direction: column;
    }

    .email-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .email-item:hover {
      background: #f8f9fa;
    }

    .email-item.active {
      background: #e7f3ff;
      border-left: 3px solid #0d6efd;
    }

    .email-from {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }

    .email-subject {
      font-weight: 500;
      color: #555;
      margin-bottom: 5px;
    }

    .email-snippet {
      font-size: 0.9rem;
      color: #777;
      margin-bottom: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .email-date {
      font-size: 0.85rem;
      color: #999;
    }

    @media (max-width: 768px) {
      .email-detail-column {
        display: none;
      }

      .email-item.active + .email-detail-column {
        display: block;
      }
    }
  `]
})
export class InboxComponent implements OnInit {
  userId: string | null = null;
  emails: EmailListItem[] = [];
  selectedEmail: EmailDetail | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private gmailService: GmailService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        this.authService.setUserId(params['userId']);
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });
      }

      this.userId = this.authService.getUserId();
      if (!this.userId) {
        this.router.navigate(['/']);
        return;
      }

      this.loadEmails();
    });
  }

  loadEmails(): void {
    if (!this.userId) return;

    this.loading = true;
    this.error = '';

    this.gmailService.listEmails(this.userId).subscribe({
      next: (emails) => {
        this.emails = emails;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load emails. Please try again.';
        this.loading = false;
        console.error('Error loading emails:', err);
      }
    });
  }

  selectEmail(email: EmailListItem): void {
    if (!this.userId) return;

    this.loading = true;
    this.error = '';

    this.gmailService.fetchEmail(this.userId, email.id, email).subscribe({
      next: (emailDetail) => {
        this.selectedEmail = emailDetail;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load email details. Please try again.';
        this.loading = false;
        console.error('Error loading email details:', err);
      }
    });
  }

  onEmailSent(): void {
    this.selectedEmail = null;
    this.loadEmails();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
