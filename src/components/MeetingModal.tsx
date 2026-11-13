"use client";

import { useState } from "react";
import { LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useMeetingActions from "@/hooks/useMeetingActions";


interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isJoinMeeting: boolean;
}

function MeetingModal({
  isOpen,
  onClose,
  title,
  isJoinMeeting,
}: MeetingModalProps) {
  const [meetingUrl, setMeetingUrl] = useState("");
  const { createInstantMeeting, joinMeeting } = useMeetingActions();

  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (isLoading) return;
    setIsLoading(true);

    if (isJoinMeeting) {
        const meetingId = meetingUrl.split("/").pop();
        if (!meetingId) {
            setIsLoading(false);
            return;
        }
        await joinMeeting(meetingId);
        // keep the modal open with the loader until navigation unmounts the page
        return;
    }

    const success = await createInstantMeeting();
    if (!success) setIsLoading(false);
    // on success, stay in the loading state until the meeting page takes over
  };

  const handleOpenChange = () => {
    // don't allow closing while the meeting is being created
    if (isLoading) return;
    setMeetingUrl("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
            {isJoinMeeting && (
            <Input
                placeholder="Paste meeting link here..."
                value={meetingUrl}
                onChange={(event) => setMeetingUrl(event.target.value)}
                disabled={isLoading}
            />
            )}

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleOpenChange} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleStart}
                    disabled={isLoading || (isJoinMeeting && !meetingUrl.trim())}
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon className="size-4 animate-spin" />
                            {isJoinMeeting ? "Joining..." : "Starting..."}
                        </>
                    ) : isJoinMeeting ? (
                        "Join Meeting"
                    ) : (
                        "Start Meeting"
                    )}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MeetingModal;
