import { useEffect, useState } from "react";

export function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((r) => r.json())
      .then((d) => setMessage(d.message));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">UCD Pipeline UI</h1>
      <p className="text-zinc-400">{message}</p>
    </div>
  );
}
