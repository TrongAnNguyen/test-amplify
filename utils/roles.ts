import type { AuthSession } from "aws-amplify/auth";

/**
 * Extracts the user's groups (roles) from the AWS Amplify AuthSession.
 * @param session - The AuthSession object returned from fetchAuthSession()
 * @returns An array of group names (e.g., ["admin", "executive"])
 */
export function getUserGroups(session: AuthSession | null | undefined): string[] {
  if (!session?.tokens?.accessToken?.payload) {
    return [];
  }
  
  const groups = session.tokens.accessToken.payload["cognito:groups"] as string[] | undefined;
  return groups || [];
}
