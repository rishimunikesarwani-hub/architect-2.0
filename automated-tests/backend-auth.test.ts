import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { register } from '@convex-dev/better-auth/test';
import { api, components } from '../application/backend/_generated/api';
import schema from '../application/backend/schema';

const modules = import.meta.glob('../application/backend/**/*.{ts,js}');
function setup() { const t = convexTest(schema, modules); register(t); return t; }
function request(body: object) { return { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5177', 'X-Forwarded-For': '192.0.2.10' }, body: JSON.stringify(body) }; }
beforeEach(() => { vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-long-auth-secret-never-used-in-real-deployment'); vi.stubEnv('CONVEX_SITE_URL', 'https://test.example'); vi.stubEnv('SITE_URL', 'http://localhost:5177'); vi.stubEnv('GOOGLE_CLIENT_ID', ''); vi.stubEnv('GOOGLE_CLIENT_SECRET', ''); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('password and login ID authentication', () => {
  it('reports password configuration independently of Google', async () => {
    const t = setup(); expect(await t.query(api.auth.readiness, {})).toEqual({ password: true, google: false });
  }, 20_000);
  it('signs up and authenticates a real hashed credential through Better Auth HTTP handlers', async () => {
    const t = setup();
    const password = 'test-password-for-http-only-123';
    const signup = await t.fetch('/api/auth/sign-up/email', request({ email: 'member@example.invalid', name: 'Department member', username: 'sales.member', password }));
    expect(signup.status).toBe(200);
    const created = await signup.json();
    expect(created.user.username).toBe('sales.member');
    const credential = await t.query(components.betterAuth.adapter.findOne, { model: 'account', where: [{ field: 'userId', value: created.user.id }, { field: 'providerId', value: 'credential' }] });
    expect(credential?.password).toBeTruthy(); expect(credential?.password).not.toBe(password);
    const signin = await t.fetch('/api/auth/sign-in/username', request({ username: 'SALES.MEMBER', password }));
    expect(signin.status).toBe(200);
    const signed = await signin.json(); expect(signed.user.id).toBe(created.user.id); expect(signed.token).toBeTruthy();
    const invalid = await t.fetch('/api/auth/sign-in/username', request({ username: 'sales.member', password: 'incorrect-password-123' }));
    expect(invalid.status).toBe(401);
  }, 20_000);
  it('rejects weak passwords and invalid login IDs without creating access', async () => {
    const t = setup();
    const short = await t.fetch('/api/auth/sign-up/email', request({ email: 'short@example.invalid', name: 'Short', username: 'short', password: 'short' }));
    expect(short.status).toBeGreaterThanOrEqual(400);
    const invalid = await t.fetch('/api/auth/sign-up/email', request({ email: 'bad@example.invalid', name: 'Invalid', username: 'bad login!', password: 'test-strong-password-123' }));
    expect(invalid.status).toBeGreaterThanOrEqual(400);
  }, 20_000);
  it('persists username-attempt limits in the auth database and returns 429', async () => {
    const t = setup();
    for (let index = 0; index < 10; index += 1) {
      const response = await t.fetch('/api/auth/sign-in/username', request({ username: 'unknown.user', password: 'wrong-test-password-123' }));
      expect(response.status).toBe(401);
    }
    const limited = await t.fetch('/api/auth/sign-in/username', request({ username: 'unknown.user', password: 'wrong-test-password-123' }));
    expect(limited.status).toBe(429);
    const counters = await t.query(components.betterAuth.adapter.findMany, { model: 'rateLimit', paginationOpts: { numItems: 10, cursor: null } });
    expect(counters.page.some((counter: { count: number }) => counter.count >= 10)).toBe(true);
  }, 20_000);
});
