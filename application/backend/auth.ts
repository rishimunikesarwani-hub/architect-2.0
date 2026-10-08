/// <reference types="node" />
import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { username } from 'better-auth/plugins/username';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:5177';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return betterAuth({
    appName: 'Architect 2.0',
    baseURL: process.env.CONVEX_SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: false },
    // No email verification or password-reset delivery service is configured.
    // Department permissions are never inferred from email or a client-supplied role.
    rateLimit: {
      enabled: true, storage: 'database', window: 60, max: 100,
      customRules: { '/sign-in/username': { window: 60, max: 10 }, '/sign-in/email': { window: 60, max: 10 }, '/sign-up/email': { window: 60, max: 5 } },
    },
    socialProviders: clientId && clientSecret ? {
      google: { clientId, clientSecret, prompt: 'select_account' },
    } : {},
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 40, usernameNormalization: (value) => value.trim().toLowerCase(), usernameValidator: (value) => /^[a-z0-9][a-z0-9._]{2,39}$/i.test(value) }), crossDomain({ siteUrl }), convex({ authConfig })],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    return user ? { id: user._id, name: user.name, email: user.email, image: user.image ?? null, loginId: user.username ?? null } : null;
  },
});

// Public capability check exposes presence only; never secret values.
export const readiness = query({
  args: {},
  handler: async () => ({ password: Boolean(process.env.BETTER_AUTH_SECRET), google: Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.BETTER_AUTH_SECRET,
  ) }),
});
