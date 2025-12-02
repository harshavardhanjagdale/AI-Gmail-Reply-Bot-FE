# Gmail Reply Bot - Frontend (Angular)

## Overview
This is the frontend Angular application for the Gmail Reply Bot. It provides a modern, Gmail-style UI for managing and replying to emails using AI.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see `../email-reply bot/README.md`)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend URL

The frontend is configured to connect to `http://localhost:3000` by default. If your backend runs on a different URL, update:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

```typescript
export const environment = {
  production: false,
  backendUrl: 'http://localhost:3000' // Change this if needed
};
```

### 3. Start Development Server
```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200`

### 4. Build for Production
```bash
npm run build
# or
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Features

- 🎨 Modern Gmail-style UI with glassmorphism effects
- 📧 Email list with AI-powered classification
- 🤖 AI-generated email replies
- 🔐 Google OAuth2 authentication
- 📱 Responsive design
- ✨ Smooth animations and transitions

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── welcome/          # Welcome/login screen
│   │   ├── inbox/            # Email inbox list
│   │   └── email-detail/     # Email detail and reply
│   └── services/
│       ├── auth.service.ts   # Authentication service
│       └── gmail.service.ts  # Gmail API service
├── assets/                    # Static assets (logos, images)
└── environments/              # Environment configuration
```

## Development

### Running the Application
1. Make sure the backend server is running (see backend README)
2. Start the Angular dev server: `npm start`
3. Open `http://localhost:4200` in your browser

### Technologies Used
- Angular 20
- Bootstrap 5
- Bootstrap Icons
- RxJS
- TypeScript

## Troubleshooting

### Backend Connection Issues
- Ensure the backend is running on `http://localhost:3000`
- Check CORS settings in the backend
- Verify `environment.ts` has the correct backend URL

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Angular cache: `rm -rf .angular`

## License
Private project

