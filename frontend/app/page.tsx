"use client";

import { useState, useEffect } from "react";

type Message = {
  role: string;
  content: string;
};

type Conversation = {
  id: number;
  title: string;
  messages: Message[];
};

export default function Home() {

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const [question, setQuestion] = useState("");



  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      title: "New Chat",
      messages: []
    }
  ]);

  const [currentChat, setCurrentChat] = useState(0);


  // Tell React the page has mounted
  useEffect(() => {

    setMounted(true);

  }, []);


  // Load chat history after mounting
  useEffect(() => {

    if (!mounted) return;

    const saved = localStorage.getItem(
      "enterprise-chat-history"
    );

    if (saved) {

      setConversations(JSON.parse(saved));

      setCurrentChat(0);

    }

  }, [mounted]);


  // Save chat history
  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "enterprise-chat-history",
      JSON.stringify(conversations)
    );

  }, [mounted, conversations]);



  function createNewChat() {

    const newConversation: Conversation = {
      id: Date.now(),
      title: "New Chat",
      messages: []
    };

    setConversations(prev => [
      ...prev,
      newConversation
    ]);

    setCurrentChat(conversations.length);
  }

  function deleteConversation(indexToDelete: number) {

    const updated = conversations.filter(
      (_, index) => index !== indexToDelete
    );

    if (updated.length === 0) {

      const defaultChat = [
        {
          id: 1,
          title: "New Chat",
          messages: []
        }
      ];

      setConversations(defaultChat);
      setCurrentChat(0);

      return;
    }

    setConversations(updated);

    if (currentChat >= updated.length) {
      setCurrentChat(updated.length - 1);
    }
  }

  function clearHistory() {

    localStorage.removeItem(
      "enterprise-chat-history"
    );

    setConversations([
      {
        id: 1,
        title: "New Chat",
        messages: []
      }
    ]);

    setCurrentChat(0);
  }

  async function handleSend() {

    if (!question.trim()) return;

    const currentQuestion = question;

    setQuestion("");

    setLoading(true);

    setConversations(prev => {

      const updated = [...prev];

      updated[currentChat] = {
        ...updated[currentChat],
        title:
          updated[currentChat].messages.length === 0
            ? currentQuestion
            : updated[currentChat].title,
        messages: [
          ...updated[currentChat].messages,
          {
            role: "user",
            content: currentQuestion
          }
        ]
      };

      return updated;
    });

    try {

      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: "POST",

          // Tell the backend we are sending JSON
          headers: {
            "Content-Type": "application/json"
          },

          // Convert the question into JSON format
          body: JSON.stringify({
            question: currentQuestion
          })
        }
      );

      const data = await response.json();

      setLoading(false);

      setConversations(prev => {

        const updated = [...prev];

        updated[currentChat] = {
          ...updated[currentChat],
          messages: [
            ...updated[currentChat].messages,
            {
              role: "assistant",
              content: data.answer
            }
          ]
        };

        return updated;
      });

    } catch {

      setLoading(false);

      setConversations(prev => {

        const updated = [...prev];

        updated[currentChat] = {
          ...updated[currentChat],
          messages: [
            ...updated[currentChat].messages,
            {
              role: "assistant",
              content: "Error connecting to backend."
            }
          ]
        };

        return updated;
      });

    }
  }
  if (!mounted) {
    return null;
  }

  return (

    <main className="flex h-screen bg-gray-100">

      {/* Sidebar */}

      <div className="w-72 bg-gray-900 text-white p-4">

        <button
          onClick={createNewChat}
          className="w-full bg-blue-600 p-2 rounded mb-3"
        >
          + New Chat
        </button>

        <button
          onClick={clearHistory}
          className="w-full bg-red-600 p-2 rounded mb-4"
        >
          Clear History
        </button>

        {conversations.map((conversation, index) => (

          <div
            key={conversation.id}
            className={`flex items-center rounded mb-2 ${
              currentChat === index
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >

            <button
              onClick={() => setCurrentChat(index)}
              className="flex-1 text-left p-2 truncate"
            >
              {conversation.title}
            </button>

            <button
              onClick={() => {

                if (
                  confirm("Delete this conversation?")
                ) {
                  deleteConversation(index);
                }

              }}
              className="px-3 text-red-400 hover:text-red-200"
            >
              🗑️
            </button>

          </div>

        ))}

      </div>

      {/* Chat Area */}

      <div className="flex flex-col flex-1">

        <div className="bg-blue-600 text-white text-xl font-bold p-4">
          Enterprise Knowledge Assistant
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {conversations[currentChat]?.messages.map(
            (message, index) => (

              <div
                key={index}
                className={`flex mb-4 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-3xl rounded-lg shadow p-4 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >

                  <p className="whitespace-pre-wrap">
                    {message.content}
                  </p>

                </div>

              </div>

            )
          )}

        </div>

        <div className="p-4 border-t bg-white flex gap-2">

          <input
            disabled={loading}
            className="flex-1 border rounded-lg p-3"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
          />

          <button
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={handleSend}
          >
            {loading ? "Thinking..." : "Send"}
          </button>

        </div>

      </div>

    </main>

  );
}
