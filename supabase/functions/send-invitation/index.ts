// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  senderName: string;
  recipientEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { senderName, recipientEmail }: InvitationRequest = await req.json()

    // Validate input
    if (!senderName || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing senderName or recipientEmail' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate Stanford email
    if (!recipientEmail.toLowerCase().endsWith('@stanford.edu')) {
      return new Response(
        JSON.stringify({ error: 'Must be a Stanford email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare email content
    const emailSubject = `${senderName} invited you to join LocaLink!`
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join LocaLink</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8C1515 0%, #2e0606 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎓 LocaLink</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Stanford Community Connect</p>
  </div>

  <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">You've Been Invited!</h2>

    <p style="font-size: 16px; margin: 20px 0;">
      <strong>${senderName}</strong> wants to connect with you on <strong>LocaLink</strong>, Stanford's social location app.
    </p>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #8C1515;">LocaLink helps you:</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">🗺️ See where your friends are on campus</li>
        <li style="margin-bottom: 10px;">👥 Meet people nearby with similar interests</li>
        <li style="margin-bottom: 10px;">📅 Discover events happening around you</li>
        <li style="margin-bottom: 10px;">💬 Connect with the Stanford community</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="[YOUR_APP_DOWNLOAD_LINK]" style="display: inline-block; background: #8C1515; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Download LocaLink
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      After downloading, sign up with your Stanford email to accept <strong>${senderName}'s</strong> friend request!
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 13px; color: #999; text-align: center; margin: 0;">
      See you on campus! 🌲<br>
      - The LocaLink Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>This invitation was sent by ${senderName} through LocaLink.</p>
  </div>
</body>
</html>
    `

    const emailText = `
Hi there!

${senderName} wants to connect with you on LocaLink, Stanford's social location app.

LocaLink helps you:
🗺️ See where your friends are on campus
👥 Meet people nearby with similar interests
📅 Discover events happening around you
💬 Connect with the Stanford community

Download and sign up now to accept ${senderName}'s friend request!

[YOUR_APP_DOWNLOAD_LINK]

See you on campus!
- The LocaLink Team
    `

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LocaLink <noreply@yourdomain.com>', // Replace with your verified domain
        to: [recipientEmail],
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: resendData
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Email sent successfully:', resendData)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-invitation function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
