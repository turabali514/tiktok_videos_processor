"use client";

import { AuthForm } from "@/components/auth-form";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    // For login success - redirect to dashboard
    window.location.href = '/dashboard'; // Full page reload to ensure auth state
  };

  const handleModeChange = () => {
    // For switching to signup
    router.push("/signup");
  };

  return (
    <div className="min-h-screen">
      <AuthForm 
        mode="login" 
        onModeChange={handleModeChange}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}