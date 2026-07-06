import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSurface } from '@/hooks/use-surface';
import { SurfaceSwitch } from '@/components/shared/surface-switch';
import { Building2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <SurfaceSwitch
      desktop={
        <div className="min-h-screen w-full flex bg-bg">
          {/* Left Brand Panel */}
          <div className="hidden lg:flex w-1/2 bg-brand p-12 flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-brand-foreground mb-16">
                <div className="w-8 h-8 rounded bg-brand-foreground/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-foreground" />
                </div>
                <span className="font-bold text-xl tracking-tight">RC CRM</span>
              </div>
              
              <h1 className="text-4xl font-bold text-brand-foreground mb-6 max-w-md leading-tight">
                Manage your real estate business with clarity.
              </h1>
              
              <ul className="space-y-4 text-brand-foreground/80 max-w-md">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-foreground/50" />
                  Convert more leads into clients
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-foreground/50" />
                  Streamline transaction management
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-foreground/50" />
                  Automate your follow-ups
                </li>
              </ul>
            </div>
            
            <div className="relative z-10 flex gap-2">
              <div className="w-2 h-2 rounded-full bg-stage-new" />
              <div className="w-2 h-2 rounded-full bg-stage-contacted" />
              <div className="w-2 h-2 rounded-full bg-stage-engaged" />
              <div className="w-2 h-2 rounded-full bg-stage-nurturing" />
              <div className="w-2 h-2 rounded-full bg-stage-appt" />
              <div className="w-2 h-2 rounded-full bg-stage-agreement" />
            </div>

            {/* Decorative background elements */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-foreground/5 blur-3xl" />
            <div className="absolute top-32 -left-32 w-80 h-80 rounded-full bg-brand-foreground/5 blur-3xl" />
          </div>

          {/* Right Form Panel */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>
        </div>
      }
      mobile={
        <div className="min-h-screen w-full flex flex-col bg-bg p-6">
          <div className="flex items-center justify-center gap-2 text-foreground mb-12 mt-8">
            <div className="w-8 h-8 rounded bg-brand flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">RC CRM</span>
          </div>
          <div className="flex-1 w-full max-w-sm mx-auto">
            <Outlet />
          </div>
        </div>
      }
    />
  );
}
