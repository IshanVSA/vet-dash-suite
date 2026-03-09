import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import vsaLogo from "@/assets/vsa-logo.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — clean brand panel */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12 bg-[hsl(222,47%,6%)]">
        <div className="max-w-sm relative z-10">
          <img src={vsaLogo} alt="VSA Vet Media" className="h-14 w-14 rounded-2xl object-cover mb-8 shadow-2xl" />
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Digital Marketing, Simplified.</h2>
          <p className="text-[hsl(215,20%,55%)] text-base leading-relaxed">
            Manage your veterinary clinic's social media, ads, and content — all from one powerful dashboard.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-[hsl(var(--primary))]" />
            <div className="h-1 w-4 rounded-full bg-[hsl(var(--primary))]/30" />
            <div className="h-1 w-4 rounded-full bg-[hsl(var(--primary))]/10" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <img src={vsaLogo} alt="VSA Vet Media" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-foreground text-sm">VSA Vet Media</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isSignUp ? "Get started with VSA Vet Media" : "Sign in to your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" required className="input-glow" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input-glow" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="input-glow" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
