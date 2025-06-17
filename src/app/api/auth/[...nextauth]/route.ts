import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Ensure this route is not statically generated
export const dynamic = "force-dynamic";
