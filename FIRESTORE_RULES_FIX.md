# Firestore Security Rules Fix

## Problem
You're getting "Missing or insufficient permissions" errors because your Firestore security rules are blocking read/write access.

## Solution

Go to your Firebase Console and update your Firestore security rules:

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **acadia-event-manager-5d042**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace your current rules with the rules below
6. Click **Publish**

### Security Rules to Use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read their own data, anyone can read other users' names
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events collection - authenticated users can read all events, only creators can write
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid || 
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['registrations', 'comments']));
      allow delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

### What These Rules Do:

1. **Users Collection:**
   - ✅ Authenticated users can read any user document (needed to show creator names)
   - ✅ Users can only write/update their own user document

2. **Events Collection:**
   - ✅ Authenticated users can read all events
   - ✅ Authenticated users can create events
   - ✅ Users can update events if they're the creator OR if they're only updating registrations/comments
   - ✅ Only event creators can delete events

### Quick Test Rules (Development Only - Less Secure):

If you want to test quickly, you can use these temporary rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning:** The test rules above allow any authenticated user to read/write everything. Only use for testing, then switch to the proper rules above.

## After Updating Rules:

1. Save and publish the rules
2. Wait 1-2 minutes for rules to propagate
3. Refresh your browser
4. Check the console - you should see "✅ Events loaded successfully: X"

## Still Having Issues?

If you still see permission errors after updating rules:
1. Make sure you're logged in (check that `user` is not null in console)
2. Verify the rules were published (check the Rules tab shows your new rules)
3. Check browser console for any other errors
4. Try logging out and logging back in

