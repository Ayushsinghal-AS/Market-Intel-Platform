import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { SkeletonTableRows } from "./ui/Skeleton";

const COLUMNS = [
  { key: "price", label: "Price", fmt: (v) => (v != null ? `₹${v.toLocaleString("en-IN")}` : "—") },
  { key: "change_pct", label: "1D %", fmt: (v) => (v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "—") },
  { key: "market_cap", label: "Market Cap", fmt: (v) => (v != null ? `₹${Math.round(v / 1e7).toLocaleString("en-IN")} Cr` : "—") },
  { key: "pe_ratio", label: "P/E", fmt: (v) => (v != null ? v.toFixed(2) : "—") },
  { key: "pb_ratio", label: "P/B", fmt: (v) => (v != null ? v.toFixed(2) : "—") },
  { key: "roe_pct", label: "ROE", fmt: (v) => (v != null ? `${v}%` : "—") },
  { key: "dividend_yield_pct", label: "Div. Yield", fmt: (v) => (v != null ? `${v}%` : "—") },
];

export default function PeerComparisonTable({ ticker, subject }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState({ key: "market_cap", dir: "desc" });
  const navigate = useNavigate();

  useEffect(() => {
    setData(null);
    setError(null);
    api.stockPeers(ticker).then(setData).catch((e) => setError(e.message));
  }, [ticker]);

  if (error) return null;
  if (!data) return <SkeletonTableRows rows={4} cols={7} />;

  if (data.note) {
    return <p className="text-sm text-ink-muted glass-card p-4">{data.note}</p>;
  }

  const rows = [{ ...subject, isSubject: true }, ...data.peers];
  const sorted = [...rows].sort((a, b) => {
    if (a.isSubject) return -1;
    if (b.isSubject) return 1;
    const av = a[sort.key];
    const bv = b[sort.key];
    if (av == null) return 1;
    if (bv == null) return -1;
    return sort.dir === "asc" ? av - bv : bv - av;
  });

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full text-sm">
        <thead className="bg-black/5 dark:bg-white/5 text-ink-muted text-xs uppercase">
          <tr>
            <th className="text-left px-3 py-2">Ticker</th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="text-right px-3 py-2 cursor-pointer select-none hover:text-ink-primary-light dark:hover:text-ink-primary-dark"
              >
                {col.label} {sort.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.ticker}
              onClick={() => !row.isSubject && navigate(`/stock/${row.ticker}`)}
              className={`border-t border-black/5 dark:border-white/5 ${
                row.isSubject ? "bg-series-blue-light/10 dark:bg-series-blue-dark/10 font-semibold" : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <td className="px-3 py-1.5">
                {row.ticker.replace(".NS", "")}
                {row.isSubject && <span className="text-ink-muted font-normal"> (this stock)</span>}
              </td>
              {COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-1.5 text-right tabular-nums ${
                    col.key === "change_pct" && row[col.key] != null ? (row[col.key] >= 0 ? "text-status-good" : "text-status-critical") : ""
                  }`}
                >
                  {col.fmt(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
