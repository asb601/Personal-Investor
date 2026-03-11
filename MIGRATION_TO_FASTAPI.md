# Migration Guide: Next.js Backend → FastAPI

This document walks through the steps required to migrate the backend functionality of the **Personal-Investor** project from the built-in Next.js API routes (and NextAuth-based auth) to a standalone FastAPI service. It assumes the client-side is already in the process of being decoupled (as shown by recent edits). Follow each section carefully and check off tasks as you complete them.

---

## 1. Overview & Goals

1. **Replace Next.js API routes** with HTTP endpoints implemented in FastAPI (running separately, e.g. `http://localhost:8000`).
2. **Move authentication logic** from NextAuth to FastAPI, issuing JWTs and storing session state server‑side.
3. **Update client** to use a minimal auth context and talk to FastAPI for all data operations.
4. **Remove NextAuth dependency** from the frontend eventually.
5. **Document** dummy implementations on the client until the real backend endpoints are ready.

---

## 2. Backend (FastAPI) Implementation Steps

1. **Design API contract**:
   - `POST /auth/google` → accept OAuth token, verify with Google, create or fetch user, return JWT + user object.
   - `POST /auth/login` (if supporting non‑Google login).
   - `GET /user` → return current user’s profile (JWT in header).
   - `GET /transactions?userId=<id>` → fetch transactions.
   - `POST /transactions` → create new transaction.
   - `DELETE /transactions/{id}` → delete transaction.
   - etc.

2. **Set up FastAPI project**:
   - Use `uvicorn` for development.
   - Define Pydantic models for request/response bodies.
   - Integrate with ORM of choice (SQLAlchemy, Tortoise, etc.).
   - Implement Google OAuth verification using `google-auth` or similar.
   - Generate JWTs with `pyjwt` and configure secret/expiry.
   - Add middleware to validate JWTs and populate `request.user`.

3. **Authentication flow**:
   - Client sends Google token to `/auth/google`.
   - FastAPI verifies token and retrieves user info.
   - Create user record if necessary.
   - Return JWT plus (optionally) serialized user object.
   - Protect subsequent endpoints with JWT dependency.

4. **Transfer existing migration logic** from Next.js to FastAPI if there was any, e.g., database schema creation.

5. **Testing & documentation**:
   - Write tests for each endpoint.
   - Optionally, provide OpenAPI/Swagger UI.

---

## 3. Frontend (Next.js) Changes

1. **Auth context** (`src/lib/auth.ts`):
   - Simple React context storing `{ user, token }`.
   - On login success, call `login(token, user)` and persist to `localStorage`.
   - On logout, clear storage and context.
   - `useAuth` hook to consume.

2. **Remove next-auth imports & providers**:
   - Replace `<SessionProvider>` with `<AuthProvider>` (done).
   - Delete or comment out `auth-options.ts`, API route `[...nextauth]`, type augmentations, and other NextAuth-specific code.
   - Remove `next-auth` dependency from `package.json` once all usages are gone.

3. **API action rewrites**:
   - All server actions (`getTransactions`, `addTransaction`, etc.) should eventually call `fetch()` against the FastAPI endpoints, passing `Authorization: Bearer <token>` header.
   - For now, use dummy implementations with comments describing intended behavior (done earlier).
   - Eventually implement actual `fetch` calls and handle error/responses.

4. **Components / hooks**:
   - Replace `useSession` and session guards with `useAuth` and `user` checks (done).
   - Update `Header` component to read user from context and call `logout()` instead of `signOut()`.
   - Ensure login page stores token via context.
   - Routes should redirect to `/login` when `user` is null.

5. **Testing & validation**:
   - Confirm navigation flow works without NextAuth.
   - Verify login page still displays and stores credentials locally.
   - Once backend endpoints are ready, switch dummy actions to real fetches and test end-to-end.

---

## 4. Clean-up & Housekeeping

1. **Dependencies**: once NextAuth is no longer required on the frontend, remove it and related packages (`@auth/drizzle-adapter`, etc.).
2. **Code removal**: delete or archive commented files:
   - `auth-options.ts`
   - `[...nextauth]/route.ts`
   - `types/next-auth.d.ts`
   - any backup files such as `Homepagebackup.txt`.
3. **Linting/formatting**: run `npm run lint`/`prettier` to ensure code style.
4. **Update documentation**: reflect hookup to FastAPI in README.

---

## 5. Deployment Considerations

1. **FastAPI hosting**: choose environment (DigitalOcean, AWS, etc.).
2. **CORS**: allow requests from the Next.js origin.
3. **Environment variables**: manage secrets for Google client ID/secret, JWT secret.
4. **Reverse proxy**: configure if serving both front and back under same domain.

---

## 6. Example Client Usage (future)

```ts
// src/actions/get-transactions.ts
export async function getTransactions(userId: string) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_URL}/transactions?userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("failed to fetch");
  return res.json();
}
```

Add similar code for other actions once FastAPI endpoints are available.

---

## 7. Summary & Checklist

- [x] Implement auth context and dummy actions (client).
- [x] Remove next-auth usage and comment out related files.
- [ ] Finish FastAPI service with the required endpoints.
- [ ] Switch client actions to real HTTP calls.
- [ ] Test end-to-end and clean up.

This guide should serve as a blueprint for the migration; adjust as your application evolves.

Good luck! Let me know if you need help with any specific step.
