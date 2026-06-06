# Local Link

A cross-platform social networking application for Stanford students to connect, discover campus events, and share locations in real-time. Built with React Native + Expo, deployable on iOS, Android, and Web.

## Features

- **Stanford-Only Authentication**: Secure email-based authentication restricted to @stanford.edu addresses
- **Interactive Campus Map**: View your location and nearby friends on an interactive map with real-time updates
- **Friend Management**: Send and receive friend requests, build your campus network
- **Real-time Messaging**: Chat with friends using WebSocket-powered real-time messaging
- **Event Discovery**: Browse Stanford events from RSS feeds and user-created events
- **Event Creation & RSVPs**: Create your own events and RSVP to events you're interested in
- **User Profiles**: Customizable profiles with bio, interests, and privacy settings
- **Privacy Controls**: Choose who can see your location (friends only or broader visibility)
- **Push Notifications**: Get notified about friend requests and new messages
- **Analytics Tracking**: Behavioral analytics to understand app usage patterns
- **Cross-Platform**: Runs natively on iOS and Android, plus web browser support

## Tech Stack

- **Frontend**: React Native + Expo (SDK 52)
- **Navigation**: React Navigation 6 (Bottom Tabs + Stack Navigator)
- **State Management**: React Context API + Custom Hooks
- **Backend**: Supabase (PostgreSQL + Authentication + Realtime + Storage)
- **Maps**: React Native Maps (with Google Maps on Android, Apple Maps on iOS)
- **Messaging**: Supabase Realtime (WebSocket-based)
- **Language**: TypeScript
- **Deployment**: Expo Go for mobile, Vercel-ready for web

## Project Structure

```
CS278_LocaLink/
├── app/
│   ├── screens/               # Main application screens
│   │   ├── LoginScreen.tsx    # Authentication login
│   │   ├── RegisterScreen.tsx # New user registration
│   │   ├── MapScreen.tsx      # Interactive map with location sharing
│   │   ├── EventsScreen.tsx   # Event discovery and browsing
│   │   ├── FriendsScreen.tsx  # Friend management and requests
│   │   ├── MessagesScreen.tsx # Chat conversations list
│   │   ├── ChatScreen.tsx     # Individual chat interface
│   │   └── ProfileScreen.tsx  # User profile and settings
│   ├── contexts/              # React Context providers
│   │   └── UnreadContext.tsx  # Badge notifications for messages/requests
│   └── navigation/            # Navigation configuration
├── components/                # Reusable UI components
│   ├── FriendItem.tsx         # Friend list item
│   ├── MessageItem.tsx        # Message bubble
│   └── EventCard.tsx          # Event display card
├── database/                  # Supabase client and data access layer
│   ├── supabase.ts            # Supabase client configuration
│   ├── auth.ts                # Authentication operations
│   ├── client.ts              # Database queries (friends, profiles, events)
│   ├── messages.ts            # Real-time messaging operations
│   ├── events.ts              # Event and RSVP operations
│   └── storage.ts             # AsyncStorage wrapper
├── services/                  # Business logic services
│   ├── analytics.ts           # Behavioral analytics tracking
│   └── rss.ts                 # RSS feed parsing for Stanford events
├── types/                     # TypeScript type definitions
│   └── index.ts               # Shared types
├── supabase_sql/              # Database schema and queries
│   ├── schema.sql             # Complete database schema
│   ├── rls_policies.sql       # Row Level Security policies
│   ├── analytics_events.sql   # Analytics table setup
│   └── usage_statistics.sql   # SQL queries for metrics
├── App.tsx                    # Application entry point
└── package.json               # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (for mobile testing)
- Supabase account (free tier works)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CS278_LocaLink
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run SQL scripts in order:
     1. `supabase_sql/schema.sql`
     2. `supabase_sql/rls_policies.sql`
     3. `supabase_sql/analytics_events.sql`
   - Configure email authentication:
     - Go to Authentication > Providers
     - Enable Email provider
     - (Optional) Disable email confirmation for testing
   - Copy your project URL and anon key

4. **Configure environment**:
   - Open `database/supabase.ts`
   - Replace with your credentials:
     ```typescript
     const SUPABASE_URL = 'https://your-project.supabase.co';
     const SUPABASE_ANON_KEY = 'your-anon-key';
     ```

### Running the App

**Mobile (iOS/Android)**:
```bash
npm start
# Scan QR code with Expo Go app
```

**Web Browser**:
```bash
npm run web
# Opens in browser at http://localhost:19006
```

**iOS Simulator** (Mac only):
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

## Usage Guide

### Authentication
- **Sign Up**: Use your @stanford.edu email address
- **Email Verification**: Check your inbox for verification link (if enabled)
- **Sign In**: Use your Stanford email and password

### Map Screen
- View your real-time location with a blue marker
- See friends' locations with custom markers
- Filter view: All users, Friends only, or Events only
- Tap markers to view user/event details
- Location updates automatically every 10 seconds

### Events Screen
- Browse Stanford events from official RSS feeds
- View user-created events
- Create new events with title, description, location, and time
- RSVP to events you want to attend
- See who else is attending

### Friends Screen
- View your accepted friends list
- Send friend requests by Stanford email
- Accept or decline incoming friend requests
- See pending outgoing requests
- Badge notifications for new requests

### Messages Screen
- View all your conversations
- Real-time message delivery
- Unread message badges
- Search for friends to start new chats
- Messages persist across sessions

### Profile Screen
- Edit your bio and interests
- Update profile information
- Manage privacy settings:
  - Share location with friends only
  - Share location with event attendees
- View account details
- Sign out

## Database Schema

### Core Tables
- **profiles**: User profile data (name, bio, interests, privacy settings)
- **friends**: Friend relationships with status (pending/accepted/rejected)
- **user_locations**: Real-time location tracking with timestamps
- **user_events**: User-created events with details
- **event_rsvps**: Event attendance tracking
- **messages**: Direct messages between users
- **analytics_events**: Behavioral tracking (JSONB properties)

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only read/write their own data
- Friend locations visible only to accepted friends
- Messages visible only to sender and recipient
- Admins can query analytics in aggregate

## Analytics

The app tracks user behavior for engagement metrics:
- Map views and filter changes
- Event RSVPs and creations
- Friend requests sent/accepted
- Chat sessions opened
- Profile updates and privacy changes

Query usage statistics:
```bash
# Run queries from supabase_sql/usage_statistics.sql
# in Supabase SQL Editor
```

## Deployment

### Web Deployment (Vercel)
The app is ready for web deployment:
```bash
# Build for web
npx expo export --platform web

