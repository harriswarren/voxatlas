import Header from "../components/layout/Header";
import AskVoxAtlas from "../components/insights/AskVoxAtlas";

export default function Ask() {
  return (
    <div className="flex flex-col h-screen">
      <Header title="Ask VoxAtlas" subtitle="Query language data using natural language — powered by OpenAI, Claude, or Llama" />
      <div className="flex-1 overflow-hidden">
        <AskVoxAtlas />
      </div>
    </div>
  );
}
