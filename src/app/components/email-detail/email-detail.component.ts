import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GmailService, EmailDetail } from '../../services/gmail.service';

@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="email-detail-container" *ngIf="email">
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="mb-2">{{ email.subject }}</h5>
          <div class="email-meta">
            <span class="badge bg-secondary me-2">From: {{ email.from }}</span>
            <span class="badge bg-info">{{ email.date | date:'short' }}</span>
          </div>
          <div *ngIf="email.classification" class="mt-2">
            <span class="badge bg-success">
              <i class="bi bi-robot me-1"></i>
              Classification: {{ email.classification }}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="email-snippet mb-3 p-3 bg-light rounded">
            {{ email.snippet }}
          </div>

          <div *ngIf="email.body" class="email-body mb-3">
            <h6 class="text-muted">Full Content:</h6>
            <div [innerHTML]="email.body" class="p-3 border rounded"></div>
          </div>

          <div class="action-section">
            <button
              *ngIf="!showReply"
              class="btn btn-primary"
              (click)="generateReply()"
              [disabled]="loadingReply">
              <span *ngIf="loadingReply" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!loadingReply" class="bi bi-reply-fill me-2"></i>
              Reply
            </button>

            <div *ngIf="showReply" class="reply-section mt-3">
              <div class="mb-3">
                <label class="form-label fw-bold">
                  <i class="bi bi-robot me-2"></i>AI Generated Reply:
                </label>
                <textarea
                  class="form-control"
                  rows="6"
                  [(ngModel)]="replyText"
                  placeholder="AI reply will appear here..."></textarea>
              </div>

              <div *ngIf="error" class="alert alert-danger">
                {{ error }}
              </div>

              <div *ngIf="success" class="alert alert-success">
                {{ success }}
              </div>

              <div class="btn-group" role="group">
                <button
                  class="btn btn-success"
                  (click)="sendReply()"
                  [disabled]="!replyText || sending">
                  <span *ngIf="sending" class="spinner-border spinner-border-sm me-2"></span>
                  <i *ngIf="!sending" class="bi bi-send-fill me-2"></i>
                  Pick (Send)
                </button>
                <button
                  class="btn btn-danger"
                  (click)="clearReply()"
                  [disabled]="sending">
                  <i class="bi bi-trash-fill me-2"></i>
                  Erase
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-detail-container {
      height: 100%;
    }

    .card {
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .card-header {
      border-bottom: 2px solid #e9ecef;
      padding: 20px;
    }

    .card-header h5 {
      color: #333;
      font-weight: 600;
      margin: 0;
    }

    .email-meta {
      margin-top: 10px;
    }

    .email-snippet {
      font-size: 0.95rem;
      color: #555;
      line-height: 1.6;
    }

    .email-body {
      max-height: 400px;
      overflow-y: auto;
    }

    .action-section {
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .reply-section {
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    textarea {
      font-size: 0.95rem;
      resize: vertical;
    }

    .btn-group {
      display: flex;
      gap: 10px;
    }

    .btn-group button {
      flex: 1;
    }

    .badge {
      font-size: 0.85rem;
      font-weight: 500;
      padding: 6px 12px;
    }
  `]
})
export class EmailDetailComponent {
  @Input() email!: EmailDetail;
  @Input() userId!: string;
  @Output() emailSent = new EventEmitter<void>();

  showReply = false;
  replyText = '';
  loadingReply = false;
  sending = false;
  error = '';
  success = '';

  constructor(private gmailService: GmailService) {}

  generateReply(): void {
    this.loadingReply = true;
    this.error = '';
    this.success = '';

    this.gmailService.generateReply(this.userId, this.email.id).subscribe({
      next: (response) => {
        this.replyText = response.replyDraft;
        this.showReply = true;
        this.loadingReply = false;
      },
      error: (err) => {
        this.error = 'Failed to generate reply. Please try again.';
        this.loadingReply = false;
        console.error('Error generating reply:', err);
      }
    });
  }

  sendReply(): void {
    if (!this.replyText) return;

    this.sending = true;
    this.error = '';
    this.success = '';

    this.gmailService.sendReply(this.userId, this.email.id, this.replyText).subscribe({
      next: (response) => {
        this.success = 'Reply sent successfully!';
        this.sending = false;

        setTimeout(() => {
          this.emailSent.emit();
        }, 1500);
      },
      error: (err) => {
        this.error = 'Failed to send reply. Please try again.';
        this.sending = false;
        console.error('Error sending reply:', err);
      }
    });
  }

  clearReply(): void {
    this.replyText = '';
    this.showReply = false;
    this.error = '';
    this.success = '';
  }
}
