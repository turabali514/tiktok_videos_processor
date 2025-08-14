"use client"

import type React from "react"
import { useRouter } from 'next/navigation'
import { useState,useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Video, Check, X, Sparkles, Zap } from "lucide-react"
import { AuthAnimatedBackground } from "./auth-animated-background"
import { AuthLoadingAnimation } from "./auth-loading-animation"
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted;
}
interface AuthFormProps {
  mode: "login" | "signup"
  onModeChange: (mode: "login" | "signup") => void
  onSuccess: () => void
}

export function AuthForm({ mode, onModeChange, onSuccess }: AuthFormProps) {
  const router=useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRequirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "One uppercase letter", met: /[A-Z]/.test(password) },
    { text: "One number", met: /\d/.test(password) },
    {text: "One Specila character", met: /[^A-Za-z0-9]/.test(password)}
  ]
  
  const handleLoadingComplete = () => {
    setShowLoadingAnimation(false)
    setTimeout(() => setShowForm(true), 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  // Input validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Please enter a valid email address.");
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${mode === "login" ? "/login" : "/signup"}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.log(data.error)
      throw new Error(data.detail || "Authentication failed");
    }
    // For both login and signup, let the page component handle the redirect
    if (mode === "signup") {
  setError("Account created successfully! Please log in.");
  setTimeout(() => onSuccess(), 1500); // Give user time to see the message
} else {
  if (await waitForAuth()) 
  { setError("Login Successful!")
    setTimeout(() => router.push("/dashboard"), 1500);
}}
  } catch (err) {
    setError(err instanceof Error ? err.message : "Authentication failed");
  } finally {
    setIsLoading(false);
  }
};
const waitForAuth = async () => {
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/check-auth`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        return true;
      }
    }
    await new Promise((r) => setTimeout(r, 200)); // wait 200ms
  }
  return false;
};
  const hasMounted = useHasMounted();
if (!hasMounted) return null; // Prevent hydration mismatch
if (showLoadingAnimation) {
  return <AuthLoadingAnimation onComplete={handleLoadingComplete} />
}


  return (
    <div className=" min--h-screen max-h-screen overflow-y-auto flex items-start justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <AuthAnimatedBackground />

      {/* Floating decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse" />
      <div
        className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-full blur-xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-5 w-16 h-16 bg-gradient-to-r  from-red-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div className="relative z-10 flex items-center  justify-center min-h-screen px-4">
      <Card
        className={`w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-red-500/20 shadow-2xl relative z-10 transform transition-all duration-1000 hover:scale-[1.02] hover:shadow-red-500/10 ${
          showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 "
        }`}
      >
        {/* Animated border glow */}
        <div className="absolute inset-0 overflow-y: auto bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 rounded-lg blur-sm opacity-0 hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="text-center space-y-4 relative z-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl flex items-center justify-center transform transition-all duration-500 hover:rotate-12 hover:scale-110 relative group">
            <Video className="w-10 h-10 text-white" />

            {/* Icon decorations */}
            
            {hasMounted && (
  <>
    <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-red-400 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <Zap
      className="absolute -bottom-2 -left-2 w-5 h-5 text-pink-400 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ animationDelay: "0.2s" }}
    />
  </>
)}
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-3xl border-2 border-red-400/30 animate-ping" />
            <div
              className="absolute inset-0 rounded-3xl border-2 border-pink-400/30 animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-white bg-clip-text text-transparent">
              {mode === "login" ? "Welcome Back" : "Join TikTok Insights"}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              {mode === "login"
                ? "Sign in to unlock powerful video analytics"
                : "Create your account and start analyzing viral content"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10 ">
          <div className="max-h-[500px] pr-1 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5 ">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email Address
              </Label>
              <div className="relative group ">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 focus:ring-4 transition-all duration-300 rounded-xl py-3"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Password
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "login" ? "Enter your password" : "Create a strong password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 focus:ring-4 pr-12 transition-all duration-300 rounded-xl py-3"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 transition-all duration-300 ${
                          req.met ? "transform translate-x-1" : ""
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                            req.met
                              ? "bg-green-500/20 border border-green-500/30"
                              : "bg-gray-700/50 border border-gray-600"
                          }`}
                        >
                          {req.met ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <X className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <span
                          className={`transition-colors duration-300 ${req.met ? "text-green-400" : "text-gray-500"}`}
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 focus:ring-4 pr-12 transition-all duration-300 rounded-xl py-3"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-4 rounded-xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
              disabled={isLoading}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {mode === "login" ? "Sign In to Dashboard" : "Create Account"}
                  <Zap className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>
         <div className="min-h-[40px] transition-all duration-300 flex items-center justify-center">
  {error && (
    <div className="text-red-400 text-sm text-center font-medium bg-red-500/10 border border-red-500/20 p-2 rounded-lg transition-all duration-300">
      {error}
    </div>
  )}
</div>
          <div className="text-center">
            <span className="text-gray-400">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Button
              variant="link"
              className="text-red-400 hover:text-red-300 p-0 h-auto font-semibold transition-all duration-300 hover:scale-105"
              onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Sign up here" : "Sign in here"}
            </Button>
          </div>

          {/* Social proof */}
          <div className="pt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                <span>Real-time Analytics</span>
              </div>
            </div>
          </div>
          </div>
        </CardContent>
      </Card></div>
    </div>
  )
}
