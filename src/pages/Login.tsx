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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - animated gradient */}
      <div
        className="hidden lg:flex lg:flex-1 relative overflow-hidden items-center justify-center p-12"
        style={{
          background: "linear-gradient(135deg, hsl(221 83% 53%), hsl(221 83% 40%), hsl(280 65% 50%))",
          backgroundSize: "200% 200%",
          animation: "gradient-shift 8s ease infinite",
        }}
      >
        <div className="absolute top-20 left-16 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/[0.08] blur-lg" />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 rounded-full border border-white/10" />

        <div className="max-w-md text-primary-foreground relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src={vsaLogo} alt="VSA Vet Media" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-bold">VSA Vet Media</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Digital Marketing, Simplified.</h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Manage your veterinary clinic's social media, ads, and content — all from one powerful dashboard.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <img src={vsaLogo} alt="VSA Vet Media" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-foreground">VSA Vet Media</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground mt-1">
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

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
