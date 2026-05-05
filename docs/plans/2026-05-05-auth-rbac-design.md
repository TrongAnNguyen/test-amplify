# Design: Authentication and RBAC with Amplify Gen 2

## Goal
Implement a secure authentication layer and Role-Based Access Control (RBAC) for the Omnicom Oceania Explorer application.

## User Roles
We will use Cognito User Groups to define the following roles:
- `admin`: Full access (Contact Explorer + Budget Explorer).
- `executive`: Full access (Contact Explorer + Budget Explorer).
- `user`: Restricted access (Contact Explorer only).

## Architecture

### 1. Authentication Component
- **Path**: `/login`
- **UI**: Using `@aws-amplify/ui-react` `Authenticator` component.
- **Customization**: Custom CSS variables to align with the project's premium design system (dark mode support, rounded-2xl borders).

### 2. Route Protection (Middleware)
- **File**: `middleware.ts`
- **Logic**:
    - Use Amplify's Next.js adapter (`fetchAuthSession`) to verify the user's session server-side.
    - Redirect unauthenticated users to `/login`.
    - Whitelist `/login`, `/_next/`, and static assets.

### 3. RBAC Implementation

#### Navigation Layer
- **Component**: `ExplorerShell.tsx`
- **Logic**: Use a client-side `useAuth` hook or parse the ID token to check `cognito:groups`.
- **Visibility**: The "Budget Explorer" menu item will only be rendered for `admin` or `executive` roles.

#### Feature Layer (Budget Explorer)
- **Path**: `app/budget-explorer/page.tsx`
- **Protection**:
    - Server-side check: Verify group membership.
    - If unauthorized, redirect to `/` or show an "Access Denied" state.

#### Feature Layer (Contact Explorer)
- **Path**: `app/page.tsx` (and component `MapComponent.tsx`)
- **Protection**: Available to all authenticated users.

## Dependencies
- `@aws-amplify/ui-react`: For the Authenticator component.
- `aws-amplify`: Core SDK for session management.

## Implementation Steps
1. Install necessary dependencies.
2. Create the Login page with the Authenticator.
3. Implement `middleware.ts` for global route protection.
4. Update `ExplorerShell.tsx` to handle role-based navigation.
5. Secure the `/budget-explorer` route with group-based checks.
