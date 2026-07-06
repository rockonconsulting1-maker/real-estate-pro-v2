import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || 'your email';
  const mode = location.state?.mode || 'signup';
  
  const [cooldown, setCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setIsResending(true);
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
      } else {
        // We can't easily resend signup email without password, so just show a message or use resend API if available
        // Supabase has resend API
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          }
        });
        if (error) throw error;
      }
      
      toast.success('Email resent successfully');
      setCooldown(30);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent lg:bg-surface lg:border lg:shadow-1 text-center">
      <CardHeader className="px-0 lg:px-6 pt-0 lg:pt-6 items-center">
        <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-brand" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
        <CardDescription className="max-w-xs mx-auto">
          We sent a {mode === 'reset' ? 'password reset' : 'verification'} link to <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 pb-0 lg:pb-6 space-y-6">
        <div className="text-sm">
          Didn't receive the email?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="font-medium text-brand hover:text-brand-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending && <Loader2 className="mr-2 h-3 w-3 animate-spin inline" />}
            Click to resend {cooldown > 0 && `(${cooldown}s)`}
          </button>
        </div>

        <Link to="/auth/sign-in" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
