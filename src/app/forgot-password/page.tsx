'use client'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ForgotPassword() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string>('');

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (session) router.push('/dashboard');
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json() as { 
        message?: string; 
        error?: string; 
        resetUrl?: string; 
        devMode?: boolean;
        expiresAt?: string;
      };

      if (res.ok) {
        setSent(true);
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
          // Automatically redirect to reset password page in development mode
          if (data.devMode) {
            toast.success("Redirecting to password reset...");
            setTimeout(() => {
              window.location.href = data.resetUrl!;
            }, 2000);
          }
        }
        
        if (data.devMode) {
          toast.success("Reset link generated! Redirecting to reset page...");
        } else {
          toast.success("Reset link sent! Check your email for instructions.");
        }
      } else {
        toast.error(data.error ?? "Failed to send reset link. Please try again.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
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

  // Don't render form if already authenticated
  if (session) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Forgot Password</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {sent 
              ? "Check your email for reset instructions"
              : "We'll send you a reset link on your email"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  If an account with <strong>{email}</strong> exists, you will receive a password reset link shortly.
                </p>
              </div>
              
              {resetUrl && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    <strong>🔧 Development Mode:</strong> Email not configured. Use this link to reset your password:
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <a 
                      href={resetUrl} 
                      className="text-sm text-blue-600 dark:text-blue-400 underline break-all hover:text-blue-800"
                    >
                      {resetUrl}
                    </a>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    💡 Click the link above or copy it to your browser to reset your password
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                    setResetUrl('');
                  }}
                  className="flex-1"
                >
                  Try Different Email
                </Button>
                <Button 
                  onClick={() => router.push('/login')}
                  className="flex-1"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email" 
                name="email" 
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)} 
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="flex justify-between text-sm">
              <a href="/login" className="text-primary hover:text-primary/80 hover:underline">Back to Sign In</a>
              <a href="/signup" className="text-primary hover:text-primary/80 hover:underline">Create Account</a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
