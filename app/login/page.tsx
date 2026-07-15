import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export const metadata = {
  title: "Sign in — SANAÉRA",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <GoogleSignInButton />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
