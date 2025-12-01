import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GmailService, EmailDetail } from '../../services/gmail.service';

@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-detail.component.html',
  styleUrls: ['./email-detail.component.css']
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
