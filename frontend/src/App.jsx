import { useState } from "react";
import ZoomSession from "./components/ZoomSession";

function App() {
  const [token, setToken] = useState(null);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState(0); // 0 = Learner, 1 = Expert

  const sessionName = "session-123"; // must be SAME for both users

  const joinSession = async () => {
    const res = await fetch("http://localhost:3000/api/access-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionName, role }),
    });

    const data = await res.json();
    setToken(data.token);
    setJoined(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {!joined ? (
        <div className="bg-white p-6 rounded shadow w-96">
          <h1 className="text-2xl font-bold mb-4">Join Session</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="border p-2 w-full mb-4"
          />
          <select
            value={role}
            onChange={(e) => setRole(Number(e.target.value))}
            className="border p-2 w-full mb-4"
          >
            <option value={0}>Learner</option>
            <option value={1}>Expert</option>
          </select>
          <button
            type="button"
            onClick={joinSession}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Join
          </button>
        </div>
      ) : (
        <ZoomSession
          token={token || ""}
          sessionName={sessionName || ""}
          userName={userName || ""}
        />
      )}
    </div>
  );
}

export default App;
