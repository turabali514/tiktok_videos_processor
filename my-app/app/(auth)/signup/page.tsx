"use client";

import { AuthForm } from "@/components/auth-form";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    // After signup, switch to login page
    router.push("/login");
  };

  const handleModeChange = () => {
    // For switching to login
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      <AuthForm 
        mode="signup" 
        onModeChange={handleModeChange}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}