import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

export default function Chat() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Check login on mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t || !u) {
      router.push("/login");
      return;
    }
    setToken(t);
    setUser(JSON.parse(u));
  }, [router]);

  // Fetch users list once token is set
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error);
  }, [token]);

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!selectedUser || !token || !user) return;

    async function fetchMessages() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/messages/${user.id}/${selectedUser._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error(err);
      }
    }

    fetchMessages();

    // Poll for new messages every 5 seconds (replace with sockets later)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, token, user]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender: user.id,
          receiver: selectedUser._id,
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      setNewMessage("");
      // Optimistically add message
      setMessages((msgs) => [
        ...msgs,
        { sender: user.id, receiver: selectedUser._id, content: newMessage.trim(), _id: Date.now() },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) return null; // or loading spinner

  return (
    <div className="flex h-screen">
      {/* User list */}
      <div className="w-1/4 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        {users
          .filter((u) => u._id !== user.id)
          .map((u) => (
            <div
              key={u._id}
              onClick={() => setSelectedUser(u)}
              className={`p-2 cursor-pointer rounded ${
                selectedUser?._id === u._id ? "bg-blue-300" : ""
              }`}
            >
              {u.username}
            </div>
          ))}
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 p-4">
        {selectedUser ? (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Chat with {selectedUser.username}
            </h2>
            <div className="flex-1 overflow-y-auto border p-4 rounded bg-gray-50">
              {messages.length === 0 && (
                <p className="text-gray-500">No messages yet.</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`mb-2 max-w-xs p-2 rounded ${
                    msg.sender === user.id ? "bg-blue-500 text-white self-end" : "bg-gray-300 self-start"
                  }`}
                  style={{ alignSelf: msg.sender === user.id ? "flex-end" : "flex-start" }}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded p-2"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Type a message"
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 mt-20">
            Select a user to start chatting.
          </p>
        )}
      </div>
    </div>
  );
}
