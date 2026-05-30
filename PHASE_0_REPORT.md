# Phase 0: Web Compatibility Report

**Date:** 2026-05-30
**Branch:** web-migration
**Status:** Web build compiles successfully ✓

---

## Summary

The Expo web build **compiles and runs** successfully on `http://localhost:8081`. The Metro bundler successfully bundled 799 modules with no critical errors.

However, several **native-only modules** are present that will cause runtime errors when accessed on web. These need to be stubbed or replaced with web alternatives.

---

## Native-Only Modules Found

### 1. **expo-notifications**
**Used in:**
- [services/notifications.ts](services/notifications.ts) (entire file)
- [App.tsx:16](App.tsx#L16) (imports registerForPushNotifications)
- [App.tsx:130](App.tsx#L130) (calls registerForPushNotifications in auth flow)

**Impact:** CRITICAL - App.tsx calls this during initial authentication, which will crash the app on web immediately after login.

**Solution for Phase 1:** Guard with `Platform.OS !== 'web'` check. Push notifications are Phase 4 (deferred).

---

### 2. **expo-location**
**Used in:**
- [app/screens/MapScreen.tsx:15](app/screens/MapScreen.tsx#L15)

**Impact:** HIGH - MapScreen is one of the 4 main tabs and will crash when accessed.

**Solution for Phase 1:**
- Temporarily stub MapScreen on web (render placeholder)
- Phase 2: Replace with browser `navigator.geolocation` API

---

### 3. **react-native-webview**
**Used in:**
- [app/screens/MapScreen.tsx:14](app/screens/MapScreen.tsx#L14)
- [app/screens/EventDetailsModal.tsx:15](app/screens/EventDetailsModal.tsx#L15)
- [app/screens/LocationPickerModal.tsx:15](app/screens/LocationPickerModal.tsx#L15)

**Impact:** MEDIUM - Used for rendering embedded maps/location pickers

**Solution for Phase 1:** Stub on web (will address in Phase 2 with proper web map)
**Solution for Phase 2:** Replace with native web map libraries (Mapbox GL JS or Google Maps JS)

---

### 4. **expo-secure-store**
**Used in:**
- [database/storage.ts:1](database/storage.ts#L1)

**Impact:** MEDIUM - Used for secure token storage

**Solution for Phase 1:** Replace with `localStorage` or `sessionStorage` for web (with Platform.OS check)

---

### 5. **@react-native-community/slider**
**Used in:**
- [app/screens/OnboardingScreen.tsx:14](app/screens/OnboardingScreen.tsx#L14)

**Impact:** LOW - This module has web support via react-native-web

**Solution:** Should work as-is, but verify during testing

---

### 6. **@react-native-community/datetimepicker**
**Listed in:** [package.json:13](package.json#L13)

**Impact:** LOW - May have web fallback, verify during testing

**Solution:** If it doesn't work, replace with HTML5 date/time inputs on web

---

### 7. **react-native-maps** (not imported but in package.json)
**Listed in:** [package.json:27](package.json#L27)

**Impact:** LOW for Phase 0 (MapScreen uses WebView instead)

**Solution for Phase 2:** Replace with Mapbox GL JS or Google Maps JS API for web

---

## Screen-by-Screen Analysis

### ✅ Likely to Work Out-of-the-Box (after notification stub)

These screens use standard React Native components that have web equivalents via react-native-web:

1. **LoginScreen** - Text inputs, buttons, ScrollView
2. **RegisterScreen** - Text inputs, buttons, ScrollView
3. **OnboardingScreen** - Slider (has web support), text inputs, buttons
4. **DiscoverScreen** - ScrollView, list rendering, pull-to-refresh
5. **FriendsScreen** - List rendering, messaging UI
6. **ProfileScreen** - Settings UI, switches, text inputs
7. **ChatDetailScreen** - Message list, text input
8. **MessagesScreen** - Message list UI

### ⚠️ Need Changes Before Working

1. **MapScreen** - Uses expo-location, WebView (for embedded maps)
   - **Phase 1 Fix:** Stub with placeholder or hide the tab
   - **Phase 2 Fix:** Replace with web map library + navigator.geolocation

2. **EventDetailsModal** - Uses WebView
   - **Phase 1 Fix:** Stub or disable map embed
   - **Phase 2 Fix:** Replace with web map embed

3. **LocationPickerModal** - Uses WebView
   - **Phase 1 Fix:** Stub or disable
   - **Phase 2 Fix:** Replace with web map picker

4. **App.tsx** - Calls registerForPushNotifications
   - **Phase 1 Fix:** Guard with Platform.OS check (skip on web)

---

## Recommended Phase 1 Actions

### Priority 1: Fix App Initialization (Required for app to load)

1. **Guard notification registration in App.tsx**
   ```typescript
   // In App.tsx useEffect
   if (Platform.OS !== 'web') {
     const token = await registerForPushNotifications();
     if (token) {
       await savePushToken(session.user.id, token);
     }
   }
   ```

2. **Create web-safe storage wrapper**
   ```typescript
   // database/storage.web.ts
   export const getItem = (key: string) => localStorage.getItem(key);
   export const setItem = (key: string, value: string) => localStorage.setItem(key, value);
   export const deleteItem = (key: string) => localStorage.removeItem(key);
   ```

### Priority 2: Stub MapScreen Temporarily

**Option A (Recommended):** Create MapScreen.web.tsx with placeholder
```typescript
// app/screens/MapScreen.web.tsx
export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text>Map coming soon on web!</Text>
      <Text>Use the Discover tab to browse events.</Text>
    </View>
  );
}
```

**Option B:** Hide the Map tab on web in App.tsx
```typescript
{Platform.OS !== 'web' && (
  <Tab.Screen name="Map" component={MapScreen} />
)}
```

### Priority 3: Verify Remaining Screens

Test each screen manually to ensure:
- Login/Register flow works
- Onboarding works
- Discover tab loads events
- Friends tab shows friend list and messaging
- Profile tab shows settings

---

## Phase 1 Checklist

- [ ] Add Platform.OS guard around notification registration in App.tsx
- [ ] Create storage.web.ts using localStorage
- [ ] Stub MapScreen on web (MapScreen.web.tsx or hide tab)
- [ ] Stub EventDetailsModal map embed on web
- [ ] Stub LocationPickerModal on web
- [ ] Test login flow end-to-end
- [ ] Test onboarding flow
- [ ] Test Discover tab (event list, RSVP)
- [ ] Test Friends tab (friend list, messaging)
- [ ] Test Profile tab (settings, visibility controls)
- [ ] Export web build: `npx expo export --platform web`
- [ ] Deploy to Vercel
- [ ] Test deployed URL on mobile browser and desktop browser

---

## Web Build Status

✅ **Metro Bundler:** Running successfully on http://localhost:8081
✅ **Bundle:** 799 modules compiled in ~5s
⚠️ **Package Versions:** Some version warnings (non-critical for Phase 0)
❌ **Runtime:** Will crash when notification code is executed (on auth)

---

## Next Steps

1. Implement Phase 1 fixes (notifications, storage, map stubbing)
2. Test thoroughly in browser
3. Export and deploy to Vercel
4. Share URL with test users by May 18 deadline
5. Move to Phase 2 (restore map with web library)
6. Move to Phase 3 (in-app real-time notifications)
7. Consider Phase 4 (web push as PWA) - stretch goal only

---

**Report completed:** 2026-05-30
**Web server:** Running at http://localhost:8081 (background process)