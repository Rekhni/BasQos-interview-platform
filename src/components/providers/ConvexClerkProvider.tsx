"use client";

import { useEffect } from "react";
import { ConvexReactClient, useMutation } from "convex/react";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

function SyncUserToConvex() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);

    useEffect(() => {
        if (!isLoaded || !user) return;

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) return;

        void syncUser({
            clerkId: user.id,
            email,
            name: [user.firstName, user.lastName].filter(Boolean).join(" ") || email,
            image: user.imageUrl,
        });
    }, [isLoaded, user, syncUser]);

    return null;
}

function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <SyncUserToConvex />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    )
}

export default ConvexClerkProvider;