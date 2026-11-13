import { Call, CallingState } from "@stream-io/video-react-sdk";

/**
 * Keep a reference to every stream handed out by getUserMedia, so we can stop
 * the ones the Stream SDK lost track of (e.g. a getUserMedia request that
 * resolved after the call state was already cleaned up). Without this the
 * camera indicator stays on until the page is refreshed.
 */
const openedStreams = new Set<MediaStream>();

if (
  typeof navigator !== "undefined" &&
  navigator.mediaDevices?.getUserMedia &&
  !(navigator.mediaDevices as any).__streamsTracked
) {
  const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = async (constraints) => {
    const stream = await original(constraints);
    openedStreams.add(stream);
    return stream;
  };

  (navigator.mediaDevices as any).__streamsTracked = true;
}

const stopAllOpenedTracks = () => {
  openedStreams.forEach((stream) => {
    stream.getTracks().forEach((track) => {
      if (track.readyState === "live") {
        console.warn(
          `[releaseCallDevices] stopping leaked ${track.kind} track: ${track.label}`
        );
        track.stop();
      }
    });
  });
  openedStreams.clear();
};

/**
 * Leaves the call (if needed) and makes sure the camera and microphone are
 * fully released, so the browser's recording indicator goes away.
 */
export async function releaseCallDevices(call: Call) {
  const devices = [call.camera, call.microphone];

  // a pending enable() (getUserMedia in flight) must finish before we can stop it
  await Promise.all(
    devices.map((device) => device.statusChangeSettled().catch(() => {}))
  );

  if (call.state.callingState !== CallingState.LEFT) {
    await call.leave().catch(() => {});
  }

  await Promise.all(devices.map((device) => device.disable(true).catch(() => {})));

  // last resort: stop anything that is still live
  stopAllOpenedTracks();
}
