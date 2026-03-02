import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Analytics from "./pages/Analytics";
import Explorer from "./pages/Explorer";
import Transcribe from "./pages/Transcribe";
import Compare from "./pages/Compare";
import Reports from "./pages/Reports";
import Ask from "./pages/Ask";
import Benchmarks from "./pages/Benchmarks";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Analytics />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/transcribe" element={<Transcribe />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
