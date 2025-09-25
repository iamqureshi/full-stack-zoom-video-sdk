import { useState } from "react";
import ZoomSession from "./components/ZoomSession";

function App() {
  const [token, setToken] = useState(null);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState(0); // 0 = Learner/Participant, 1 = Expert/Host
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sessionName = "session-123"; // Must be SAME for both users

  const joinSession = async () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Call your JWT server (update URL to match your server)
      const res = await fetch("http://localhost:3000/api/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: sessionName,
          role: role,
          sessionKey: "", // Optional session password
          userIdentity: `user-${Date.now()}`, // Unique user identity
          expirationSeconds: 3600, // 1 hour
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get token');
      }

      const data = await res.json();
      
      // The JWT server returns 'signature', not 'token'
      setToken(data.signature);
      setJoined(true);
    } catch (err) {
      console.error("Failed to join session:", err);
      setError(err.message || "Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  const leaveSession = () => {
    setToken(null);
    setJoined(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {!joined ? (
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
            Join Video Session
          </h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Learner (Participant)</option>
                <option value={1}>Expert (Host)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={joinSession}
              disabled={loading || !userName.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md w-full font-medium transition-colors"
            >
              {loading ? "Joining..." : "Join Session"}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p><strong>Session:</strong> {sessionName}</p>
            <p>Make sure your JWT server is running on port 3000</p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <ZoomSession
            token={token || ""}
            sessionName={sessionName || ""}
            userName={userName || ""}
            onLeave={leaveSession}
          />
        </div>
      )}
    </div>
  );
}

export default App;