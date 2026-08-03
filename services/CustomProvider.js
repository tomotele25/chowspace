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
      console.log(user);
      return null;
    } catch (error) {
      console.error("Auth error:", error.response?.data || error.message);
      return null;
    }
  },
});
