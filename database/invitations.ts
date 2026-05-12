import { supabase } from './supabase';

export interface SendInvitationResult {
  success: boolean;
  error?: string;
}

/**
 * Send an invitation email to an unregistered user
 * This uses Supabase Edge Functions to send emails automatically
 */
export const sendInvitationEmail = async (
  senderName: string,
  recipientEmail: string
): Promise<SendInvitationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: {
        senderName,
        recipientEmail,
      },
    });

    if (error) {
      console.error('Error sending invitation:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Unexpected error sending invitation:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invitation',
    };
  }
};

/**
 * Open the device's email client with a pre-filled invitation message
 * This is a fallback method that doesn't require backend setup
 */
export const composeInvitationEmail = (
  senderName: string,
  recipientEmail: string
): {
  to: string;
  subject: string;
  body: string;
} => {
  const subject = `${senderName} invited you to join LocaLink!`;

  const body = `Hi there!

${senderName} wants to connect with you on LocaLink, Stanford's social location app.

LocaLink helps you:
🗺️ See where your friends are on campus
👥 Meet people nearby with similar interests
📅 Discover events happening around you
💬 Connect with the Stanford community

Download and sign up now to accept ${senderName}'s friend request!

[Your app download link will go here]

See you on campus!
- The LocaLink Team`;

  return {
    to: recipientEmail,
    subject,
    body,
  };
};
