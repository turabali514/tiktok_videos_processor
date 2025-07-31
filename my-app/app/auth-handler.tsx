"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/check-auth`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          // If user is authenticated and on /auth routes, redirect to dashboard
          if (pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/auth')) {
            router.push('/dashboard');
          }
        } else {
          // If not authenticated and on protected routes, redirect to login
          if (pathname?.startsWith('/dashboard')) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (pathname?.startsWith('/dashboard')) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [pathname, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
}
