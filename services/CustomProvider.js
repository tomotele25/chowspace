import { BACKENDURL } from "@/lib/api";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const customProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email", placeholder: "you@example.com" },
    password: { label: "Password", type: "password" },
  },

  async authorize(credentials) {
    try {
      const res = await axios.post(`${BACKENDURL}/api/auth/user/login`, {
        email: credentials.email,
        password: credentials.password,
      });

      const user = res.data.user;
      const accessToken = res.data.accessToken;

      if (res.data.success && user) {
        return {
          id: user.id,
          vendorId: user.vendorId,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          accessToken,
          businessName: user.businessName,
          location: user.location,
          contact: user.contact,
          address: user.address,
          paymentPreference: user.paymentPreference,
        };
      }
      return null;
    } catch (error) {
      const data = error.response?.data;

      // Throwing surfaces the reason to the client as `error` on the signIn
      // result. Returning null would give a generic "invalid credentials",
      // and a vendor who simply hasn't confirmed their email would have no
      // idea why they can't get in.
      if (data?.code === "EMAIL_NOT_VERIFIED") {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      console.error("Auth error:", data || error.message);
      return null;
    }
  },
});
