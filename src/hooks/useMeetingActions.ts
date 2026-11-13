import { useRouter } from "next/navigation";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import toast from "react-hot-toast";

const useMeetingActions = () => {
    const router = useRouter();
    const client = useStreamVideoClient();

    // Returns true when the meeting was created and navigation has started
    const createInstantMeeting = async (): Promise<boolean> => {
        if (!client) return false;

        try {
            const id = crypto.randomUUID();
            const call = client.call("default", id);

            await call.getOrCreate({
                data: {
                    starts_at: new Date().toISOString(),
                    custom: {
                        description: "Instant Meeting",
                    },
                },
            });

            router.push(`/meeting/${call.id}`);
            toast.success("Meeting created");
            return true;
        } catch (error) {
            console.error("Error creating instant meeting", error);
            toast.error("Failed to create meeting");
            return false;
        }
    };

    const joinMeeting = async (callId: string) => {
        if (!client) return toast.error("Failed to join meeting. Please try again.");
        router.push(`/meeting/${callId}`);
    };

    return { createInstantMeeting, joinMeeting };
};

export default useMeetingActions;
