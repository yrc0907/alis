import SignUpForm from "@/components/SignUpForm";
import { Metadata } from "next";
import AuthLayout from "@/components/AuthLayout";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
} 