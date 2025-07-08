import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      allowDangerousEmailAccountLinking: true
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Credentials received:", { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string
          }
        }) as { id: string; email: string | null; name: string | null; password: string | null } | null;

        console.log("User found:", { userExists: !!user, hasPassword: !!user?.password });

        if (!user?.password) {
          console.log("User not found or no password");
          return null;
        }

        // For development, we'll use plain text passwords
        // In production, you should hash passwords using bcrypt
        const isPasswordValid = credentials.password === user.password;
        
        console.log("Password validation:", { isPasswordValid });
        
        // Example for production with bcrypt:
        // const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);
        
        if (!isPasswordValid) {
          console.log("Invalid password");
          return null;
        }

        console.log("Authentication successful for user:", user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { 
        user: { id: user.id, email: user.email, name: user.name }, 
        account: account ? { provider: account.provider, type: account.type } : null,
        profile: profile ? { email: profile.email, name: profile.name } : null
      });
      
      // For Google OAuth, ensure redirect happens
      if (account?.provider === 'google') {
        console.log('Google OAuth sign-in successful, will redirect to dashboard');
      }
      
      return true;
    },
    jwt: ({ token, user, account }) => {
      console.log('JWT callback:', { 
        tokenId: token.id, 
        userId: user?.id, 
        accountProvider: account?.provider 
      });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      console.log('Session callback:', { 
        sessionUser: session.user?.email, 
        tokenId: token.id 
      });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect called with:', { url, baseUrl });
      
      // Handle Google OAuth callback specifically
      if (url.includes('/api/auth/callback/google')) {
        console.log('Google OAuth callback, redirecting to dashboard');
        return baseUrl + '/dashboard?welcome=true';
      }
      
      // Handle general auth callbacks
      if (url.includes('/api/auth/')) {
        console.log('Auth callback, redirecting to dashboard');
        return baseUrl + '/dashboard?welcome=true';
      }
      
      // If redirecting to dashboard, keep it as is
      if (url.includes('/dashboard')) {
        console.log('Redirecting to dashboard:', url);
        return url;
      }
      
      // If it's the home page, redirect to dashboard
      if (url === baseUrl || url === baseUrl + '/') {
        console.log('Redirecting from home to dashboard');
        return baseUrl + '/dashboard?welcome=true';
      }
      
      // Allow relative callback URLs to dashboard
      if (url.startsWith('/')) {
        console.log('Relative URL, redirecting to dashboard');
        return `${baseUrl}/dashboard?welcome=true`;
      }
      
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        console.log('Same origin URL, redirecting to dashboard');
        return baseUrl + '/dashboard?welcome=true';
      }
      
      // Default to dashboard
      console.log('Default redirect to dashboard');
      return baseUrl + '/dashboard?welcome=true';
    },
  },
} satisfies NextAuthConfig;
