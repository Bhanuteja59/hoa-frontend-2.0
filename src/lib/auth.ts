import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || "dev-nextauth-secret",
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
                    const res = await fetch(`${baseUrl}/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    if (!res.ok) {
                        console.error("Login failed:", res.status, await res.text());
                        return null;
                    }

                    const user = await res.json();
                    if (user && user.access_token) {
                        return {
                            id: user.user_id,
                            email: credentials.email,
                            name: user.name || "User",
                            accessToken: user.access_token,
                            tenantId: user.tenant_id,
                            tenant_slug: user.tenant_slug,
                            tenant_name: user.tenant_name,
                            roles: user.roles,
                            isPlatformAdmin: user.is_platform_admin,
                            community_type: user.community_type,
                        };
                    }
                    return null;
                } catch (e) {
                    console.error("Auth error:", e);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.tenantId = user.tenantId;
                token.id = user.id;
                // @ts-ignore
                token.tenant_slug = user.tenant_slug;
                // @ts-ignore
                token.tenant_name = user.tenant_name;
                // @ts-ignore
                token.roles = user.roles;
                // @ts-ignore
                token.isPlatformAdmin = user.isPlatformAdmin;
                // @ts-ignore
                token.community_type = user.community_type;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.accessToken = token.accessToken as string;
                session.user.tenantId = token.tenantId as string;
                // @ts-ignore
                session.tenant_slug = token.tenant_slug as string;
                // @ts-ignore
                session.tenant_name = token.tenant_name as string;
                // @ts-ignore
                session.roles = token.roles as string[];
                // @ts-ignore
                session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
                // @ts-ignore
                session.access_token = token.accessToken as string;
                // @ts-ignore
                session.user.community_type = token.community_type as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
};
