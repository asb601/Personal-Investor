'use client';

import { AuthProvider } from "@/lib/auth";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  // previously wrapped the app in next-auth's SessionProvider; now use a
  // simple context that reads/writes a token & user from localStorage.  The
  // actual session state will be maintained by the FastAPI backend.
  return <AuthProvider>{children}</AuthProvider>;
}
