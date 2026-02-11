const CENSUS_KEY = "d2e864c089f74572ea83002281e7a68e08658be1";

const COUNTRIES = {
  "5700": "China",
  "5520": "Vietnam",
  "5880": "Japan",
  "5800": "South Korea",
  "5830": "Taiwan",
  "4280": "Germany",
  "2010": "Mexico",
  "1220": "Canada",
  "5330": "India",
  "5490": "Thailand",
  "5600": "Indonesia",
  "5380": "Bangladesh",
  "4759": "Italy",
  "4279": "France",
  "4120": "United Kingdom",
  "5570": "Malaysia",
};

export default async function handler(req, res) {
  const { months } = req.query;
  const monthList = months ? months.split(",") : generateLastNMonths(36);
  const ctyCodes = Object.keys(COUNTRIES);

  try {
    const results = [];
    
    for (const month of monthList) {
      const [year, mo] = month.split("-");
      const url = `https://api.census.gov/data/timeseries/intltrade/imports/hs?get=CTY_CODE,CTY_NAME,GEN_VAL_MO,VES_VAL_MO,VES_WGT_MO,AIR_VAL_MO&YEAR=${year}&MONTH=${mo}&key=${CENSUS_KEY}`;
      
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        if (!Array.isArray(data) || data.length < 2) continue;
        const headers = data[0];
        const rows = data.slice(1);
        
        for (const row of rows) {
          const ctyCode = row[headers.indexOf("CTY_CODE")];
          if (!ctyCodes.includes(ctyCode)) continue;
          results.push({
            month: month,
            ctyCode: ctyCode,
            country: COUNTRIES[ctyCode] || row[headers.indexOf("CTY_NAME")],
            totalValue: parseInt(row[headers.indexOf("GEN_VAL_MO")] || "0"),
            vesselValue: parseInt(row[headers.indexOf("VES_VAL_MO")] || "0"),
            vesselWeight: parseInt(row[headers.indexOf("VES_WGT_MO")] || "0"),
            airValue: parseInt(row[headers.indexOf("AIR_VAL_MO")] || "0"),
          });
        }
      } catch (e) {
        console.error("Failed " + month, e.message);
      }
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=172800");
    res.status(200).json({ type: "imports", countries: COUNTRIES, data: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function generateLastNMonths(n) {
  const months = [];
  const now = new Date();
  now.setMonth(now.getMonth() - 2);
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    months.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  return months;
}
