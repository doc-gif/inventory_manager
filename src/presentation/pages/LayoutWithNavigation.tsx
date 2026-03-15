// src/presentation/components/LayoutWithNavigation.tsx
import { Outlet, ScrollRestoration } from "react-router";
import { Toaster } from "sonner";
import React from "react";

import { useHydrateInventory } from "@/presentation/hooks/useHydrateInventory";
import { InstallPrompt } from "@/presentation/components/InstallPrompt";
import { ReloadPrompt } from "@/presentation/components/ReloadPrompt";

export function LayoutPage() {
    useHydrateInventory();

    return (
        <div className="min-h-screen bg-background font-[Noto_Sans_JP,sans-serif] max-w-lg mx-auto relative overflow-x-hidden">
            <ScrollRestoration />

            <Outlet />

            <InstallPrompt />
            <ReloadPrompt />

            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                }}
            />
        </div>
    );
}