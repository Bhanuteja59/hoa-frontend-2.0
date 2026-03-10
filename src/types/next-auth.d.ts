import "next-auth";

declare module "next-auth" {
    interface User {
        accessToken: string;
        tenantId: string;
        id: string;
    }

    interface Session {
        user: User;
        roles: string[];
        access_token: string;
    }
}
