import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { releaseCallDevices } from '@/lib/releaseCallDevices';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../convex/_generated/api';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

const EndCallButton = () => {
  const router = useRouter();
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const updateInterviewStatus = useMutation(api.interviews.updateInterviewStatus);

  const interview = useQuery(api.interviews.getInterviewByStreamCallId, {
    streamCallId: call?.id || "",
  });

  // `interview` is undefined while loading and null for instant meetings
  // (they only exist in Stream, not in Convex), so it must not gate the button
  if (!call) return null;

  const isMeetingOwner = localParticipant?.userId === call.state.createdBy?.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    try {
        await call.endCall();

        // endCall only ends the session server-side; leave and release camera/mic locally
        await releaseCallDevices(call);

        if (interview) {
            await updateInterviewStatus({
                id: interview._id,
                status: "completed"
            })
        }

        router.push("/");
        toast.success("Meeting ended for everyone");
    } catch (error) {
        console.log(error);
        toast.error("Failed to end meeting");
    }
  }

  return (
    <Button onClick={endCall} variant={"destructive"} className="h-10 px-4">
        End Meeting
    </Button>
  ) 
}

export default EndCallButton;