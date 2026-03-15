import React, { useEffect, useMemo, useState } from "react";

const LAT = 34.4367;
const LON = 35.8497;
const TZ = "Asia/Beirut";

function pad(v) {
  return String(v).padStart(2, "0");
}

function fmtHour(iso) {
  try {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso || "-";
  }
}

function fmtDay(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    });
  } catch {
    return iso || "-";
  }
}

function round(v) {
  return Math.round(Number(v || 0));
}

function one(v) {
  return Number(v || 0).toFixed(1);
}

function weatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

function weatherLabel(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm hail",
    99: "Heavy thunderstorm hail"
  };
  return map[code] || "Weather";
}

function severity(prob, mm) {
  if (prob >= 70 || mm >= 3) return "hot";
  if (prob >= 35 || mm >= 0.5) return "warm";
  return "cool";
}

function severityStyle(kind) {
  if (kind === "hot") {
    return {
      bg: "linear-gradient(180deg, rgba(255,90,110,0.16), rgba(255,60,60,0.06))",
      border: "1px solid rgba(255,92,92,0.24)"
    };
  }
  if (kind === "warm") {
    return {
      bg: "linear-gradient(180deg, rgba(255,210,95,0.14), rgba(255,166,0,0.06))",
      border: "1px solid rgba(255,196,92,0.22)"
    };
  }
  return {
    bg: "linear-gradient(180deg, rgba(87,180,255,0.10), rgba(76,127,255,0.04))",
    border: "1px solid rgba(120,160,255,0.14)"
  };
}

function makeUrl() {
  return (
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${LAT}&longitude=${LON}` +
    `&timezone=${encodeURIComponent(TZ)}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
    "&hourly=temperature_2m,precipitation_probability,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max" +
    "&forecast_days=10"
  );
}

