"use client";

import LoaderUI from "@/components/LoaderUI";
import RecordingCard from "@/components/RecordingCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import useGetCalls from "@/hooks/useGetCalls";
import { CallRecording } from "@stream-io/video-react-sdk";
import { useState, useEffect } from "react";

function RecordingsPage() {
    const { calls, isLoading: isCallsLoading } = useGetCalls();
    const [recordings, setRecordings] = useState<CallRecording[]>([]);
    const [isRecordingsLoading, setIsRecordingsLoading] = useState(true);

    useEffect(() => {
        // wait until the calls are loaded, then fetch their recordings
        if (isCallsLoading) return;

        let cancelled = false;

        const fetchRecordings = async () => {
            setIsRecordingsLoading(true);

            try {
                // Get recordings for each call
                const callData = await Promise.all(calls.map((call) => call.queryRecordings()));
                const allRecordings = callData.flatMap((call) => call.recordings);

                if (!cancelled) setRecordings(allRecordings);
            } catch (error) {
                console.log("Error fetching recordings:", error);
            } finally {
                if (!cancelled) setIsRecordingsLoading(false);
            }
        }

        fetchRecordings();

        return () => {
            cancelled = true;
        };
    }, [calls, isCallsLoading]);

    if (isCallsLoading || isRecordingsLoading) return <LoaderUI />;
    
    return (
        <div className="container max-w-7xl mx-auto p-6">
            {/* HEADER SECTION */}
            <h1 className="text-3xl font-bold">Recordings</h1>
            <p className="text-muted-foreground my-1">
                {recordings.length} {recordings.length === 1 ? "Recording" : "Recordings"} available
            </p>

            {/* RECORDINGS GRID */}
            <ScrollArea className="h-[calc(100vh-12rem)] mt-3">
                {recordings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                    {recordings.map((r) => (
                        <RecordingCard key={r.end_time} recording={r} />
                    ))}
                  </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <p className="text-xl font-medium text-muted-foreground">No recordings available</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}

export default RecordingsPage;
