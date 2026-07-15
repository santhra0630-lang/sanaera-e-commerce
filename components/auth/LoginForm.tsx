"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
  remember?: boolean;
};

export default function LoginForm() {
  const { register, handleSubmit, formState } = useForm<FormData>();
  const router = useRouter();

  async function onSubmit(data: FormData) {
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      remember: data.remember ? "true" : "false",
    } as any);

    if (res?.error) {
      alert(res.error);
      return;
    }

    // On success, redirect to /account or to callbackUrl if present
    router.push("/account");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>

      <label className="block mb-2">
        <span className="text-sm">Email</span>
        <input className="w-full border rounded px-3 py-2 mt-1" {...register("email", { required: true })} />
      </label>

      <label className="block mb-2">
        <span className="text-sm">Password</span>
        <input type="password" className="w-full border rounded px-3 py-2 mt-1" {...register("password", { required: true })} />
      </label>

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" {...register("remember")} />
        <span className="text-sm">Remember me</span>
      </label>

      <button type="submit" className="w-full bg-black text-white py-2 rounded">Sign in</button>

      <div className="mt-4 text-center">
        <a href="/forgot-password" className="text-sm text-gray-600">Forgot password?</a>
      </div>
    </form>
  );
}
