import { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, ReferenceArea
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
  var m = props.metric || "value";
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#e0e0e0", maxWidth: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{props.label}</div>
      {props.payload.filter(function(p) { return p.value !== undefined && p.value !== null; }).sort(function(a, b) { return Math.abs(b.value) - Math.abs(a.value); }).map(function(p, i) {
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
            <span style={{ color: p.color }}>{p.name}</span>
            <span>{m === "yoy" ? (p.value >= 0 ? "+" : "") + p.value.toFixed(1) + "%" : m === "weight" ? formatKg(p.value) : formatB(p.value)}</span>
          </div>
        );
      })}
      <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4 }}>Click to set comparison point</div>
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
      <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4 }}>Click to set comparison point</div>
    </div>
  );
}

// Delta comparison banner
function DeltaBanner(props) {
  var ptA = props.ptA;
  var ptB = props.ptB;
  var dataKey = props.dataKey;
  var onClear = props.onClear;
  var m = props.metric || "value";

  if (!ptA || !ptB) return null;

  var valA = ptA[dataKey];
  var valB = ptB[dataKey];
  if (valA === undefined || valB === undefined || valA === null || valB === null) return null;

  var dateA = ptA.month || ptA.date;
  var dateB = ptB.month || ptB.date;
  var diff = valB - valA;
  var pct = valA !== 0 ? ((valB - valA) / Math.abs(valA)) * 100 : 0;
  var isUp = diff >= 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", marginBottom: 12, borderRadius: 8,
      background: isUp ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      border: "1px solid " + (isUp ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"),
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11, color: "#9ca3af" }}>{dateA}</span>
      <span style={{ fontSize: 11, color: "#4b5563" }}>→</span>
      <span style={{ fontSize: 11, color: "#9ca3af" }}>{dateB}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: isUp ? "#22c55e" : "#ef4444" }}>
        {isUp ? "+" : ""}{pct.toFixed(2)}%
      </span>
      <span style={{ fontSize: 11, color: isUp ? "#22c55e" : "#ef4444" }}>
        ({isUp ? "+" : ""}{m === "yoy" ? diff.toFixed(1) + "pp" : m === "weight" ? formatKg(diff) : formatB(diff)})
      </span>
      <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{dataKey}</span>
      <button onClick={onClear} style={{
        marginLeft: "auto", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)", color: "#6b7280", cursor: "pointer", fontSize: 10, fontFamily: "inherit",
      }}>Clear</button>
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
  // Compare state
  var [compareA, setCompareA] = useState(null);
  var [compareB, setCompareB] = useState(null);
  var [compareKey, setCompareKey] = useState(null);

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
    } catch (e) { console.error("FBX fetch error:", e); }
  }, []);

  useEffect(function() { fetchTrade(); fetchFBX(); }, [fetchTrade, fetchFBX]);

  var tradeData = useMemo(function() {
    if (!rawData.length) return [];
    var byMonth = {};
    rawData.forEach(function(d) {
      if (!byMonth[d.month]) byMonth[d.month] = { month: d.month };
      byMonth[d.month][d.country] = d.totalValue;
      byMonth[d.month][d.country + "_weight"] = d.vesselWeight;
    });
    var sorted = Object.values(byMonth).sort(function(a, b) { return a.month.localeCompare(b.month); });
    if (metric === "weight") {
      return sorted.map(function(m) {
        var row = { month: m.month };
        Object.keys(COLORS).forEach(function(c) { if (m[c + "_weight"]) row[c] = m[c + "_weight"]; });
        return row;
      });
    }
    if (metric === "yoy") {
      var result = [];
      for (var i = 0; i < sorted.length; i++) {
        var cur = sorted[i];
        var prevKey = (parseInt(cur.month.slice(0, 4)) - 1) + cur.month.slice(4);
        var prev = sorted.find(function(m) { return m.month === prevKey; });
        if (!prev) continue;
        var row = { month: cur.month };
        Object.keys(COLORS).forEach(function(c) {
          if (cur[c] && prev[c] && prev[c] > 0) row[c] = ((cur[c] - prev[c]) / prev[c]) * 100;
        });
        result.push(row);
      }
      return result;
    }
    return sorted;
  }, [rawData, metric]);

  var allMonths = useMemo(function() {
    var byMonth = {};
    rawData.forEach(function(d) {
      if (!byMonth[d.month]) byMonth[d.month] = { month: d.month };
      byMonth[d.month][d.country] = d.totalValue;
    });
    return Object.values(byMonth).sort(function(a, b) { return a.month.localeCompare(b.month); });
  }, [rawData]);

  function toggleCountry(c) {
    setSelectedCountries(function(prev) { return prev.includes(c) ? prev.filter(function(x) { return x !== c; }) : prev.concat([c]); });
  }
  function toggleLane(l) {
    setSelectedLanes(function(prev) { return prev.includes(l) ? prev.filter(function(x) { return x !== l; }) : prev.concat([l]); });
  }

  function handleChartClick(data, keys) {
    if (!data || !data.activePayload || !data.activePayload.length) return;
    var point = data.activePayload[0].payload;
    // Pick the first visible key that has a value
    var key = null;
    for (var i = 0; i < keys.length; i++) {
      if (point[keys[i]] !== undefined && point[keys[i]] !== null) { key = keys[i]; break; }
    }
    if (!key) return;

    if (!compareA) {
      setCompareA(point);
      setCompareKey(key);
    } else if (!compareB) {
      setCompareB(point);
    } else {
      setCompareA(point);
      setCompareB(null);
      setCompareKey(key);
    }
  }

  function clearCompare() { setCompareA(null); setCompareB(null); setCompareKey(null); }

  var latestMonth = allMonths.length > 0 ? allMonths[allMonths.length - 1] : null;
  var barData = [];
  if (latestMonth) {
    Object.keys(COLORS).forEach(function(c) { if (latestMonth[c]) barData.push({ country: c, value: latestMonth[c] }); });
    barData.sort(function(a, b) { return b.value - a.value; });
  }

  var yAxisFmt = metric === "yoy"
    ? function(v) { return (v >= 0 ? "+" : "") + v.toFixed(0) + "%"; }
    : metric === "weight"
    ? function(v) { return (v / 1e9).toFixed(1) + "B"; }
    : function(v) { return (v / 1e9).toFixed(0) + "B"; };

  var metricLabel = metric === "yoy" ? "YoY % Change" : metric === "weight" ? "Vessel Weight (kg)" : "Import Value (USD)";

  // Find indices for reference area
  var refAreaLeft = null;
  var refAreaRight = null;
  if (compareA && compareB && tab === "imports") {
    var dateField = "month";
    refAreaLeft = compareA[dateField];
    refAreaRight = compareB[dateField];
    if (refAreaLeft > refAreaRight) { var tmp = refAreaLeft; refAreaLeft = refAreaRight; refAreaRight = tmp; }
  }
  if (compareA && compareB && tab === "fbx") {
    refAreaLeft = compareA.date;
    refAreaRight = compareB.date;
    if (refAreaLeft > refAreaRight) { var tmp2 = refAreaLeft; refAreaLeft = refAreaRight; refAreaRight = tmp2; }
  }

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
            {lastUpdate && <span style={{ fontSize: 10, color: "#374151" }}>- {lastUpdate.toLocaleTimeString()}</span>}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <a href="/sources" style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 11, fontFamily: "inherit", textDecoration: "none" }}>Sources</a>
              <button onClick={function() { fetchTrade(); fetchFBX(); }} disabled={loading} style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316", cursor: loading ? "wait" : "pointer", fontSize: 11, fontFamily: "inherit" }}>
                {loading ? "..." : "Refresh"}
              </button>
            </div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            US Trade & Cargo Monitor
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>
            Bilateral trade flows + container freight rates
          </p>
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { k: "imports", l: "US Imports by Country" },
            { k: "fbx", l: "Container Freight Rates" },
            { k: "ranking", l: "Top Partners" },
          ].map(function(t) {
            return (
              <button key={t.k} onClick={function() { setTab(t.k); clearCompare(); }} style={{
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
                  {[{ k: "value", l: "Value ($)" }, { k: "weight", l: "Weight (kg)" }, { k: "yoy", l: "YoY %" }].map(function(m) {
                    return (
                      <button key={m.k} onClick={function() { setMetric(m.k); clearCompare(); }} style={{
                        padding: "3px 10px", borderRadius: 4, border: "none",
                        background: metric === m.k ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.04)",
                        color: metric === m.k ? "#f97316" : "#6b7280",
                        cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit",
                      }}>{m.l}</button>
                    );
                  })}
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>{metricLabel} - Monthly - Census Bureau</p>

              {/* Compare banner */}
              {compareA && compareB && compareKey && (
                <DeltaBanner ptA={compareA} ptB={compareB} dataKey={compareKey} onClear={clearCompare} metric={metric} />
              )}
              {compareA && !compareB && (
                <div style={{ padding: "6px 14px", marginBottom: 8, borderRadius: 6, background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", fontSize: 11, color: "#f97316" }}>
                  Point A set: {compareA.month} — now click a second point to compare
                  <button onClick={clearCompare} style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>Cancel</button>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
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
                  <LineChart data={tradeData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    onClick={function(d) { handleChartClick(d, selectedCountries); }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} interval={metric === "yoy" ? 1 : 2} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={yAxisFmt} />
                    <Tooltip content={function(p) { return TipTrade({...p, metric: metric}); }} />
                    {metric === "yoy" && <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />}
                    {refAreaLeft && refAreaRight && (
                      <ReferenceArea x1={refAreaLeft} x2={refAreaRight} fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.3)" strokeDasharray="3 3" />
                    )}
                    {selectedCountries.map(function(c) {
                      return <Line key={c} type="monotone" dataKey={c} stroke={COLORS[c] || "#999"} strokeWidth={2} dot={false} name={c} connectNulls={true} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
                  {loading ? "Loading 36 months from Census Bureau... (60-90 sec)" : "No data"}
                </div>
              )}
              <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.12)", fontSize: 10, color: "#6b7280" }}>
                {metric === "yoy" ? "YoY % vs same month prior year. Click two points to measure delta." : metric === "weight" ? "Vessel weight (kg). Proxy for physical volume. Click two points to compare." : "General Imports CIF. Click two points on the chart to measure the change between them."}
              </div>
            </div>
          )}

          {tab === "fbx" && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>Container Freight Rates (FBX)</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>$/FEU spot rate - Weekly</p>

              {compareA && compareB && compareKey && (
                <DeltaBanner ptA={compareA} ptB={compareB} dataKey={compareKey} onClear={clearCompare} metric="fbx" />
              )}
              {compareA && !compareB && (
                <div style={{ padding: "6px 14px", marginBottom: 8, borderRadius: 6, background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", fontSize: 11, color: "#f97316" }}>
                  Point A: {compareA.date} — click second point
                  <button onClick={clearCompare} style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>Cancel</button>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
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
                  <LineChart data={fbxData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    onClick={function(d) { handleChartClick(d, selectedLanes); }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={function(v) { return "$" + (v / 1000).toFixed(1) + "k"; }} />
                    <Tooltip content={TipFBX} />
                    {refAreaLeft && refAreaRight && (
                      <ReferenceArea x1={refAreaLeft} x2={refAreaRight} fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.3)" strokeDasharray="3 3" />
                    )}
                    {selectedLanes.map(function(code) {
                      return <Line key={code} type="monotone" dataKey={code} stroke={FBX_COLORS[code] || "#999"} strokeWidth={2} dot={false} name={FBX_LANES[code].short} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Loading...</div>
              )}
              <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.12)", fontSize: 10, color: "#6b7280" }}>
                FBX spot rates. Click two points to measure change. Note: placeholder data pending live integration.
              </div>
            </div>
          )}

          {tab === "ranking" && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>Top US Import Partners</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 16px" }}>{latestMonth ? "Latest: " + latestMonth.month : "Loading..."}</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(400, barData.length * 36)}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={function(v) { return (v / 1e9).toFixed(0) + "B"; }} />
                    <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: "#e0e0e0" }} axisLine={false} tickLine={false} width={75} />
                    <Tooltip formatter={function(v) { return formatB(v); }} contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map(function(entry, i) { return <Cell key={i} fill={COLORS[entry.country] || "#6b7280"} opacity={0.8} />; })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Loading...</div>
              )}
            </div>
          )}
        </div>

        <div style={{ maxWidth: 1000, margin: "16px auto 0", textAlign: "center", display: "flex", justifyContent: "center", gap: 20 }}>
          <a href="/sources" style={{ fontSize: 11, color: "#4b5563", textDecoration: "none" }}>Data Sources</a>
          <a href="https://fed.rigatoni.ai" style={{ fontSize: 11, color: "#4b5563", textDecoration: "none" }}>Fed Liquidity Monitor</a>
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
