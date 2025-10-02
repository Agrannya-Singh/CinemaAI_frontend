'use client';

import { PasswordResetForm } from "@/components/password-reset-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <PasswordResetForm />
        <Button variant="link" asChild className="mx-auto">
          <Link href="/auth/login">
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  )
}