import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Confirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;

      if (!token_hash || !type) {
        setStatus('error');
        setErrorMsg('Invalid confirmation link.');
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });

      if (error) {
        setStatus('error');
        setErrorMsg(error.message);
      } else {
        setStatus('success');
        // If it was a recovery link, redirect to reset password
        if (type === 'recovery') {
          navigate('/auth/reset-password', { replace: true });
        }
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <Card className="border-0 shadow-none bg-transparent lg:bg-surface lg:border lg:shadow-1 text-center">
      <CardHeader className="px-0 lg:px-6 pt-0 lg:pt-6 items-center">
        {status === 'loading' && (
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
        )}
        {status === 'error' && (
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
        )}
        
        <CardTitle className="text-2xl font-bold tracking-tight">
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Email verified'}
          {status === 'error' && 'Verification failed'}
        </CardTitle>
        <CardDescription className="max-w-xs mx-auto">
          {status === 'loading' && 'Please wait while we verify your email address.'}
          {status === 'success' && 'Your email has been successfully verified.'}
          {status === 'error' && errorMsg}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 pb-0 lg:pb-6 space-y-6">
        {status === 'success' && (
          <Button onClick={() => {
            const next = searchParams.get('next');
            if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/auth')) {
              navigate(next, { replace: true });
            } else {
              navigate('/');
            }
          }} className="w-full">
            Continue to dashboard
          </Button>
        )}
        {status === 'error' && (
          <Button onClick={() => navigate('/auth/sign-in')} className="w-full">
            Back to sign in
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
