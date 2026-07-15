import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createOtpForIdentifier } from "@/lib/otp";
import { sendEmail } from "@/lib/email";

const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      return new Response(JSON.stringify({ ok: false, error: "Email already registered" }), { status: 400 });
    }

    const hashed = await hashPassword(parsed.password);
    const user = await prisma.user.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email.toLowerCase(),
        hashedPassword: hashed,
      },
    });

    // Create OTP for email verification
    const { code } = await createOtpForIdentifier(user.email);

    // Send verification email (graceful fallback if SMTP not configured)
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?email=${encodeURIComponent(
      user.email
    )}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email — SANAÉRA",
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>Or click <a href="${verifyUrl}">here</a> to verify.</p>`,
      text: `Your verification code is ${code}. Visit ${verifyUrl}`,
    });

    return new Response(JSON.stringify({ ok: true, message: "Registered; verification email sent" }), { status: 201 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), { status: 400 });
  }
}
