import Head from "next/head";

export default function Sources() {
  return (
    <>
      <Head>
        <title>Data Sources - US Trade & Cargo Monitor</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x1F6A2;</text></svg>" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #0f1629 50%, #0a0a1a 100%)", color: "#e0e0e0", fontFamily: "JetBrains Mono, SF Mono, monospace", padding: "24px 16px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          <div style={{ marginBottom: 24 }}>
            <a href="/" style={{ fontSize: 11, color: "#f97316", textDecoration: "none" }}>Back to Dashboard</a>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Data Sources & Methodology
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 32px" }}>
            How this dashboard collects, processes, and displays trade data.
          </p>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "#f97316" }}>US Census Bureau — International Trade API</h2>
            <p style={{ fontSize: 10, color: "#4b5563", margin: "0 0 12px" }}>api.census.gov/data/timeseries/intltrade</p>
            <div style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 1.8, marginBottom: 16 }}>
              <p style={{ marginBottom: 10 }}>The US Census Bureau collects and publishes official US import and export statistics. Data is compiled from Electronic Export Information (EEI) filings and US Customs Automated Commercial Environment (ACE) import entry forms.</p>
              <p style={{ marginBottom: 10 }}>We use the <strong>End-Use classification endpoint</strong> which provides total trade values aggregated by country, giving the broadest view of bilateral trade.</p>
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "#e0e0e0" }}>Fields Used</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>
              <div><code style={{ color: "#f97316" }}>GEN_VAL_MO</code> General imports value (monthly, USD)</div>
              <div><code style={{ color: "#f97316" }}>VES_VAL_MO</code> Vessel imports value (monthly, USD)</div>
              <div><code style={{ color: "#f97316" }}>VES_WGT_MO</code> Vessel shipping weight (monthly, kg)</div>
              <div><code style={{ color: "#f97316" }}>AIR_VAL_MO</code> Air imports value (monthly, USD)</div>
              <div><code style={{ color: "#f97316" }}>CON_VAL_MO</code> Imports for consumption (monthly, USD)</div>
              <div><code style={{ color: "#f97316" }}>CTY_CODE</code> Country code (Schedule C)</div>
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "#e0e0e0" }}>Countries Tracked</h3>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16, lineHeight: 1.8 }}>
              China (5700), Vietnam (5820), Japan (5880), South Korea (5800), Taiwan (5830), Germany (4280), Mexico (2010), Canada (1220), India (5330), Thailand (5490), Indonesia (5610), Bangladesh (5350), Italy (4130), France (4120), United Kingdom (4190), Malaysia (5580)
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "#e0e0e0" }}>Data Characteristics</h3>
            <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.8 }}>
              <div><strong>Frequency</strong>: Monthly</div>
              <div><strong>Lag</strong>: ~35 days after month end (released with FT-900 report)</div>
              <div><strong>Basis</strong>: General Imports, CIF (Cost, Insurance, Freight)</div>
              <div><strong>Coverage</strong>: 36 months of history</div>
              <div><strong>Caching</strong>: Server-side cache, 24h TTL</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "#22c55e" }}>Vessel Weight (kg) — Physical Volume Proxy</h2>
            <div style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 1.8, marginBottom: 16 }}>
              <p style={{ marginBottom: 10 }}><strong>VES_WGT_MO</strong> measures the total shipping weight in kilograms of goods transported via ocean vessel. This is a strong proxy for container volumes because container ships carry goods by weight and volume — more kilograms generally means more containers.</p>
              <p style={{ marginBottom: 10 }}>YoY % changes in vessel weight correlate closely with YoY % changes in TEU volumes, especially for highly containerized routes like China-US and Vietnam-US.</p>
              <p>Vessel weight includes all ocean freight (container + bulk). For routes dominated by containerized trade, the correlation with TEU is very high.</p>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "#3b82f6" }}>YoY % Change</h2>
            <div style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 1.8 }}>
              <p style={{ marginBottom: 10 }}>Year-over-year percentage change:</p>
              <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, padding: "10px 14px", fontFamily: "JetBrains Mono", fontSize: 12, marginBottom: 10 }}>
                YoY % = (Current month - Same month prior year) / Same month prior year x 100
              </div>
              <p>Removes seasonality (Chinese New Year, holiday shipping peaks) and isolates the underlying trend. Directly comparable to indices like FreightWaves IOTI.</p>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "#ef4444" }}>Freightos Baltic Index (FBX)</h2>
            <p style={{ fontSize: 10, color: "#4b5563", margin: "0 0 12px" }}>fbx.freightos.com</p>
            <div style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 1.8, marginBottom: 16 }}>
              <p style={{ marginBottom: 10 }}>The FBX is the leading container freight rate index, created by Freightos and the Baltic Exchange. It measures spot rates ($/FEU) for 40-foot containers across 12 major trade lanes.</p>
              <p>Calculated from real transaction data — millions of live freight rates from carriers, forwarders, and shippers. IOSCO-compliant, BMR-regulated, traded on CME and SGX.</p>
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "#e0e0e0" }}>Trade Lanes</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>
              <div><code style={{ color: "#ef4444" }}>FBX01</code> China/East Asia to NA West Coast</div>
              <div><code style={{ color: "#f97316" }}>FBX03</code> China/East Asia to NA East Coast</div>
              <div><code style={{ color: "#3b82f6" }}>FBX11</code> China/East Asia to North Europe</div>
              <div><code style={{ color: "#06b6d4" }}>FBX13</code> China/East Asia to Mediterranean</div>
              <div><code style={{ color: "#fca5a5" }}>FBX02</code> NA West Coast to China/East Asia</div>
              <div><code style={{ color: "#fdba74" }}>FBX04</code> NA East Coast to China/East Asia</div>
              <div><code style={{ color: "#93c5fd" }}>FBX22</code> North Europe to NA East Coast</div>
              <div><code style={{ color: "#67e8f9" }}>FBX21</code> NA East Coast to North Europe</div>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.8 }}>
              <div><strong>Frequency</strong>: Weekly (daily with subscription)</div>
              <div><strong>Unit</strong>: USD per FEU (40-foot equivalent unit)</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href="/" style={{ fontSize: 12, color: "#f97316", textDecoration: "none" }}>Back to Dashboard</a>
          </div>
        </div>

        <style jsx global>{"\
          * { margin: 0; padding: 0; box-sizing: border-box; }\
          body { background: #0a0a1a; }\
          code { background: rgba(255,255,255,0.05); padding: 1px 5px; border-radius: 3px; }\
        "}</style>
      </div>
    </>
  );
}
