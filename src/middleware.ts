import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const adminRoutes = [
      "/dashboard/settings",
      "/dashboard/dues-ledger/invoices/create"
    ];

    if (adminRoutes.some(route => path.startsWith(route))) {
      const roles = (token?.roles as string[]) || [];
      const isAdmin = roles.some(r =>
        ["ADMIN", "BOARD_ADMIN", "BOARD", "BOARD_MEMBER", "HOA_BOARD_MEMBER"].includes(r)
      );
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/announcements-documents/:path*", "/work-orders/:path*", "/violations-arc/:path*", "/residents-units/:path*", "/dues-ledger/:path*", "/settings/:path*"],
};