export default function WeatherTripoliPage() {
  const [data, setData] = useState(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const r = await fetch(makeUrl(), { cache: "no-store" });
        const j = await r.json();
        if (!dead) {
          setData(j);
          setUpdatedAt(new Date().toLocaleString("en-GB"));
          setErr("");
        }
      } catch (e) {
        if (!dead) setErr(String(e?.message || e));
      }
    }

    load();
    const t = setInterval(load, 10 * 60 * 1000);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, []);

  const hourly = useMemo(() => {
    if (!data?.hourly?.time) return [];
    return data.hourly.time.map((time, i) => ({
      time,
      tempC: data.hourly.temperature_2m?.[i],
      precipProb: data.hourly.precipitation_probability?.[i],
      precipMm: data.hourly.precipitation?.[i],
      weatherCode: data.hourly.weather_code?.[i],
      windKmh: data.hourly.wind_speed_10m?.[i]
    }));
  }, [data]);

  const next24 = useMemo(() => hourly.slice(0, 24), [hourly]);

  const daily = useMemo(() => {
    if (!data?.daily?.time) return [];
    return data.daily.time.map((date, i) => ({
      date,
      weatherCode: data.daily.weather_code?.[i],
      tempMaxC: data.daily.temperature_2m_max?.[i],
      tempMinC: data.daily.temperature_2m_min?.[i],
      precipMm: data.daily.precipitation_sum?.[i],
      precipProbMax: data.daily.precipitation_probability_max?.[i],
      windMaxKmh: data.daily.wind_speed_10m_max?.[i]
    }));
  }, [data]);

  const rainInfo = useMemo(() => {
    if (!hourly.length) return { nextRainAt: null, rainStopsAt: null };

    const rainy = hourly.find(h => Number(h.precipProb || 0) >= 35 || Number(h.precipMm || 0) > 0.1);
    if (!rainy) return { nextRainAt: null, rainStopsAt: null };

    let stop = null;
    const startIndex = hourly.findIndex(h => h.time === rainy.time);
    for (let i = startIndex + 1; i < hourly.length; i++) {
      const h = hourly[i];
      if (Number(h.precipProb || 0) < 25 && Number(h.precipMm || 0) <= 0.05) {
        stop = h.time;
        break;
      }
    }

    return { nextRainAt: rainy.time, rainStopsAt: stop };
  }, [hourly]);

  if (!data) {
    return <div style={pageStyle}>Loading Tripoli Weather Luxury...</div>;
  }

  if (err) {
    return <div style={{ ...pageStyle, color: "#ffb4b4" }}>Weather load failed: {err}</div>;
  }

  const current = data.current || {};

  return (
    <div style={pageStyle}>
      <style>{`
        .wt-wrap {
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          display: grid;
          gap: 20px;
        }

        .wt-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(320px, .85fr);
          gap: 18px;
        }

        .wt-main {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(300px, .8fr);
          gap: 18px;
        }

        .wt-hour-scroll::-webkit-scrollbar {
          height: 10px;
        }

        .wt-hour-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.04);
          border-radius: 999px;
        }

        .wt-hour-scroll::-webkit-scrollbar-thumb {
          background: rgba(127,167,216,0.35);
          border-radius: 999px;
        }

        @media (max-width: 1180px) {
          .wt-hero,
          .wt-main {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .wt-title {
            font-size: 30px !important;
          }

          .wt-temp {
            font-size: 52px !important;
          }

          .wt-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .wt-radar {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="wt-wrap">
        <section className="wt-hero">
          <div style={panelStyle}>
            <div style={{ color: "#8fb3df", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              Weather Tripoli Luxury
            </div>

            <div className="wt-title" style={{ fontSize: 44, fontWeight: 900, marginTop: 10 }}>
              Tripoli, Lebanon
            </div>

            <div style={{ color: "#9bbce5", marginTop: 10, fontSize: 16 }}>
              {weatherLabel(current.weather_code)} • Updated {updatedAt}
            </div>

            <div className="wt-metrics" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginTop: 20
            }}>
              <MetricCard label="Feels Like" value={`${round(current.apparent_temperature)}°C`} />
              <MetricCard label="Humidity" value={`${round(current.relative_humidity_2m)}%`} />
              <MetricCard label="Wind" value={`${round(current.wind_speed_10m)} km/h`} />
              <MetricCard label="Pressure" value={`${round(current.pressure_msl)} hPa`} />
            </div>
          </div>

          <div style={heroTempStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
              <div>
                <div className="wt-temp" style={{ fontSize: 76, fontWeight: 900, lineHeight: .95 }}>
                  {round(current.temperature_2m)}°C
                </div>
                <div style={{ color: "#9bbce5", marginTop: 10, fontSize: 16 }}>
                  {weatherLabel(current.weather_code)}
                </div>
              </div>

              <div style={{ fontSize: 68 }}>{weatherIcon(current.weather_code)}</div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              marginTop: 18
            }}>
              <MiniChip label="Direction" value={`${round(current.wind_direction_10m)}°`} />
              <MiniChip label="Gust" value={`${round(current.wind_gusts_10m)} km/h`} />
              <MiniChip label="Cloud" value={`${round(current.cloud_cover)}%`} />
            </div>
          </div>
        </section>

        <section className="wt-main">
          <div style={panelStyle}>
            <div style={sectionTitle}>Hourly Forecast</div>

            <div className="wt-hour-scroll" style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingBottom: 10
            }}>
              {next24.map((h) => {
                const theme = severityStyle(severity(Number(h.precipProb || 0), Number(h.precipMm || 0)));
                return (
                  <div key={h.time} style={{
                    minWidth: 132,
                    padding: 14,
                    borderRadius: 18,
                    background: theme.bg,
                    border: theme.border,
                    flex: "0 0 auto"
                  }}>
                    <div style={{ color: "#9bbce5", fontSize: 12 }}>{fmtHour(h.time)}</div>
                    <div style={{ fontSize: 26, marginTop: 8 }}>{weatherIcon(h.weatherCode)}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>{round(h.tempC)}°</div>
                    <div style={{ color: "#9bbce5", fontSize: 12, marginTop: 8 }}>{weatherLabel(h.weatherCode)}</div>
                    <div style={{ color: "#b9cde8", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
                      Rain {round(h.precipProb)}%
                      <br />
                      {one(h.precipMm)} mm
                      <br />
                      Wind {round(h.windKmh)} km/h
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitle}>Rain + Radar</div>

            <div className="wt-radar" style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 10
            }}>
              <MetricCard label="Next Rain" value={rainInfo.nextRainAt ? fmtHour(rainInfo.nextRainAt) : "No near rain"} />
              <MetricCard label="Rain Stops" value={rainInfo.rainStopsAt ? fmtHour(rainInfo.rainStopsAt) : "-"} />
              <MetricCard label="Current Rain" value={`${one(current.precipitation)} mm`} />
            </div>

            <div style={{
              marginTop: 14,
              display: "grid",
              gap: 10
            }}>
              <a href="https://www.rainviewer.com/map.html" target="_blank" rel="noreferrer" style={radarBtnStyle}>RainViewer Radar</a>
              <a href="https://www.windy.com/34.436/35.850?radar,34.436,35.850,8" target="_blank" rel="noreferrer" style={radarBtnStyle}>Windy Radar</a>
              <a href="https://www.ventusky.com/?p=34.44;35.85;8&l=rain-3h" target="_blank" rel="noreferrer" style={radarBtnStyle}>Ventusky Rain Map</a>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}>10 Day Forecast</div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 14
          }}>
            {daily.map((d) => {
              const theme = severityStyle(severity(Number(d.precipProbMax || 0), Number(d.precipMm || 0)));
              return (
                <div key={d.date} style={{
                  borderRadius: 18,
                  padding: 16,
                  background: theme.bg,
                  border: theme.border
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{fmtDay(d.date)}</div>
                    <div style={{ fontSize: 28 }}>{weatherIcon(d.weatherCode)}</div>
                  </div>

                  <div style={{ color: "#9bbce5", marginTop: 8, fontSize: 13 }}>
                    {weatherLabel(d.weatherCode)}
                  </div>

                  <div style={{ marginTop: 12, display: "flex", alignItems: "end", gap: 10 }}>
                    <div style={{ fontSize: 32, fontWeight: 900 }}>{round(d.tempMaxC)}°</div>
                    <div style={{ color: "#9bbce5", fontSize: 18 }}>{round(d.tempMinC)}°</div>
                  </div>

                  <div style={{ marginTop: 12, color: "#b9cde8", fontSize: 12, lineHeight: 1.7 }}>
                    Rain chance: {round(d.precipProbMax)}%
                    <br />
                    Precipitation: {one(d.precipMm)} mm
                    <br />
                    Wind max: {round(d.windMaxKmh)} km/h
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div style={{
      borderRadius: 16,
      padding: 12,
      background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div style={{ color: "#8caed9", fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function MiniChip({ label, value }) {
  return (
    <div style={{
      borderRadius: 14,
      padding: 10,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div style={{ color: "#8caed9", fontSize: 10 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100%",
  padding: 20,
  color: "#eef6ff",
  background: "radial-gradient(circle at top right, rgba(38,55,112,0.22), transparent 24%), linear-gradient(180deg,#020814 0%,#07111c 50%,#030914 100%)"
};

const panelStyle = {
  borderRadius: 24,
  padding: 18,
  background: "linear-gradient(180deg, rgba(9,19,32,0.92), rgba(6,15,28,0.96))",
  border: "1px solid rgba(120,160,255,0.14)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const heroTempStyle = {
  borderRadius: 24,
  padding: 18,
  background: "linear-gradient(135deg, rgba(37,57,118,0.30), rgba(10,20,45,0.80))",
  border: "1px solid rgba(120,160,255,0.18)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const sectionTitle = {
  fontSize: 22,
  fontWeight: 900,
  marginBottom: 14
};

const radarBtnStyle = {
  display: "block",
  textDecoration: "none",
  color: "#eef6ff",
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: "12px 14px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
};