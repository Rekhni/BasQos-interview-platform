"use client";

import useGetCallById from "@/hooks/useGetCallById";
import LoaderUI from "@/components/LoaderUI";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { releaseCallDevices } from "@/lib/releaseCallDevices";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


function MeetingPage() {
    const { id } = useParams();
    const { isLoaded } = useUser();
    const { call, isCallLoading } = useGetCallById(id);

    const [isSetupComplete, setIsSetupComplete] = useState(false);
    

    // Safety net: release camera/mic when leaving the page by any route
    useEffect(() => {
        if (!call) return;
        return () => {
            releaseCallDevices(call);
        };
    }, [call]);

    if (!isLoaded || isCallLoading) return <LoaderUI />;

    if (!call) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-2xl font-semibold">Meeting not found</p>
            </div>
        );
    };

    return (
        <StreamCall call={call}>
            <StreamTheme className="h-full">
                {!isSetupComplete ? (
                    <MeetingSetup onSetupComplete={() => setIsSetupComplete(true)} />
                ) : (
                    <MeetingRoom />
                )}
            </StreamTheme>
        </StreamCall>
    )
}

export default MeetingPage;