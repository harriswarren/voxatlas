import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { askVoxAtlas } from "../../api/insights";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AskVoxAtlas() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const { answer } = await askVoxAtlas(question);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that request. Make sure the Llama API key is configured." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <Bot size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Ask VoxAtlas anything</p>
            <p className="text-sm mt-1">Query language data using natural language</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Which African languages have the worst CER?",
                "How many languages achieve under 5% CER?",
                "What language families perform best?",
                "Compare CER across continents",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#0668E1] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about language data..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#0668E1] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
