# ChatKit Starter Template with Firebase Authentication

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![NextJS](https://img.shields.io/badge/Built_with-NextJS-blue)
![OpenAI API](https://img.shields.io/badge/Powered_by-OpenAI_API-orange)
![Firebase](https://img.shields.io/badge/Auth-Firebase-yellow)
![Secure](https://img.shields.io/badge/Security-Protected-red)

This repository is a **secure, production-ready** [ChatKit](http://openai.github.io/chatkit-js/) application with Firebase authentication. It ships with a Next.js UI, the ChatKit web component, Firebase-based security code authentication, and session management to protect your OpenAI API usage.

## 🔐 Security Features

- ✅ **Firebase Authentication** - Security code-based access control
- ✅ **Per-User Access Codes** - Unique security codes for each authorized user
- ✅ **Server-Side Verification** - All authentication happens on the server
- ✅ **Session Management** - Secure JWT-based sessions with HTTP-only cookies
- ✅ **Rate Limiting** - Protection against brute-force attacks
- ✅ **Firestore Integration** - Secure storage and management of access codes

## What You Get

- Next.js app with `<openai-chatkit>` web component and theming controls
- 🔒 **Authentication page** with beautiful UI for security code entry
- 🔥 **Firebase Firestore integration** for managing user access codes
- 🛡️ **API authentication middleware** protecting all routes
- 🍪 **Session management** with secure cookies
- 🚪 **Logout functionality** with easy user management
- API endpoint for creating a session at [`app/api/create-session/route.ts`](app/api/create-session/route.ts)
- Config file for starter prompts, theme, placeholder text, and greeting message

## 🚀 Quick Start

For a **complete step-by-step guide** including Firebase setup, Vercel deployment, and security configuration, see:

### 📚 **[Complete Deployment Guide](DEPLOYMENT_GUIDE.md)**

The deployment guide covers:
- Firebase project setup and Firestore configuration
- Security rules and service account setup
- Environment variable configuration
- Vercel deployment
- Adding and managing security codes
- Testing and troubleshooting

### Quick Setup (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Configure security rules (see [Deployment Guide](DEPLOYMENT_GUIDE.md#step-3-configure-firestore-security-rules))
4. Generate a service account key
5. Create a `security_codes` collection with your first security code

### 3. Create your environment file

Create a `.env.local` file with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-YOUR_API_KEY
NEXT_PUBLIC_CHATKIT_WORKFLOW_ID=wf_YOUR_WORKFLOW_ID

# Firebase Configuration (single-line JSON)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secret-random-string

# Environment
NODE_ENV=development
```

📖 See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for detailed documentation on all environment variables.

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000` - you'll see the authentication page. Enter your security code from Firestore to access the chat.

### 5. Deploy to Vercel

```bash
npm run build
vercel deploy --prod
```

⚠️ **Important:** Configure all environment variables in Vercel before deploying. See the [Deployment Guide](DEPLOYMENT_GUIDE.md#vercel-deployment) for details.

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── create-session/    # ChatKit session creation
│   │   ├── verify-code/       # Security code verification
│   │   ├── check-auth/        # Authentication status check
│   │   └── logout/            # Logout endpoint
│   ├── App.tsx                # Main chat interface
│   └── page.tsx               # Entry point with auth wrapper
├── components/
│   ├── AuthPage.tsx           # Authentication UI
│   ├── ProtectedApp.tsx       # Auth wrapper component
│   ├── ChatKitPanel.tsx       # ChatKit integration
│   ├── LogoutButton.tsx       # Logout functionality
│   └── ErrorOverlay.tsx       # Error handling UI
├── lib/
│   ├── firebase-admin.ts      # Firebase Admin SDK setup
│   ├── auth.ts                # Session management utilities
│   └── config.ts              # ChatKit configuration
├── middleware.ts              # Route protection middleware
├── DEPLOYMENT_GUIDE.md        # Complete deployment instructions
└── ENVIRONMENT_VARIABLES.md   # Environment variable documentation
```

## 🔒 Security Architecture

### Authentication Flow

1. **User visits the site** → Authentication page is shown
2. **User enters security code** → Server verifies against Firestore
3. **Valid code** → Session token created and stored in HTTP-only cookie
4. **User accesses chat** → Middleware verifies session on every request
5. **User logs out** → Session token invalidated

### Security Measures

- **Server-side only verification** - Client cannot bypass authentication
- **HTTP-only cookies** - Protected from XSS attacks
- **Rate limiting** - 5 attempts per 15 minutes per IP
- **Firestore security rules** - Deny all client-side access
- **JWT session tokens** - Cryptographically signed and tamper-proof
- **No client-side secrets** - All sensitive operations happen server-side

## 🛠️ Customization Tips

- Adjust starter prompts, greeting text, [chatkit theme](https://chatkit.studio/playground), and placeholder copy in [`lib/config.ts`](lib/config.ts)
- Update the event handlers inside [`components/ChatKitPanel.tsx`](components/ChatKitPanel.tsx) to integrate with your product analytics or storage
- Customize the authentication page UI in [`components/AuthPage.tsx`](components/AuthPage.tsx)
- Modify rate limiting settings in [`app/api/verify-code/route.ts`](app/api/verify-code/route.ts)
- Adjust session duration in [`lib/auth.ts`](lib/auth.ts)

## 📖 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete setup and deployment instructions
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)** - Detailed environment variable documentation
- [ChatKit JavaScript Library](http://openai.github.io/chatkit-js/)
- [Advanced Self-Hosting Examples](https://github.com/openai/openai-chatkit-advanced-samples)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Managing Users

### Adding a New User

1. Go to Firebase Console → Firestore Database
2. Open the `security_codes` collection
3. Click "Add document"
4. Add fields:
   - `code`: The security code (e.g., `"ABC123XYZ"`)
   - `active`: `true`
   - `userName`: User's name (e.g., `"John Doe"`)
   - `createdAt`: Set to current time
   - `usageCount`: `0`
5. Share the code securely with the user

### Revoking Access

1. Find the user's document in Firestore
2. Set `active` to `false`
3. The code will be immediately invalidated

### Monitoring Usage

Check these fields in Firestore:
- `usageCount` - How many times the code has been used
- `lastUsedAt` - When the code was last used
- Set `expiresAt` for temporary access

## 🐛 Troubleshooting

Common issues and solutions:

- **"Failed to initialize Firebase Admin SDK"** - Check your `FIREBASE_SERVICE_ACCOUNT` is properly formatted as single-line JSON
- **"Invalid security code"** - Verify the code exists in Firestore with `active: true`
- **Session expires immediately** - Ensure `SESSION_SECRET` is set in environment variables
- **Rate limited** - Wait 15 minutes or adjust rate limit settings

For more troubleshooting help, see the [Deployment Guide](DEPLOYMENT_GUIDE.md#troubleshooting).

## 📊 Monitoring Costs

Since you're protecting your app to control OpenAI costs:

1. **Set up billing alerts** in [OpenAI Platform](https://platform.openai.com/usage)
2. **Monitor usage** in Firestore (check `usageCount` per user)
3. **Review logs** in Vercel for unusual activity
4. **Set spending limits** in your OpenAI account

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the [OpenAI ChatKit Starter App](https://github.com/openai/openai-chatkit-starter-app)
- Secured with Firebase Authentication
- Deployed on Vercel
