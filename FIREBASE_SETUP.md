# Firebase Setup Plan

This matches the current GlassBoard mobile scaffold in `/Users/kananbazaria/Desktop/GLASS BOARD/glassboard-app`.

## 1. Create Firebase Project

1. Open the Firebase console.
2. Click `Create a project`.
3. Name it `GlassBoard`.
4. Enable Google Analytics only if your class or project requires it.

## 2. Enable Authentication

1. Open `Build` → `Authentication`.
2. Click `Get started`.
3. Enable the `Email/Password` provider.

## 3. Create Firestore Database

1. Open `Build` → `Firestore Database`.
2. Click `Create database`.
3. Start in `test mode` for initial development.
4. Pick the region closest to your expected users.

## 4. Add Collections

Create these collections:

- `users`
- `modules`
- `tasks`

The app also already has placeholders for future collections:

- `handoffs`
- `auditEvents`

## 5. Suggested Manual Test Data

### `users`

Document ID: `demo-module-head`

```json
{
  "name": "Module Head Demo",
  "email": "head@glassboard.app",
  "role": "module_head",
  "moduleIds": ["mod-compliance"]
}
```

### `modules`

Document ID: `mod-compliance`

```json
{
  "id": "mod-compliance",
  "name": "Compliance Review",
  "owner": "Arjun Rao",
  "progress": 61,
  "state": "at-risk",
  "openTasks": 7,
  "blockers": 1,
  "nextDependency": "Engineering Delivery"
}
```

### `tasks`

Document ID: `task-02`

```json
{
  "id": "task-02",
  "title": "Attach audit screenshot to security review",
  "moduleId": "mod-compliance",
  "complete": false,
  "priority": "high"
}
```

## 6. Add Firebase App Config To Expo

Put these values into `glassboard-app/.env`:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## 7. Manual Console Test

After creating the collections, manually add at least:

1. one user
2. one module
3. one task

That is enough to confirm Firestore accepts data and matches the app schema.
