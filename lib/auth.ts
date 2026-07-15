import { withAuth } from "next-auth/middleware";

export const auth = (handler: (req: any) => any) =>
  withAuth(async (req: any) => {
    // withAuth attaches `req.nextauth` with token/user data
    // Normalize to `req.auth` expected by middleware.ts
    req.auth = (req as any).nextauth ?? null;
    return handler(req);
  });
