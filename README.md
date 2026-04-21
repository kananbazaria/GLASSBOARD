# GlassBoard

Initial mobile scaffold for the GlassBoard cross-department dependency tracker.

## App Location

The runnable Expo React Native app lives in `./glassboard-app` inside this repository.

## Current Scope

- Mobile dashboard shell inspired by the project brief
- Sign-in screen with role-aware demo access
- Domain models for modules, handoffs, checklists, and audit history
- Mock operational data for UI development
- Firebase initialization, auth helpers, and Firestore collection schema

## Run It

```bash
cd glassboard-app
npm install
npm start
```

## Firebase Env Vars

Create a `.env` file in `glassboard-app/` when you are ready to connect the backend:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

With those values present, the `Use Firebase Sign-In` action can call the real Firebase auth client. Without them, the app still works in demo mode so UI and flows can keep moving.

The repository ignores `glassboard-app/.env`, `node_modules`, and other generated Expo files so local setup stays out of git.

## Firestore Collections

- `users`
- `modules`
- `handoffs`
- `tasks`
- `auditEvents`

## Suggested Next Build Steps

1. Authentication and role-based access control
2. Firestore collections for modules, tasks, handoffs, and audit logs
3. Handoff accept/reject flows with proof uploads
4. Notifications and real-time updates
