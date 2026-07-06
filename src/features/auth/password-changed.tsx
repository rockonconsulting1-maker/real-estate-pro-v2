import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export function PasswordChanged() {
  return (
    <Card className="border-0 shadow-none bg-transparent lg:bg-surface lg:border lg:shadow-1 text-center">
      <CardHeader className="px-0 lg:px-6 pt-0 lg:pt-6 items-center">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-success" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Password changed</CardTitle>
        <CardDescription className="max-w-xs mx-auto">
          Your password has been successfully reset. Click below to log in magically.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 pb-0 lg:pb-6 space-y-6">
        <Button asChild className="w-full">
          <Link to="/auth/sign-in">
            Sign in
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
