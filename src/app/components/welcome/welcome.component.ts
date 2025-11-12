import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-container">
      <div class="card shadow-lg">
        <div class="card-body text-center p-5">
          <h1 class="display-4 mb-4">Email Action Bot</h1>
          <p class="lead mb-4">AI-powered email management with smart replies</p>
          <button
            class="btn btn-primary btn-lg"
            (click)="login()">
            <i class="bi bi-google me-2"></i>
            Login with Google
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .card {
      max-width: 500px;
      width: 100%;
      border: none;
      border-radius: 15px;
    }

    .card-body {
      background: white;
      border-radius: 15px;
    }

    h1 {
      color: #333;
      font-weight: 700;
    }

    .lead {
      color: #666;
    }

    .btn-primary {
      padding: 12px 40px;
      font-size: 1.1rem;
      border-radius: 50px;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
  `]
})
export class WelcomeComponent {
  constructor(private authService: AuthService) {}

  login(): void {
    this.authService.loginWithGoogle().subscribe();
  }
}
