'use client'
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export default function SignUp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', agreed: false,
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (session) router.push('/dashboard'); // Already authenticated
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!form.password) {
      toast.error("Password is required");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (!form.agreed) {
      toast.error("You must agree to the terms and conditions");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json() as { error?: string };

      if (res.ok) {
        toast.success("Account created successfully! Please log in with your credentials.");
        
        // Clear the form
        setForm({ name: '', email: '', password: '', confirmPassword: '', agreed: false });
        
        // Redirect to login page instead of auto-login to avoid CSRF issues
        setTimeout(() => {
          router.push('/login?message=Account created successfully. Please log in.');
        }, 1500);
      } else {
        toast.error(data.error ?? "Something went wrong during registration");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // For Google OAuth, let NextAuth handle the redirect automatically
      await signIn('google', { 
        callbackUrl: '/dashboard?welcome=true',
      });
      
      // This will trigger the automatic redirect to Google OAuth
      // The redirect callback in auth config will handle the return redirect
    } catch (err) {
      console.error("Google sign-up error:", err);
      toast.error("Google sign-up failed. Please try again.");
    }
  };

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render signup form if already authenticated
  if (session) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Create Your Account</CardTitle>
          <p className="text-center text-sm text-muted-foreground">Join Smart Reminder and never miss a task</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full gap-3"
          >
            <FcGoogle className="text-xl" /> Sign up with Google
          </Button>

          <div className="flex items-center gap-2">
            <hr className="flex-grow border-border" />
            <span className="text-sm text-muted-foreground">OR</span>
            <hr className="flex-grow border-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name" 
              type="text" 
              value={form.name}
              onChange={handleChange} 
              placeholder="Full Name" 
              required
            />
            <Input
              name="email" 
              type="email" 
              value={form.email}
              onChange={handleChange} 
              placeholder="Email" 
              required
            />
            <Input
              name="password" 
              type="password" 
              value={form.password}
              onChange={handleChange} 
              placeholder="Password" 
              required
            />
            <Input
              name="confirmPassword" 
              type="password" 
              value={form.confirmPassword}
              onChange={handleChange} 
              placeholder="Confirm Password" 
              required
            />

            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="terms"
                checked={form.agreed}
                onCheckedChange={(checked) => setForm({ ...form, agreed: checked as boolean })}
                required
              />
              <label htmlFor="terms" className="text-sm text-foreground">
                I agree to the <a className="text-primary hover:text-primary/80 hover:underline" href="#">Terms</a> and <a className="text-primary hover:text-primary/80 hover:underline" href="#">Privacy</a>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="text-primary hover:text-primary/80 hover:underline">Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
