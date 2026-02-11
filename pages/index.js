import { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

var COLORS = {
  China: "#ef4444", Vietnam: "#22c55e", Japan: "#3b82f6",
  "South Korea": "#a78bfa", Taiwan: "#f59e0b", Germany: "#06b6d4",
  Mexico: "#f97316", Canada: "#ec4899", India: "#84cc16",
  Thailand: "#14b8a6", Indonesia: "#8b5cf6", Bangladesh: "#d946ef",
  Italy: "#0ea5e9", France: "#64748b", "United Kingdom": "#e11d48",
  Malaysia: "#facc15",
};

var FBX_LANES = {
  FBX01: { name: "China > US West Coast", short: "CN>USWC" },
  FBX03: { name: "China > US East Coast", short: "CN>USEC" },
  FBX11: { name: "China > North Europe", short: "CN>EUR" },
  FBX13: { name: "China > Mediterranean", short: "CN>MED" },
  FBX02: { name: "US West Coast > China", short: "USWC>CN" },
  FBX04: { name: "US East Coast > China", short: "USEC>CN" },
  FBX22: { name: "North Europe > US East Coast", short: "EUR>USEC" },
  FBX21: { name: "US East Coast > North Europe", short: "USEC>EUR" },
};

var FBX_COLORS = {
  FBX01: "#ef4444", FBX03: "#f97316", FBX11: "#3b82f6", FBX13: "#06b6d4",
  FBX02: "#fca5a5", FBX04: "#fdba74", FBX22: "#93c5fd", FBX21: "#67e8f9",
};

function formatB(val) {
  if (!val) return "$0";
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(1) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(0) + "M";
  return "$" + val.toLocaleString();
}

function formatKg(val) {
  if (!val) return "0";
  if (val >= 1e9) return (val / 1e9).toFixed(1) + "B kg";
  if (val >= 1e6) return (val / 1e6).toFixed(0) + "M kg";
  return val.toLocaleString() + " kg";
}

function TipTrade(props) {
  if (!props.active || !props.payload || !props.payload.length) return null;
  var metric = props.metric || "value";
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#e0e0e0", maxWidth: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{props.label}</div>
      {props.payload.filter(function(p) { return p.value !== undefined && p.value !== null; }).sort(function(a, b) { return Math.abs(b.value) - Math.abs(a.value); }).map(function(p, i) {
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
            <span style={{ color: p.color }}>{p.name}</span>
            <span>{metric === "yoy" ? (p.value >= 0 ? "+" : "") + p.value.toFixed(1) + "%" : metric === "weight" ? formatKg(p.value) : formatB(p.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TipFBX(props) {
  if (!props.active || !props.payload || !props.payload.length) return null;
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#e0e0e0", maxWidth: 280 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{props.label}</div>
      {props.payload.sort(function(a, b) { return b.value - a.value; }).map(function(p, i) {
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
            <span style={{ color: p.color }}>{p.name}</span>
            <span>${p.value.toLocaleString()}/FEU</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  var [tab, setTab] = useState("imports");
  var [metric, setMetric] = useState("value");
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [rawData, setRawData] = useState([]);
  var [fbxData, setFbxData] = useState([]);
  var [selectedCountries, setSelectedCountries] = useState(["China", "Vietnam", "Mexico", "Japan", "Germany", "South Korea"]);
  var [selectedLanes, setSelectedLanes] = useState(["FBX01", "FBX03", "FBX11", "FBX13"]);
  var [lastUpdate, setLastUpdate] = useState(null);

  var fetchTrade = useCallback(async function() {
    setLoading(true);
    setError(null);
    try {
      var res = await fetch("/api/census?type=imports&countries=all");
      if (!res.ok) throw new Error("Census API returned " + res.status);
      var json = await res.json();
      if (json.error) throw new Error(json.error);
      setRawData(json.data || []);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Trade fetch error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  var fetchFBX = useCallback(async function() {
    try {
      var res = await fetch("/api/fbx");
      if (!res.ok) return;
      var json = await res.json();
      if (json.data) setFbxData(json.data);
    } catch (e) {
      console.error("FBX fetch error:", e);
    }
  }, []);

  useEffect(function() {
    fetchTrade();
    fetchFBX();
  }, [fetchTrade, fetchFBX]);

  // Transform raw data based on selected metric
  var tradeData = useMemo(function() {
    if (!rawData.length) return [];

    // Group by month
    var byMonth = {};
    rawData.forEach(function(d) {
      if (!byMonth[d.month]) byMonth[d.month] = { month: d.month };
      byMonth[d.month][d.country] = d.totalValue;
      byMonth[d.month][d.country + "_weight"] = d.vesselWeight;
      byMonth[d.month][d.country + "_vessel"] = d.vesselValue;
    });

    var sorted = Object.values(byMonth).sort(function(a, b) {
      return a.month.localeCompare(b.month);
    });

    if (metric === "value") {
      return sorted;
    }

    if (metric === "weight") {
      return sorted.map(function(m) {
        var row = { month: m.month };
        Object.keys(COLORS).forEach(function(c) {
          if (m[c + "_weight"]) row[c] = m[c + "_weight"];
        });
        return row;
      });
    }

    if (metric === "yoy") {
      // Calculate YoY % change
      var result = [];
      for (var i = 0; i < sorted.length; i++) {
        var cur = sorted[i];
        var curMonth = cur.month.slice(5, 7);
        var curYear = parseInt(cur.month.slice(0, 4));
        var prevKey = (curYear - 1) + "-" + curMonth;
        var prev = sorted.find(function(m) { return m.month === prevKey; });
        if (!prev) continue;

        var row = { month: cur.month };
        Object.keys(COLORS).forEach(function(c) {
          if (cur[c] && prev[c] && prev[c] > 0) {
            row[c] = ((cur[c] - prev[c]) / prev[c]) * 100;
          }
        });
        result.push(row);
      }
      return result;
    }

    return sorted;
  }, [rawData, metric]);

  function toggleCountry(c) {
    setSelectedCountries(function(prev) {
      return prev.includes(c) ? prev.filter(function(x) { return x !== c; }) : prev.concat([c]);
    });
  }

  function toggleLane(l) {
    setSelectedLanes(function(prev) {
      return prev.includes(l) ? prev.filter(function(x) { return x !== l; }) : prev.concat([l]);
    });
  }

  // Bar data from latest month (absolute values)
  var allMonths = useMemo(function() {
    var byMonth = {};
    rawData.forEach(function(d) {
      if (!byMonth[d.month]) byMonth[d.month] = { month: d.month };
      byMonth[d.month][d.country] = d.totalValue;
    });
    return Object.values(byMonth).sort(function(a, b) { return a.month.localeCompare(b.month); });
  }, [rawData]);

  var latestMonth = allMonths.length > 0 ? allMonths[allMonths.length - 1] : null;
  var barData = [];
  if (latestMonth) {
    Object.keys(COLORS).forEach(function(c) {
      if (latestMonth[c]) barData.push({ country: c, value: latestMonth[c] });
    });
    barData.sort(function(a, b) { return b.value - a.value; });
  }

  var yAxisFormatter = metric === "yoy"
    ? function(v) { return (v >= 0 ? "+" : "") + v.toFixed(0) + "%"; }
    : metric === "weight"
    ? function(v) { return (v / 1e9).toFixed(1) + "B"; }
    : function(v) { return (v / 1e9).toFixed(0) + "B"; };

  var metricLabel = metric === "yoy" ? "YoY % Change" : metric === "weight" ? "Vessel Weight (kg)" : "Import Value (USD)";

  return (
    <>
      <Head>
        <title>US Trade & Cargo Monitor</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x1F6A2;</text></svg>" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #0f1629 50%, #0a0a1a 100%)", color: "#e0e0e0", fontFamily: "JetBrains Mono, SF Mono, monospace", padding: "24px 16px" }}>

        <div style={{ maxWidth: 1000, margin: "0 auto 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: error ? "#ef4444" : loading ? "#f59e0b" : "#22c55e", boxShadow: "0 0 8px " + (error ? "#ef4444" : loading ? "#f59e0b" : "#22c55e"), animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: 1.5, textTransform: "uppercase" }}>
              {loading ? "Fetching from Census Bureau..." : error ? "Error: " + error : "Live - Latest: " + (allMonths.length > 0 ? allMonths[allMonths.length - 1].month : "")}
            </span>
            {lastUpdate && <span style={{ fontSize: 10, color: "#374151" }}>- updated {lastUpdate.toLocaleTimeString()}</span>}
            <button onClick={function() { fetchTrade(); fetchFBX(); }} disabled={loading} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 4, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316", cursor: loading ? "wait" : "pointer", fontSize: 11, fontFamily: "inherit" }}>
              {loading ? "..." : "Refresh"}
            </button>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            US Trade & Cargo Monitor
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>
            Bilateral trade flows + container freight rates - Census Bureau + Freightos Baltic Index
          </p>
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { k: "imports", l: "US Imports by Country" },
            { k: "fbx", l: "Container Freight Rates" },
            { k: "ranking", l: "Top Partners" },
          ].map(function(t) {
            return (
              <button key={t.k} onClick={function() { setTab(t.k); }} style={{
                padding: "7px 14px", borderRadius: 6, border: "none",
                background: tab === t.k ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                color: tab === t.k ? "#f97316" : "#6b7280",
                cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit",
              }}>{t.l}</button>
            );
          })}
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 14px" }}>

          {tab === "imports" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>US Imports by Country of Origin</h2>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { k: "value", l: "Value ($)" },
                    { k: "weight", l: "Weight (kg)" },
                    { k: "yoy", l: "YoY %" },
                  ].map(function(m) {
                    return (
                      <button key={m.k} onClick={function() { setMetric(m.k); }} style={{
                        padding: "3px 10px", borderRadius: 4, border: "none",
                        background: metric === m.k ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.04)",
                        color: metric === m.k ? "#f97316" : "#6b7280",
                        cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit",
                      }}>{m.l}</button>
                    );
                  })}
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px" }}>
                {metricLabel} - Monthly - Source: US Census Bureau - ~35 day lag
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                {Object.keys(COLORS).map(function(c) {
                  var active = selectedCountries.includes(c);
                  return (
                    <button key={c} onClick={function() { toggleCountry(c); }} style={{
                      padding: "3px 8px", borderRadius: 4,
                      border: "1px solid " + (active ? COLORS[c] + "80" : "rgba(255,255,255,0.08)"),
                      background: active ? COLORS[c] + "20" : "transparent",
                      color: active ? COLORS[c] : "#4b5563",
                      cursor: "pointer", fontSize: 10, fontFamily: "inherit",
                    }}>{c}</button>
                  );
                })}
              </div>
              {tradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={tradeData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} interval={metric === "yoy" ? 1 : 2} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={yAxisFormatter} />
                    <Tooltip content={function(p) { return TipTrade({...p, metric: metric}); }} />
                    {metric === "yoy" && <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />}
                    {selectedCountries.map(function(c) {
                      return <Line key={c} type="monotone" dataKey={c} stroke={COLORS[c] || "#999"} strokeWidth={2} dot={false} name={c} connectNulls={true} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
                  {loading ? "Loading 36 months of trade data from Census Bureau... (may take 60-90 sec)" : "No data available"}
                </div>
              )}
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.12)", fontSize: 11, color: "#9ca3af" }}>
                {metric === "yoy"
                  ? "Year-over-year % change vs same month prior year. Positive = growth. Compare with SONAR IOTI for TEU volume trends."
                  : metric === "weight"
                  ? "Vessel shipping weight in kg. Best proxy for physical volume (TEU) from free public data. Does not include air freight."
                  : "General Imports (CIF basis). All transport modes. Click country buttons to toggle."
                }
              </div>
            </div>
          )}

          {tab === "fbx" && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>Container Freight Rates (Freightos Baltic Index)</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px" }}>
                Spot rate per 40ft container (FEU) - Weekly - $/FEU
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                {Object.entries(FBX_LANES).map(function(entry) {
                  var code = entry[0], lane = entry[1];
                  var active = selectedLanes.includes(code);
                  return (
                    <button key={code} onClick={function() { toggleLane(code); }} style={{
                      padding: "3px 8px", borderRadius: 4,
                      border: "1px solid " + (active ? FBX_COLORS[code] + "80" : "rgba(255,255,255,0.08)"),
                      background: active ? FBX_COLORS[code] + "20" : "transparent",
                      color: active ? FBX_COLORS[code] : "#4b5563",
                      cursor: "pointer", fontSize: 10, fontFamily: "inherit",
                    }}>{lane.short}</button>
                  );
                })}
              </div>
              {fbxData.length > 0 ? (
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={fbxData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={function(v) { return "$" + (v / 1000).toFixed(1) + "k"; }} />
                    <Tooltip content={TipFBX} />
                    {selectedLanes.map(function(code) {
                      return <Line key={code} type="monotone" dataKey={code} stroke={FBX_COLORS[code] || "#999"} strokeWidth={2} dot={false} name={FBX_LANES[code].short} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Loading FBX data...</div>
              )}
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.12)", fontSize: 11, color: "#9ca3af" }}>
                FBX = Freightos Baltic Index. Spot rates for 40ft containers. Higher = tighter capacity / demand. Note: current data is approximate placeholder.
              </div>
            </div>
          )}

          {tab === "ranking" && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>Top US Import Partners</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 16px" }}>
                {latestMonth ? "Latest: " + latestMonth.month : "Loading..."} - Ranked by total import value
              </p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(400, barData.length * 36)}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={function(v) { return (v / 1e9).toFixed(0) + "B"; }} />
                    <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: "#e0e0e0" }} axisLine={false} tickLine={false} width={75} />
                    <Tooltip formatter={function(v) { return formatB(v); }} contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map(function(entry, i) {
                        return <Cell key={i} fill={COLORS[entry.country] || "#6b7280"} opacity={0.8} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Loading...</div>
              )}
            </div>
          )}
        </div>

        <div style={{ maxWidth: 1000, margin: "20px auto 0", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "14px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px", color: "#f97316" }}>Data Sources</h3>
          <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.8 }}>
            <div><strong>US Imports/Exports</strong>: Census Bureau International Trade API - Monthly - ~35 day lag - api.census.gov</div>
            <div><strong>Vessel Weight</strong>: VES_WGT_MO field - shipping weight in kg via ocean vessel - best free proxy for TEU volume</div>
            <div><strong>Container Freight Rates</strong>: Freightos Baltic Index (FBX) - Weekly - 12 trade lanes - fbx.freightos.com</div>
            <div><strong>YoY %</strong>: Calculated as (current month - same month last year) / same month last year * 100</div>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: "12px auto 0", textAlign: "center" }}>
          <a href="https://fed.rigatoni.ai" style={{ fontSize: 11, color: "#4b5563", textDecoration: "none" }}>
            Fed Net Liquidity Monitor
          </a>
        </div>

        <style jsx global>{"\
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }\
          * { margin: 0; padding: 0; box-sizing: border-box; }\
          body { background: #0a0a1a; }\
        "}</style>
      </div>
    </>
  );
}
