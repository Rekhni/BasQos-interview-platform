import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { createClerkClient } from "@clerk/backend";
import { WebhookEvent } from "@clerk/nextjs/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET as string;
        if (!webhookSecret) {
            throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
        }

        const svix_id = req.headers.get("svix-id") as string;
        const svix_timestamp = req.headers.get("svix-timestamp") as string;
        const svix_signature = req.headers.get("svix-signature") as string;

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("No svix headers found", {
                status: 400,
            });
        }

        const payload = await req.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);

        try {
            wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            });
        } catch (error) {
            console.error("Error verifying webhook:", error);
            return new Response("Error occurred", {
                status: 400,
            });
        }

        const evt = payload as WebhookEvent;
        const eventType = evt.type;

        try {
            if (eventType === "user.created") {
                const { id, email_addresses, first_name, last_name, image_url } = evt.data;
                const email = email_addresses[0]?.email_address;
                if (!email) {
                    return new Response("User has no email", { status: 400 });
                }

                await ctx.runMutation(api.users.syncUser, {
                    clerkId: id,
                    email,
                    name: `${first_name || ""} ${last_name || ""}`.trim() || email,
                    image: image_url,
                });
            }

            if (eventType === "session.created") {
                const clerkSecret = process.env.CLERK_SECRET_KEY;
                if (!clerkSecret) {
                    throw new Error("Missing CLERK_SECRET_KEY environment variable");
                }

                const clerk = createClerkClient({ secretKey: clerkSecret });
                const clerkUser = await clerk.users.getUser(evt.data.user_id);
                const email = clerkUser.emailAddresses[0]?.emailAddress;
                if (!email) {
                    return new Response("User has no email", { status: 400 });
                }

                await ctx.runMutation(api.users.syncUser, {
                    clerkId: clerkUser.id,
                    email,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email,
                    image: clerkUser.imageUrl,
                });
            }
        } catch (error) {
            console.error("Error syncing user:", error);
            return new Response("Error creating user", { status: 500 });
        }

        return new Response("Webhook successfully processed", { status: 200 });
    }),
});

export default http;
