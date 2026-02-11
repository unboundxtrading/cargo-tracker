const CENSUS_KEY = "d2e864c089f74572ea83002281e7a68e08658be1";

const COUNTRIES = {
  "5700": "China",
  "5820": "Vietnam",
  "5880": "Japan",
  "5800": "South Korea",
  "5830": "Taiwan",
  "4280": "Germany",
  "2010": "Mexico",
  "1220": "Canada",
  "5330": "India",
  "5490": "Thailand",
  "5610": "Indonesia",
  "5350": "Bangladesh",
  "4130": "Italy",
  "4120": "France",
  "4190": "United Kingdom",
  "5580": "Malaysia",
};

export default async function handler(req, res) {
  const { type, months, countries } = req.query;
  const tradeType = type === "exports" ? "exports" : "imports";
  const ctyCodes = countries === "all" || !countries
    ? Object.keys(COUNTRIES)
    : countries.split(",");
  const monthList = months ? months.split(",") : generateLastNMonths(36);

  try {
    const results = [];
    for (const month of monthList) {
      const [year, mo] = month.split("-");
      const getFields = tradeType === "imports"
        ? "CTY_CODE,CTY_NAME,GEN_VAL_MO,VES_VAL_MO,VES_WGT_MO,AIR_VAL_MO,CON_VAL_MO"
        : "CTY_CODE,CTY_NAME,ALL_VAL_MO,VES_VAL_MO,VES_WGT_MO,AIR_VAL_MO";
      const url = `https://api.census.gov/data/timeseries/intltrade/${tradeType}/enduse?get=${getFields}&YEAR=${year}&MONTH=${mo}&SUMMARY_LVL=DET&key=${CENSUS_KEY}`;
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        const headers = data[0];
        const rows = data.slice(1);
        for (const row of rows) {
          const ctyCode = row[headers.indexOf("CTY_CODE")];
          if (!ctyCodes.includes(ctyCode)) continue;
          const entry = {
            month: month,
            ctyCode: ctyCode,
            country: COUNTRIES[ctyCode] || row[headers.indexOf("CTY_NAME")],
          };
          if (tradeType === "imports") {
            entry.totalValue = parseInt(row[headers.indexOf("GEN_VAL_MO")] || "0");
            entry.vesselValue = parseInt(row[headers.indexOf("VES_VAL_MO")] || "0");
            entry.vesselWeight = parseInt(row[headers.indexOf("VES_WGT_MO")] || "0");
            entry.airValue = parseInt(row[headers.indexOf("AIR_VAL_MO")] || "0");
            entry.consumptionValue = parseInt(row[headers.indexOf("CON_VAL_MO")] || "0");
          } else {
            entry.totalValue = parseInt(row[headers.indexOf("ALL_VAL_MO")] || "0");
            entry.vesselValue = parseInt(row[headers.indexOf("VES_VAL_MO")] || "0");
            entry.vesselWeight = parseInt(row[headers.indexOf("VES_WGT_MO")] || "0");
            entry.airValue = parseInt(row[headers.indexOf("AIR_VAL_MO")] || "0");
          }
          results.push(entry);
        }
      } catch (e) { console.error("Failed " + month, e.message); }
    }
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=172800");
    res.status(200).json({ type: tradeType, countries: COUNTRIES, data: results });
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
