import { useState, useEffect } from "react";
import { Send, Bot, User, Info } from "lucide-react";
import { askVoxAtlas, getProviderInfo } from "../../api/insights";
import type { ProviderInfo } from "../../api/insights";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AskVoxAtlas() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);

  useEffect(() => {
    getProviderInfo().then(setProvider).catch(() => {});
  }, []);

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
        {
          role: "assistant",
          content: "Sorry, I couldn't process that request. Make sure an LLM API key is configured in your .env file (OPENAI_API_KEY, ANTHROPIC_API_KEY, or LLAMA_API_KEY).",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Provider status banner */}
        {provider && !provider.available && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 mb-1">No LLM Provider Configured</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Add one of these API keys to your <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code> file:
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <div><code className="bg-amber-100 px-2 py-1 rounded text-amber-800">OPENAI_API_KEY=sk-...</code> <span className="text-amber-600">for GPT-4o</span></div>
                  <div><code className="bg-amber-100 px-2 py-1 rounded text-amber-800">ANTHROPIC_API_KEY=sk-ant-...</code> <span className="text-amber-600">for Claude</span></div>
                  <div><code className="bg-amber-100 px-2 py-1 rounded text-amber-800">LLAMA_API_KEY=...</code> <span className="text-amber-600">for Meta Llama</span></div>
                </div>
                <p className="text-xs text-amber-700 mt-2">Then restart the backend. The provider is auto-detected from whichever key is present.</p>
              </div>
            </div>
          </div>
        )}

        {provider && provider.available && messages.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Powered by {provider.provider_name} ({provider.model})
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
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
