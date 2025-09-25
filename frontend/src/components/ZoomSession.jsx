import { useEffect, useRef, useState } from "react";
import ZoomVideo from "@zoom/videosdk";

export default function ZoomSession({ token, sessionName, userName }) {
  const videoRef = useRef(null);
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  // Validate required parameters
  const validateParams = () => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      throw new Error("Token is required and must be a non-empty string");
    }
    if (
      !sessionName ||
      typeof sessionName !== "string" ||
      sessionName.trim() === ""
    ) {
      throw new Error(
        "Session name is required and must be a non-empty string"
      );
    }
    if (sessionName.length > 200) {
      throw new Error("Session name must be 200 characters or less");
    }
    if (!userName || typeof userName !== "string" || userName.trim() === "") {
      throw new Error("User name is required and must be a non-empty string");
    }
  };

  useEffect(() => {
    let zoomClient;
    let stream;

    const initZoom = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Validate parameters first
        validateParams();

        // Debug: Log the parameters being sent
        // console.log('Joining session with parameters:', {
        //   token: token ? `${token.substring(0, 20)}...` : 'null',
        //   tokenLength: token ? token.length : 0,
        //   sessionName: sessionName,
        //   sessionNameLength: sessionName ? sessionName.length : 0,
        //   userName: userName,
        //   userNameLength: userName ? userName.length : 0
        // });

        // // Additional debug: Check if any parameter contains unexpected data
        // console.log('Parameter types and values:', {
        //   tokenType: typeof token,
        //   sessionNameType: typeof sessionName,
        //   userNameType: typeof userName,
        //   tokenValue: token,
        //   sessionNameValue: sessionName,
        //   userNameValue: userName
        // });

        // Create and initialize client
        zoomClient = ZoomVideo.createClient();
        setClient(zoomClient);

        await zoomClient.init("en-US", "Global", { patchJsMedia: true });

        // // Join session - ensure correct parameter order: token, topic, userName
        // console.log('About to call zoomClient.join with:', {
        //   param1: 'token',
        //   param2: 'topic (sessionName)',
        //   param3: 'userName'
        // });

        await zoomClient.join(sessionName, token, userName);

        stream = zoomClient.getMediaStream();

        // Start video for self
        await stream.startVideo({
          renderVideo: videoRef.current,
          width: 640,
          height: 480,
        });

        // Start audio
        try {
          await stream.startAudio();
        } catch (audioError) {
          console.warn("Audio start failed:", audioError);
          setIsAudioOn(false);
        }

        // Handle when other participants join
        zoomClient.on("user-added", async (payload) => {
          console.log("User joined:", payload);

          // Update participants list
          setParticipants((prev) => [...prev, payload[0]]);

          // Create container for remote video
          const container = document.createElement("video");
          container.id = `video-${payload[0].userId}`;
          container.className = "w-full h-full object-cover";
          container.autoplay = true;
          container.playsInline = true;

          const wrapper = document.createElement("div");
          wrapper.id = `wrapper-${payload[0].userId}`;
          wrapper.className = "relative bg-gray-800 rounded-lg overflow-hidden";
          wrapper.style.width = "640px";
          wrapper.style.height = "480px";

          // Add name label
          const label = document.createElement("div");
          label.className =
            "absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm";
          label.textContent = payload[0].displayName || "Participant";

          wrapper.appendChild(container);
          wrapper.appendChild(label);
          document.getElementById("remote-videos").appendChild(wrapper);

          // Wait a bit for the stream to be ready
          setTimeout(async () => {
            try {
              await stream.renderVideo(
                container,
                payload[0].userId,
                640,
                480,
                0,
                0,
                3
              );
            } catch (renderError) {
              console.error("Failed to render remote video:", renderError);
            }
          }, 1000);
        });

        // Handle when participants leave
        zoomClient.on("user-removed", (payload) => {
          console.log("User left:", payload);

          // Update participants list
          setParticipants((prev) =>
            prev.filter((p) => p.userId !== payload[0].userId)
          );

          // Remove video element
          const wrapper = document.getElementById(
            `wrapper-${payload[0].userId}`
          );
          if (wrapper) {
            wrapper.remove();
          }
        });

        // Handle connection state changes
        zoomClient.on("connection-change", (payload) => {
          console.log("Connection state changed:", payload.state);
          if (payload.state === "Closed") {
            setError("Connection lost. Please rejoin the session.");
          }
        });

        setIsConnecting(false);
      } catch (error) {
        console.error("Failed to initialize Zoom:", error);
        setError(error.message || "Failed to connect to session");
        setIsConnecting(false);
      }
    };

    initZoom();

    // Cleanup function
    return () => {
      if (stream) {
        stream.stopVideo().catch(console.error);
        stream.stopAudio().catch(console.error);
      }
      if (zoomClient) {
        zoomClient.leave().catch(console.error);
      }
    };
  }, [token, sessionName, userName]);

  // Toggle video
  const toggleVideo = async () => {
    if (!client) return;
    const stream = client.getMediaStream();

    try {
      if (isVideoOn) {
        await stream.stopVideo();
        setIsVideoOn(false);
      } else {
        await stream.startVideo({
          renderVideo: videoRef.current,
          width: 640,
          height: 480,
        });
        setIsVideoOn(true);
      }
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (!client) return;
    const stream = client.getMediaStream();

    try {
      if (isAudioOn) {
        await stream.stopAudio();
        setIsAudioOn(false);
      } else {
        await stream.startAudio();
        setIsAudioOn(true);
      }
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  };

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Connection Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zoom Session</h2>
          <p className="text-gray-600">
            Session: {sessionName} | User: {userName}
          </p>
          {participants.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {participants.length} other participant(s) in session
            </p>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          <button
            onClick={toggleVideo}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${
              isVideoOn
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
            disabled={isConnecting}
          >
            {isVideoOn ? "📹 Video On" : "📹 Video Off"}
          </button>
          <button
            onClick={toggleAudio}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${
              isAudioOn
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
            disabled={isConnecting}
          >
            {isAudioOn ? "🎤 Mute" : "🎤 Unmute"}
          </button>
          <button
            onClick={() => {
              if (client) {
                client.leave();
                window.location.reload();
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Leave Session
          </button>
        </div>
      </div>

      {isConnecting && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">Connecting to session...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Local video */}
        <div
          className="relative bg-gray-800 rounded-lg overflow-hidden"
          style={{ width: "640px", height: "480px" }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You ({userName})
          </div>
        </div>

        {/* Remote videos container */}
        <div id="remote-videos" className="grid grid-cols-1 gap-4">
          {/* Remote videos will be added here dynamically */}
        </div>
      </div>
    </div>
  );
}
