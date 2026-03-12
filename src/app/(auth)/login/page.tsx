import SignInView from "@/src/modules/auth/views/sign-in.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PLEASE-PROTECT-CENTER",
  description: "Please-Protect Center Web Interface",
};

export default function LoginPage() {
  return <SignInView />;
}