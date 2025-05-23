"use client";

import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

export default function Home() {
  const [chatId] = useState("chat123"); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.emit("join-room", chatId);

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receive-message");
  }, [chatId]);

  const sendMessage = () => {
    const message = { chatId, sender: "User", content: input };
    socket.emit("send-message", message);
    setMessages((prev) => [...prev, message]);
    setInput("");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">NextTalk</h1>
      <div className="border p-2 h-64 overflow-y-scroll">
        {messages.map((msg, i) => (
          <p key={i}><strong>{msg.sender}</strong>: {msg.content}</p>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} className="border p-1" />
      <button onClick={sendMessage} className="ml-2 bg-blue-500 text-white px-2 py-1">Send</button>
    </div>
  );
}
