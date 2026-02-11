export default async function handler(req, res) {
  const lanes = ["FBX01", "FBX03", "FBX11", "FBX13", "FBX02", "FBX04", "FBX22", "FBX21"];
  const baseRates = {
    FBX01: 5200, FBX03: 6800, FBX11: 4100, FBX13: 4500,
    FBX02: 800, FBX04: 900, FBX22: 1800, FBX21: 1200,
  };
  const data = [];
  const now = new Date();
  for (let i = 51; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const point = { date: d.toISOString().slice(0, 10) };
    lanes.forEach(function(lane) {
      const base = baseRates[lane];
      const seasonal = Math.sin((52 - i) / 52 * Math.PI * 2) * base * 0.15;
      const noise = (Math.sin(i * 3.7 + lane.charCodeAt(3)) * 0.5 + 0.5) * base * 0.08;
      const tariffSpike = (i > 20 && i < 35) ? base * 0.25 : 0;
      point[lane] = Math.round(base + seasonal + noise + tariffSpike);
    });
    data.push(point);
  }
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.status(200).json({
    source: "placeholder - approximate values for illustration",
    data: data,
  });
}
