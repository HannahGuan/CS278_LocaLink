import { Profile } from '../types';
import { isStanfordEmail } from './auth';
import { DatabaseClient, databaseClient } from './databaseClient';

/**
 * Outcomes of attempting to add a friend by email. The UI can switch on `kind`
 * exhaustively to render the right message.
 */
export type AddFriendOutcome =
  | { kind: 'sent'; recipient: Profile }
  | { kind: 'invalid_email' }
  | { kind: 'self_request' }
  | { kind: 'user_not_found'; email: string }
  | { kind: 'already_friends'; recipient: Profile }
  | {
      kind: 'request_pending';
      recipient: Profile;
      direction: 'outgoing' | 'incoming';
    };

/**
 * Look up a user by email and, if they exist, send them a pending friend
 * request. Returns a discriminated outcome instead of throwing for expected
 * states (not found, duplicate, etc.); only true infrastructure failures
 * propagate as exceptions.
 */
export const addFriendByEmail = async (
  requesterId: string,
  rawEmail: string,
  client: DatabaseClient = databaseClient
): Promise<AddFriendOutcome> => {
  const email = rawEmail.trim().toLowerCase();
  if (email.length === 0 || !isStanfordEmail(email)) {
    return { kind: 'invalid_email' };
  }

  const recipient = await client.findUserByEmail(email);
  if (recipient === null) {
    return { kind: 'user_not_found', email };
  }
  if (recipient.id === requesterId) {
    return { kind: 'self_request' };
  }

  const existing = await client.findFriendship(requesterId, recipient.id);
  if (existing !== null) {
    if (existing.status === 'accepted') {
      return { kind: 'already_friends', recipient };
    }
    if (existing.status === 'pending') {
      return {
        kind: 'request_pending',
        recipient,
        direction: existing.user_id === requesterId ? 'outgoing' : 'incoming',
      };
    }
    // status === 'rejected' — fall through and let the user re-request.
  }

  await client.createFriendRequest(requesterId, recipient.id);
  return { kind: 'sent', recipient };
};
