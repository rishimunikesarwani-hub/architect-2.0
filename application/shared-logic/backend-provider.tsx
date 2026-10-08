import type { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react';
import { authClient } from './auth-client';

export const backendConfigured = Boolean(
  import.meta.env.VITE_CONVEX_URL && import.meta.env.VITE_CONVEX_SITE_URL,
);

const convex = backendConfigured ? new ConvexReactClient(import.meta.env.VITE_CONVEX_URL) : null;

// @convex-dev/better-auth 0.12.5 widens its plugin list in AuthClient, which
// resolves useSession().data to `never` with patched Better Auth 1.6 versions.
// Check the complete runtime surface used by its provider before bridging that
// declaration-only mismatch. Keep the original authClient strongly inferred.
const providerClient = authClient satisfies {
  useSession: () => { data: { session: { id: string } } | null; isPending: boolean };
  convex: {
    token: (options: { fetchOptions: { throw: false } }) => Promise<{ data: { token: string } | null }>;
  };
  crossDomain: {
    oneTimeToken: {
      verify: (options: { token: string }) => Promise<{ data: { session: { token: string } } | null }>;
    };
  };
  getSession: (options: { fetchOptions: { headers: { Authorization: string } } }) => Promise<unknown>;
  updateSession: () => void;
};
const convexAuthClient = providerClient as unknown as AuthClient;

export function BackendProvider({ children }: { children: ReactNode }) {
  return convex
    ? <ConvexBetterAuthProvider client={convex} authClient={convexAuthClient}>{children}</ConvexBetterAuthProvider>
    : <>{children}</>;
}
