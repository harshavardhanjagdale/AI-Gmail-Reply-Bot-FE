import { Component, OnInit, HostListener } from '@angular/core';
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
  showInfoPopup = false;
  
  // Classification tracking
  emailCategories: { [id: string]: string } = {};
  classifying = false;
  classifyingProgress = 0;
  selectedCategory: string | null = null;
  
  // Category configuration
  private categories = [
    { name: 'Invoice', icon: 'bi-receipt', class: 'invoice' },
    { name: 'Leave Request', icon: 'bi-calendar-check', class: 'leave' },
    { name: 'Support Request', icon: 'bi-headset', class: 'support' },
    { name: 'Meeting Request', icon: 'bi-calendar-event', class: 'meeting' },
    { name: 'Purchase Order', icon: 'bi-cart-check', class: 'purchase' },
    { name: 'Spam', icon: 'bi-shield-exclamation', class: 'spam' },
    { name: 'Other', icon: 'bi-envelope', class: 'other' }
  ];

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
        // Auto-classify all emails in background
        this.autoClassifyEmails();
      },
      error: (err) => {
        this.loadingEmails = false;
        if (this.isAuthError(err)) {
          this.handleAuthError();
        } else {
          this.error = 'Failed to load emails. Please try again.';
          console.error('Error loading emails:', err);
        }
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
        if (this.isAuthError(err)) {
          this.handleAuthError();
        } else {
          console.warn('Failed to load user profile, using fallback:', err);
          this.extractUserName();
        }
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
        // Store category for insights dashboard
        if (emailDetail.category) {
          this.emailCategories[email.id] = emailDetail.category;
        }
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

  // Check if the error is an authentication/authorization error
  private isAuthError(err: any): boolean {
    if (err.status === 401 || err.status === 403) {
      return true;
    }
    const errorMessage = err.error?.message || err.error?.error || err.message || '';
    const authKeywords = [
      'token', 'unauthorized', 'unauthenticated', 'access denied', 
      'invalid credentials', 'authentication', 'permission', 'revoked',
      're-authenticate', 'expired', 'invalid_grant'
    ];
    return authKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
  }

  private handleAuthError(): void {
    console.warn('Authentication error detected. Access may have been revoked.');
    this.authService.logout();
    this.router.navigate(['/'], { 
      queryParams: { message: 'access_revoked' } 
    });
  }

  toggleInfoPopup(event: Event): void {
    event.stopPropagation();
    this.showInfoPopup = !this.showInfoPopup;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showInfoPopup = false;
  }

  // Get count of classified emails
  getClassifiedCount(): number {
    return Object.keys(this.emailCategories).length;
  }

  // Get category summary for insights bar
  getCategorySummary(): Array<{ name: string; icon: string; class: string; count: number }> {
    const counts: { [key: string]: number } = {};
    
    Object.values(this.emailCategories).forEach(category => {
      counts[category] = (counts[category] || 0) + 1;
    });

    return this.categories
      .map(cat => ({ ...cat, count: counts[cat.name] || 0 }))
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  // Get category class for styling
  getCategoryClass(category: string): string {
    const cat = this.categories.find(c => c.name === category);
    return cat?.class || 'other';
  }

  // Get category icon
  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.name === category);
    return cat?.icon || 'bi-tag';
  }

  // Select a category to filter emails
  selectCategory(category: string): void {
    if (this.selectedCategory === category) {
      this.selectedCategory = null;
    } else {
      this.selectedCategory = category;
      const filteredEmails = this.getFilteredEmails();
      if (filteredEmails.length > 0) {
        this.selectEmail(filteredEmails[0]);
      }
    }
  }

  // Clear category filter
  clearCategoryFilter(): void {
    this.selectedCategory = null;
  }

  // Get filtered emails based on selected category
  getFilteredEmails(): EmailListItem[] {
    if (!this.selectedCategory) {
      return this.emails;
    }
    return this.emails.filter(email => 
      this.emailCategories[email.id] === this.selectedCategory
    );
  }

  private async autoClassifyEmails(): Promise<void> {
    if (!this.userId || this.emails.length === 0) return;

    this.classifying = true;
    this.classifyingProgress = 0;
    this.emailCategories = {};

    const BATCH_SIZE = 5; // Process 5 emails at a time for speed
    const emails = [...this.emails];
    
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(email => this.classifyEmail(email))
      );
      
      this.classifyingProgress = Math.min(i + BATCH_SIZE, emails.length);
    }

    this.classifying = false;
  }

  // Classify a single email
  private classifyEmail(email: EmailListItem): Promise<void> {
    return new Promise((resolve) => {
      if (!this.userId) {
        resolve();
        return;
      }
      
      this.gmailService.fetchEmail(this.userId, email.id, email).subscribe({
        next: (emailDetail) => {
          if (emailDetail.category) {
            this.emailCategories[email.id] = emailDetail.category;
          }
          resolve();
        },
        error: () => {
          resolve(); // Continue even if one fails
        }
      });
    });
  }
}
