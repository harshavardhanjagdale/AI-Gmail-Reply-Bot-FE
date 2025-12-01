import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
export class EmailDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() email!: EmailDetail;
  @Input() userId!: string;
  @Output() emailSent = new EventEmitter<void>();

  showReply = false;
  replyText = '';
  loadingReply = false;
  sending = false;
  error = '';
  success = '';
  showInfo = false;

  get isNonGmailEmail(): boolean {
    if (!this.email || !this.email.from) return false;
    return !this.isGmailEmail(this.email.from);
  }

  constructor(private gmailService: GmailService) {}

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

  toggleInfo(): void {
    this.showInfo = !this.showInfo;
  }

  private extractEmailAddress(fromField: string): string {
    // Handle formats like "Name <email@domain.com>" or just "email@domain.com"
    const emailMatch = fromField.match(/<([^>]+)>/) || fromField.match(/([\w\.-]+@[\w\.-]+\.\w+)/);
    return emailMatch ? emailMatch[1] || emailMatch[0] : fromField;
  }

  private isGmailEmail(fromField: string): boolean {
    const email = this.extractEmailAddress(fromField);
    return email.toLowerCase().includes('@gmail.com');
  }

  private checkAndShowInfoPopup(): void {
    if (this.email && this.email.from) {
      const isGmail = this.isGmailEmail(this.email.from);
      
      if (!isGmail) {
        // Show info popup automatically after a short delay
        setTimeout(() => {
          this.showInfo = true;
        }, 500);
      } else {
        // Hide popup if it's a Gmail address
        this.showInfo = false;
      }
    }
  }

  private clickListener?: (event: MouseEvent) => void;

  ngOnInit(): void {
    // Close info popup when clicking outside
    this.clickListener = (event: MouseEvent) => {
      if (this.showInfo) {
        const target = event.target as HTMLElement;
        if (!target.closest('.info-button-wrapper')) {
          this.showInfo = false;
        }
      }
    };
    document.addEventListener('click', this.clickListener);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if email input changed
    if (changes['email'] && this.email && this.email.from) {
      this.checkAndShowInfoPopup();
    }
  }

  generateReply(): void {
    // Check if email is not from Gmail and show popup
    if (this.email && this.email.from && !this.isGmailEmail(this.email.from)) {
      this.showInfo = true;
    }

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

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }
}
