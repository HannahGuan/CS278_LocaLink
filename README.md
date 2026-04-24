# LocaLink

A React Native location-sharing application built with Expo that allows users to share their real-time locations with friends on an interactive map.

## Features

- **Interactive Map**: View your location and your friends' locations on a map
- **Friends Management**: Add and manage friend connections
- **User Profiles**: View and edit user profile information
- **Real-time Location**: Share location updates with accepted friends
- **Supabase Backend**: Secure authentication and data storage

## Tech Stack

- **Frontend**: React Native + Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Maps**: React Native Maps
- **Language**: TypeScript

## Project Structure

```
LocaLink/
├── app/                    # Screen components
│   ├── MapScreen.tsx       # Main map view showing user and friends' locations
│   ├── FriendsScreen.tsx   # Friends list and management
│   └── ProfileScreen.tsx   # User profile display and settings
├── components/             # Reusable UI components
├── database/               # Supabase client and data access helpers
│   ├── supabase.ts         # Supabase client configuration
│   ├── users.ts            # User-related database operations
│   └── friends.ts          # Friends-related database operations
├── store/                  # Zustand state management
│   ├── userStore.ts        # User state (current user, location)
│   └── friendsStore.ts     # Friends state
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared types (User, Location, Friend, etc.)
├── data/                   # Mock data for development/testing
│   └── mockData.ts         # Sample users, friends, and locations
├── supabase_sql/           # Database schema and setup
│   ├── schema.sql          # Database tables and indexes
│   ├── rls_policies.sql    # Row Level Security policies
│   └── setup_notes.md      # Database setup instructions
├── App.tsx                 # Main application entry with navigation
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (iOS/Android)
- Supabase account

### Installation

1. **Clone the repository** (if using git):
   ```bash
   git clone <repository-url>
   cd LocaLink
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL scripts in `supabase_sql/` directory (see `supabase_sql/setup_notes.md`)
   - Copy your Supabase URL and anon key

4. **Configure Supabase credentials**:
   - Open `database/supabase.ts`
   - Replace the placeholder values:
     ```typescript
     const SUPABASE_URL = 'https://your-project.supabase.co';
     const SUPABASE_ANON_KEY = 'your-anon-key';
     ```

### Running the App

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Run on your device**:
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)
   - The app will load on your device

3. **Alternative: Run on simulator**:
   ```bash
   npm run ios      # iOS simulator (Mac only)
   npm run android  # Android emulator
   ```

## Usage

### Map Screen (Main Page)
- Shows an interactive map centered on your location
- Displays your current location with a blue marker
- Shows friends' locations with red markers
- Tap on markers to see user details

### Friends Screen
- View your list of accepted friends
- See each friend's name, email, and last known location
- (Future) Send friend requests and manage pending requests

### Profile Screen
- View your profile information
- See account details (User ID, member since date)
- (Future) Edit profile, update settings, and logout

## Current State

The app currently uses **mock data** for demonstration purposes:
- Sample users are defined in `data/mockData.ts`
- No authentication is required yet
- Location data is static

### Next Steps for Production

1. **Implement Authentication**:
   - Add login/signup screens
   - Integrate Supabase Auth
   - Handle session management

2. **Real-time Location Tracking**:
   - Request location permissions
   - Use Expo Location API
   - Update location in Supabase
   - Subscribe to friends' location updates

3. **Friend Management**:
   - Implement friend request sending
   - Handle friend request acceptance/rejection
   - Add friend search functionality

4. **UI Enhancements**:
   - Add icons to tab navigation
   - Improve map markers with custom icons
   - Add loading states and error handling
   - Implement pull-to-refresh

5. **Real-time Updates**:
   - Set up Supabase real-time subscriptions
   - Live location updates on the map
   - Friend request notifications

## Database Schema

See `supabase_sql/schema.sql` for the complete database schema.

### Key Tables:
- **profiles**: User profile information
- **friends**: Friend relationships (pending/accepted/rejected)
- **user_locations**: Real-time location tracking

### Security:
Row Level Security (RLS) policies ensure:
- Users can only modify their own data
- Friend locations are only visible to accepted friends
- Profile information is protected

## Development

### Adding New Screens
1. Create a new file in `app/` directory
2. Add the screen to navigation in `App.tsx`

### Adding New State
1. Create a new store in `store/` directory using Zustand
2. Import and use in components

### Working with Supabase
- Database helpers are in `database/` directory
- Use the helper functions for type-safe database access
- Add new queries as needed for your features

## Troubleshooting

### Maps not showing
- Ensure you have a valid Google Maps API key (for Android)
- For iOS, maps should work out of the box

### Supabase connection issues
- Check your Supabase URL and anon key
- Verify your database tables are created
- Check RLS policies are applied

### Navigation errors
- Make sure all screen components are exported as default
- Verify navigation dependencies are installed

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license here]

## Contact

[Add your contact information]