# Deploy to Vercel
# (Upload dist/ folder or connect GitHub repo)
```

### Mobile Deployment (EAS Build)
For production mobile apps:
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS/Android
eas build --platform ios
eas build --platform android
```

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Functional components with hooks
- Context API for global state

### Adding New Features
1. Create screen component in `app/screens/`
2. Add database functions in `database/`
3. Update navigation in `App.tsx`
4. Add analytics tracking in relevant actions
5. Update RLS policies if needed

### Testing
- Test on both iOS and Android
- Test web platform compatibility (Alert.alert → window.alert)
- Test real-time features with multiple users
- Verify RLS policies work correctly

## Troubleshooting

**Maps not loading**:
- Android: Add Google Maps API key to `app.json`
- iOS: Maps work out of the box
- Web: Uses static map (react-native-maps not fully web compatible)

**Supabase connection errors**:
- Verify URL and anon key in `database/supabase.ts`
- Check database tables are created
- Verify RLS policies are applied
- Check Supabase project is not paused

**Authentication issues**:
- Ensure email provider is enabled in Supabase
- Check @stanford.edu domain restriction
- Clear localStorage if getting stale tokens
- Verify network connectivity

**Real-time messages not working**:
- Check Supabase Realtime is enabled
- Verify WebSocket connection in browser console
- Ensure unique channel names (timestamp-based)

## Future Enhancements

- Push notifications for iOS/Android using Expo Notifications
- Photo sharing in messages
- Group chat support
- Event photo uploads
- Calendar integration
- Dark mode theme
- Offline support with local storage
- Performance optimizations for large friend lists

## License

Stanford CS278 Course Project

## Authors

CS278 Project Team - Stanford University

## Acknowledgments

- Stanford Events RSS feeds
- Supabase for backend infrastructure
- Expo team for cross-platform framework
- React Native Maps community
