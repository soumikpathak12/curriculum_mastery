import { PrismaAdapter } from '@auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import type { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        // Check if user is blocked
        if (user.blocked) {
          throw new Error('Your account has been blocked. Please contact support.')
        }
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role as Role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'role' in user) {
        token.role = (user as { role?: Role }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role | undefined
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If a callbackUrl is provided, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to dashboard for students
      // Note: Role-based redirect is handled in login page since redirect callback
      // doesn't have direct access to user role in all cases
      return `${baseUrl}/dashboard`
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
