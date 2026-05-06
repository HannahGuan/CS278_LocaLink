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

    // Create user in Supabase Auth
    // The database trigger will automatically create the profile
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
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
        error: { message: 'Failed to create user account' },
      };
    }

    // Note: Profile is automatically created by database trigger (handle_new_user function)
    // No need to manually insert into profiles table

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
    const { error } = await supabase.auth.signOut();

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
