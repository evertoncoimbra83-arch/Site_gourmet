import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ✅ Interface estendida para suportar os campos do seu Banco de Dados
interface ExtendedUser extends User {
  id: string;
  cpf?: string | null;
  phone?: string | null;
  role?: string | null;
  referralCode?: string | null; 
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  providers: [
    CredentialsProvider({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
        // ✅ Adicionado guestId nas credenciais para o authorize recebê-lo
        guestId: { label: "Guest ID", type: "text" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              guestId: credentials.guestId, // ✅ Enviando para o seu Backend processar o promoteCart
            }),
            headers: { "Content-Type": "application/json" }
          });

          const user = await response.json();

          // Se o login falhar ou a API retornar erro
          if (!response.ok || !user) return null;

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            cpf: user.cpf || user.customerDocument,
            phone: user.phone,
            role: user.role,
            referralCode: user.referralCode 
          };
        } catch (error) {
          console.error("Erro no authorize do NextAuth:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.cpf = u.cpf;
        token.phone = u.phone;
        token.role = u.role;
        token.referralCode = u.referralCode; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // ✅ Usando cast para garantir que o TS reconheça os campos na sessão
        const s = session.user as ExtendedUser;
        s.id = token.id as string;
        s.cpf = token.cpf as string;
        s.phone = token.phone as string;
        s.role = token.role as string;
        s.referralCode = token.referralCode as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);