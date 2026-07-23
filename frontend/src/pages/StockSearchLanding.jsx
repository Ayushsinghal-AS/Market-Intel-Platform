import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StockSearchLanding() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/stock/${query.trim()}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto pt-24 text-center space-y-4">
      <h1 className="text-xl font-bold">Find a stock</h1>
      <p className="text-sm text-ink-muted">
        Use the search bar in the header, or enter a ticker/company name below (e.g. RELIANCE.NS, Infosys).
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ticker or company name"
          className="flex-1 rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" className="text-sm px-4 py-2 rounded bg-series-blue-light dark:bg-series-blue-dark text-white">
          Go
        </button>
      </form>
    </div>
  );
}
