import { useEffect, useRef, useState } from "react";
import ZoomVideo from "@zoom/videosdk";

export default function ZoomSession({ token, sessionName, userName }) {
  const videoRef = useRef(null);
  const [client, setClient] = useState(null);

  console.log(client, "CLIENT");

  useEffect(() => {
    let zoomClient;

    const initZoom = async () => {
      zoomClient = ZoomVideo.createClient();
      setClient(zoomClient);

      await zoomClient.init("en-US", "CDN");
      await zoomClient.join(token, sessionName, userName);

      const stream = zoomClient.getMediaStream();

      // render self
      stream.startVideo({
        videoElement: videoRef.current,
        width: 900,
        height: 900,
      });

      // when other participant joins, render them too
      zoomClient.on("user-added", async (user) => {
        const container = document.createElement("div");
        container.className = "w-[900px] h-[900px] border rounded mt-4";
        document.getElementById("remote-videos").appendChild(container);

        await stream.renderVideo(container, user.userId, 400, 300, 0);
      });
    };

    initZoom();

    return () => {
      if (zoomClient) {
        zoomClient.leave();
      }
    };
  }, [token, sessionName, userName]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Zoom Session</h2>
      <div className="flex flex-col space-y-4">
        <video ref={videoRef} autoPlay playsInline className="border rounded" />
        <div id="remote-videos" className="flex flex-wrap gap-4"></div>
      </div>
    </div>
  );
}
