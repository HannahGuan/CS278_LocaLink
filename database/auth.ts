import { supabase } from './supabase';

export interface AuthError {
  message: string;
}

export interface AuthResponse {
  success: boolean;
  error?: AuthError;
  userId?: string;
}

/**
 * Validates if an email is a Stanford email address
 */
export const isStanfordEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@stanford.edu');
};

/**
 * Sign up a new user with email and password
 * Only allows @stanford.edu email addresses
 */
export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  try {
    // Validate Stanford email
    if (!isStanfordEmail(email)) {
      return {
        success: false,
        error: { message: 'Please use a valid @stanford.edu email address' },
      };
    }

    // Validate password strength
    if (password.length < 6) {
      return {
        success: false,
        error: { message: 'Password must be at least 6 characters long' },
      };
    }

    console.log('[SignUp] Starting signup process for:', email);

    // Create user in Supabase Auth with timeout
    // The database trigger will automatically create the profile
    const signUpPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    // Add 30 second timeout to prevent infinite loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Signup request timed out. Please check your internet connection and try again.')), 30000);
    });

    const { data, error } = await Promise.race([signUpPromise, timeoutPromise]);

    if (error) {
      console.error('[SignUp] Error:', error.message);
      // Provide more user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please try signing in instead.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      return {
        success: false,
        error: { message: errorMessage },
      };
    }

    if (!data.user) {
      console.error('[SignUp] No user data returned');
      return {
        success: false,
        error: { message: 'Failed to create user account. Please try again.' },
      };
    }

    console.log('[SignUp] Success! User ID:', data.user.id);

    // Note: Profile is automatically created by database trigger (handle_new_user function)
    // No need to manually insert into profiles table

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error: any) {
    console.error('[SignUp] Unexpected error:', error);
    return {
      success: false,
      error: { message: error.message || 'An unexpected error occurred. Please try again.' },
    };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: { message: 'Failed to sign in' },
      };
    }

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: { message: error.message || 'An unexpected error occurred' },
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<AuthResponse> => {
  try {
    console.log('[Auth] Initiating sign out...');

    // First, remove all Realtime channels to prevent callback errors
    try {
      console.log('[Auth] Removing all Realtime channels...');
      await supabase.removeAllChannels();
      console.log('[Auth] All channels removed');
    } catch (channelError) {
      console.warn('[Auth] Error removing channels (non-critical):', channelError);
      // Don't fail sign out if channel cleanup fails
    }

    // Now sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Sign out error:', error);
      return {
        success: false,
        error: { message: error.message },
      };
    }

    console.log('[Auth] Sign out successful');
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[Auth] Sign out exception:', error);
    return {
      success: false,
      error: { message: error.message || 'An unexpected error occurred' },
    };
  }
};

/**
 * Get the current authenticated user
 * Returns null silently if no user is logged in (don't log errors)
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // If JWT is invalid or user doesn't exist, clear the session
      if (error.message.includes('JWT') || error.message.includes('does not exist')) {
        console.log('Clearing invalid session...');
        await supabase.auth.signOut();
        return null;
      }

      // Don't log "Auth session missing" errors - this is expected when user is not logged in
      if (error.message !== 'Auth session missing!') {
        console.error('Error getting user:', error);
      }
      return null;
    }

    return user;
  } catch (error: any) {
    // If JWT is invalid or user doesn't exist, clear the session
    if (error?.message?.includes('JWT') || error?.message?.includes('does not exist')) {
      console.log('Clearing invalid session...');
      await supabase.auth.signOut();
      return null;
    }

    // Don't log "Auth session missing" errors - this is expected when user is not logged in
    if (error?.message !== 'Auth session missing!') {
      console.error('Error getting user:', error);
    }
    return null;
  }
};

/**
 * Reset password for a user
 */
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: { message: error.message || 'An unexpected error occurred' },
    };
  }
};
