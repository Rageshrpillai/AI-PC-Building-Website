// src/pages/Chatpage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navabar from "../components/Navabar";
import Sidebar from "../components/Sidebar";

// --- Icon Components (placeholders, ensure you have these defined) ---
const IconSend = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
    />
  </svg>
);
const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex-shrink-0"></div>
);
const AiAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-sm text-white">
    BB
  </div>
);

// This is placeholder data for the sidebar, as in your original file.
const pastChats = [
  { id: "1", title: "Budget Gaming Rig under $800" },
  { id: "2", title: "Upgrade for 1440p Gaming" },
  { id: "3", title: "Video Editing Workstation" },
];

export default function ChatPage() {
  const location = useLocation();
  const [currentMessage, setCurrentMessage] = useState(location.state?.query || "");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatMessagesEndRef = useRef(null);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setSidebarOpen(mq.matches);
    const handleResize = (e) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handleResize);
    return () => mq.removeEventListener("change", handleResize);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMsg = {
      id: "user-" + Date.now(),
      sender: "user",
      text: currentMessage,
    };
    setChatHistory((prevHistory) => [...prevHistory, userMsg]);
    const messageToApi = currentMessage;
    setCurrentMessage("");
    setIsLoadingAiResponse(true);

    try {
      // For a new build request from this page, we send the "newBuild" requestType
      const res = await fetch("/api/buildbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToApi,
          requestType: "newBuild",
        }),
      });

      setIsLoadingAiResponse(false);

      const responseData = await res.json();

      if (!res.ok) {
        console.error("[ChatPage] API Error Response:", responseData);
        // Use the 'reply' or 'error' field from the structured error response
        const errorMessage =
          responseData.reply ||
          responseData.error ||
          `Failed with status: ${res.status}`;
        throw new Error(errorMessage);
      }

      console.log("[ChatPage] Received AI response data:", responseData);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: responseData.reply, // The main text reply
          data: responseData, // Store the full data object (which has parts, totalCost, etc.)
        },
      ]);
    } catch (err) {
      setIsLoadingAiResponse(false);
      console.error("[ChatPage] Error in handleSendMessage:", err);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          id: "err-" + Date.now(),
          sender: "ai",
          text: `Sorry, BuildBot encountered an error: ${err.message}`,
        },
      ]);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen bg-[#100C16]">
      <Navabar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar
          isOpen={sidebarOpen}
          onNewChat={handleNewChat}
          chats={pastChats}
          onSelectChat={(chatId) => {
            console.log("Selected chat from sidebar:", chatId);
          }}
          onToggle={handleToggleSidebar}
        />
        <main className="flex-1 bg-[#1A161F] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {chatHistory.length === 0 && !isLoadingAiResponse && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 mb-4 flex items-center justify-center font-bold text-2xl text-white">
                  BB
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-white">
                  BuildBot
                </h2>
                <p className="text-sm">
                  How can I help you plan your PC today?
                </p>
              </div>
            )}
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 w-full animate-fadeIn ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && <AiAvatar />}
                <div
                  className={`max-w-[85%] md:max-w-[75%] p-3.5 rounded-xl shadow-md text-white ${
                    msg.sender === "user"
                      ? "bg-purple-600 rounded-br-md"
                      : "bg-[#2A2A2A] rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.text}
                  </p>

                  {/* *** CORRECTED: Logic to display build details from the new JSON structure *** */}
                  {msg.sender === "ai" && msg.data?.parts?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600/50 space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {msg.data.buildName || "Suggested Components:"}
                      </h4>
                      <ul className="space-y-1 text-xs text-gray-300">
                        {msg.data.parts.map((partItem, index) => {
                          // Check if the part item has the new structure
                          const partDetail = partItem.selectedPart || partItem;
                          if (!partDetail.name) return null; // Skip if part detail is malformed

                          return (
                            <li
                              key={`${partDetail.id}-${index}`}
                              className="flex justify-between items-center"
                            >
                              <span className="truncate pr-2">
                                {partDetail.name}{" "}
                                <span className="text-gray-500">
                                  ({partDetail.category})
                                </span>
                              </span>
                              <span className="text-purple-400 font-medium whitespace-nowrap">
                                $
                                {Number(partDetail.price)
                                  ? Number(partDetail.price).toFixed(2)
                                  : "N/A"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {typeof msg.data.totalCost === "number" &&
                        msg.data.totalCost > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700/30">
                            <p className="flex justify-between font-semibold text-sm text-gray-100">
                              <span>Estimated Total:</span>
                              <span className="text-purple-300">
                                ${msg.data.totalCost.toFixed(2)}
                              </span>
                            </p>
                          </div>
                        )}
                      {msg.data.compatibilityNotes &&
                        msg.data.compatibilityNotes.length > 0 && (
                          <div className="mt-2 text-xs text-gray-400 space-y-1">
                            <p className="font-semibold mb-0.5">Notes:</p>
                            {msg.data.compatibilityNotes.map((note, idx) => (
                              <p key={idx}>- {note}</p>
                            ))}
                          </div>
                        )}
                      {msg.data.deepLink && (
                        <div className="mt-3">
                          <a
                            href={msg.data.deepLink}
                            className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold"
                          >
                            View or Customize This Build
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {/* *** END OF CORRECTION *** */}
                </div>
                {msg.sender === "user" && <UserAvatar />}
              </div>
            ))}
            {isLoadingAiResponse && (
              <div className="flex items-start gap-3 justify-start animate-fadeIn">
                <AiAvatar />
                <div className="p-3 rounded-lg bg-[#2A2A2A] text-gray-200 shadow-md">
                  <div className="flex space-x-1 items-center">
                    <span className="text-sm italic">BuildBot is thinking</span>
                    <span className="animate-pulse delay-100 text-xl">.</span>
                    <span className="animate-pulse delay-200 text-xl">.</span>
                    <span className="animate-pulse delay-300 text-xl">.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          <div className="p-4 bg-[#1A161F] border-t border-gray-800/50">
            <div className="max-w-3xl w-full mx-auto">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center p-1.5 bg-[#2A2A2A] rounded-xl border border-gray-700 focus-within:border-purple-500 transition-colors"
              >
                <input
                  className="flex-1 px-4 py-2.5 bg-transparent placeholder-gray-400/80 text-gray-100 focus:outline-none text-sm"
                  placeholder="Message BuildBot…"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  disabled={isLoadingAiResponse}
                />
                <button
                  type="submit"
                  disabled={isLoadingAiResponse || !currentMessage.trim()}
                  className="p-2.5 ml-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <IconSend />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
