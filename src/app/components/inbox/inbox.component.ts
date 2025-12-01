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
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  userId: string | null = null;
  emails: EmailListItem[] = [];
  selectedEmail: EmailDetail | null = null;
  loadingEmails = false;
  loadingEmailDetail = false;
  error = '';
  userName: string = 'User';

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

      // Load user profile to get actual name
      this.loadUserProfile();
      this.loadEmails();
    });
  }

  loadEmails(): void {
    if (!this.userId) return;

    this.loadingEmails = true;
    this.error = '';

    this.gmailService.listEmails(this.userId).subscribe({
      next: (emails) => {
        this.emails = emails;
        this.loadingEmails = false;
      },
      error: (err) => {
        this.error = 'Failed to load emails. Please try again.';
        this.loadingEmails = false;
        console.error('Error loading emails:', err);
      }
    });
  }

  loadUserProfile(): void {
    if (!this.userId) return;

    this.authService.getUserProfile(this.userId).subscribe({
      next: (profile) => {
        if (profile.name) {
          this.userName = profile.name;
        } else if (profile.email) {
          // Extract name from email if no name provided
          const emailParts = profile.email.split('@');
          this.userName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
        }
      },
      error: (err) => {
        // If API fails, fall back to extracting from userId
        console.warn('Failed to load user profile, using fallback:', err);
        this.extractUserName();
      }
    });
  }

  extractUserName(): void {
    if (this.userId) {
      // If userId is an email, extract the name part
      if (this.userId.includes('@')) {
        const emailParts = this.userId.split('@');
        this.userName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
      } else {
        this.userName = 'User';
      }
    }
  }


  selectEmail(email: EmailListItem): void {
    if (!this.userId) return;

    this.loadingEmailDetail = true;
    this.error = '';

    this.gmailService.fetchEmail(this.userId, email.id, email).subscribe({
      next: (emailDetail) => {
        this.selectedEmail = emailDetail;
        this.loadingEmailDetail = false;
      },
      error: (err) => {
        this.error = 'Failed to load email details. Please try again.';
        this.loadingEmailDetail = false;
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
