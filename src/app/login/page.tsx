import { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import AuthLayout from "@/components/AuthLayout";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
} 