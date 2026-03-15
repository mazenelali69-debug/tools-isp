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
      bg: "linear-gradient(135deg, rgba(255,95,109,0.16), rgba(255,62,62,0.08))",
      border: "1px solid rgba(255,92,92,0.24)",
      glow: "0 0 0 1px rgba(255,92,92,0.05), 0 18px 38px rgba(255,72,72,0.10)"
    };
  }
  if (kind === "warm") {
    return {
      bg: "linear-gradient(135deg, rgba(255,210,95,0.14), rgba(255,166,0,0.06))",
      border: "1px solid rgba(255,196,92,0.22)",
      glow: "0 0 0 1px rgba(255,196,92,0.05), 0 18px 38px rgba(255,184,72,0.08)"
    };
  }
  return {
    bg: "linear-gradient(135deg, rgba(87,180,255,0.10), rgba(76,127,255,0.04))",
    border: "1px solid rgba(120,160,255,0.14)",
    glow: "0 0 0 1px rgba(120,160,255,0.04), 0 18px 38px rgba(25,46,89,0.20)"
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
        if (!dead) {
          setErr(String(e?.message || e));
        }
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
      rainMm: data.hourly.rain?.[i],
      showersMm: data.hourly.showers?.[i],
      weatherCode: data.hourly.weather_code?.[i],
      windKmh: data.hourly.wind_speed_10m?.[i],
      gustKmh: data.hourly.wind_gusts_10m?.[i],
      cloudCover: data.hourly.cloud_cover?.[i]
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
    if (!hourly.length) return { nextRainAt: null, rainStopsAt: null, strongestHour: null };

    const rainy = hourly.find(h => Number(h.precipProb || 0) >= 35 || Number(h.precipMm || 0) > 0.1);
    const strongest = [...hourly]
      .slice(0, 24)
      .sort((a, b) => (Number(b.precipMm || 0) + Number(b.precipProb || 0) / 100) - (Number(a.precipMm || 0) + Number(a.precipProb || 0) / 100))[0] || null;

    if (!rainy) return { nextRainAt: null, rainStopsAt: null, strongestHour: strongest };

    let stop = null;
    const startIndex = hourly.findIndex(h => h.time === rainy.time);
    for (let i = startIndex + 1; i < hourly.length; i++) {
      const h = hourly[i];
      if (Number(h.precipProb || 0) < 25 && Number(h.precipMm || 0) <= 0.05) {
        stop = h.time;
        break;
      }
    }

    return { nextRainAt: rainy.time, rainStopsAt: stop, strongestHour: strongest };
  }, [hourly]);

  if (!data) {
    return (
      <div style={pageStyle}>
        <div style={{ color: "#eef6ff", fontSize: 22 }}>Loading Tripoli Weather Ultra...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={pageStyle}>
        <div style={{ color: "#ffb4b4", fontSize: 18 }}>Weather load failed: {err}</div>
      </div>
    );
  }

  const current = data.current || {};
  const mainSeverity = severity(Number(current.precipitation || 0) * 20, Number(current.precipitation || 0));
  const mainTheme = severityStyle(mainSeverity);

  return (
    <div style={pageStyle}>
      <style>{`
        .wt-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
        .wt-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
        .wt-scroll::-webkit-scrollbar-thumb { background: rgba(127,167,216,0.35); border-radius: 999px; }
        .wt-glow {
          position: absolute;
          inset: auto;
          pointer-events: none;
          filter: blur(60px);
          opacity: .55;
        }
      `}</style>

      <div className="wt-glow" style={{ width: 240, height: 240, top: 40, right: 120, background: "rgba(76,127,255,0.16)" }} />
      <div className="wt-glow" style={{ width: 220, height: 220, top: 120, left: 120, background: "rgba(84,214,255,0.11)" }} />
      <div className="wt-glow" style={{ width: 180, height: 180, bottom: 60, right: 300, background: "rgba(255,170,80,0.12)" }} />

      <div style={{ display: "grid", gap: 16, position: "relative", zIndex: 1 }}>
        <section style={{ ...heroStyle, background: mainTheme.bg, border: mainTheme.border, boxShadow: mainTheme.glow }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr .85fr", gap: 18, alignItems: "stretch" }}>
            <div style={{ display: "grid", alignContent: "space-between", gap: 20 }}>
              <div>
                <div style={{ color: "#8caed9", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Weather Tripoli Ultra</div>
                <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.05, marginTop: 10 }}>Tripoli, Lebanon</div>
                <div style={{ color: "#a8c3e6", marginTop: 10, fontSize: 16 }}>
                  {weatherLabel(current.weather_code)} • Updated {updatedAt}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px,1fr))", gap: 12 }}>
                <GlassMini title="Feels Like" value={`${round(current.apparent_temperature)}°C`} />
                <GlassMini title="Humidity" value={`${round(current.relative_humidity_2m)}%`} />
                <GlassMini title="Wind" value={`${round(current.wind_speed_10m)} km/h`} />
                <GlassMini title="Pressure" value={`${round(current.pressure_msl)} hPa`} />
              </div>
            </div>

            <div style={{
              borderRadius: 26,
              padding: 22,
              background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.10)",
              display: "grid",
              alignContent: "space-between"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 70, fontWeight: 900, lineHeight: .95 }}>{round(current.temperature_2m)}°C</div>
                  <div style={{ color: "#9bbce5", marginTop: 10 }}>{weatherLabel(current.weather_code)}</div>
                </div>
                <div style={{ fontSize: 62 }}>{weatherIcon(current.weather_code)}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 20 }}>
                <GlassChip label="Direction" value={`${round(current.wind_direction_10m)}°`} />
                <GlassChip label="Gust" value={`${round(current.wind_gusts_10m)} km/h`} />
                <GlassChip label="Cloud" value={`${round(current.cloud_cover)}%`} />
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.3fr .9fr", gap: 16 }}>
          <div style={panelStyle}>
            <div style={sectionTitle}>Next 24 Hours</div>
            <div className="wt-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
              {next24.map((h) => {
                const sev = severity(Number(h.precipProb || 0), Number(h.precipMm || 0));
                const theme = severityStyle(sev);
                return (
                  <div key={h.time} style={{
                    minWidth: 120,
                    borderRadius: 20,
                    padding: 14,
                    background: theme.bg,
                    border: theme.border,
                    boxShadow: theme.glow
                  }}>
                    <div style={{ color: "#9bbce5", fontSize: 12 }}>{fmtHour(h.time)}</div>
                    <div style={{ fontSize: 28, marginTop: 8 }}>{weatherIcon(h.weatherCode)}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{round(h.tempC)}°</div>
                    <div style={{ color: "#9bbce5", fontSize: 12, marginTop: 8 }}>{weatherLabel(h.weatherCode)}</div>
                    <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
                      <small style={smallMeta}>Rain {round(h.precipProb)}%</small>
                      <small style={smallMeta}>Precip {one(h.precipMm)} mm</small>
                      <small style={smallMeta}>Wind {round(h.windKmh)} km/h</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitle}>Rain + Radar</div>
            <div style={{ display: "grid", gap: 12 }}>
              <GlassMetric title="Next Rain" value={rainInfo.nextRainAt ? fmtHour(rainInfo.nextRainAt) : "No near rain"} />
              <GlassMetric title="Rain Stops" value={rainInfo.rainStopsAt ? fmtHour(rainInfo.rainStopsAt) : "-"} />
              <GlassMetric title="Strongest Hour" value={rainInfo.strongestHour ? fmtHour(rainInfo.strongestHour.time) : "-"} />
            </div>

            <div style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 18,
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Live Radar Links</div>
              <div style={{ display: "grid", gap: 10 }}>
                <a href="https://www.rainviewer.com/map.html" target="_blank" rel="noreferrer" style={radarBtnStyle}>RainViewer Radar</a>
                <a href="https://www.windy.com/34.436/35.850?radar,34.436,35.850,8" target="_blank" rel="noreferrer" style={radarBtnStyle}>Windy Radar</a>
                <a href="https://www.ventusky.com/?p=34.44;35.85;8&l=rain-3h" target="_blank" rel="noreferrer" style={radarBtnStyle}>Ventusky Rain Map</a>
              </div>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}>10 Day Forecast</div>
          <div style={{ display: "grid", gap: 10 }}>
            {daily.map((d) => {
              const sev = severity(Number(d.precipProbMax || 0), Number(d.precipMm || 0));
              const theme = severityStyle(sev);
              return (
                <div key={d.date} style={{
                  display: "grid",
                  gridTemplateColumns: "120px 70px 1.1fr 140px 110px 120px 120px",
                  gap: 10,
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: 18,
                  background: theme.bg,
                  border: theme.border,
                  boxShadow: theme.glow
                }}>
                  <div style={{ fontWeight: 900 }}>{fmtDay(d.date)}</div>
                  <div style={{ fontSize: 28 }}>{weatherIcon(d.weatherCode)}</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{weatherLabel(d.weatherCode)}</div>
                    <div style={{ color: "#9bbce5", fontSize: 12 }}>Rain chance + wind summary</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>{round(d.tempMaxC)}° / {round(d.tempMinC)}°</div>
                  <div>{round(d.precipProbMax)}%</div>
                  <div>{one(d.precipMm)} mm</div>
                  <div>{round(d.windMaxKmh)} km/h</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function GlassMini({ title, value }) {
  return (
    <div style={{
      borderRadius: 18,
      padding: 14,
      background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div style={{ color: "#8caed9", fontSize: 11, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function GlassChip({ label, value }) {
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

function GlassMetric({ title, value }) {
  return (
    <div style={{
      borderRadius: 16,
      padding: 12,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div style={{ color: "#8caed9", fontSize: 11 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100%",
  padding: 20,
  color: "#eef6ff",
  background: "radial-gradient(circle at top right, rgba(38,55,112,0.25), transparent 24%), linear-gradient(180deg,#020814 0%,#07111c 50%,#030914 100%)",
  position: "relative",
  overflow: "hidden"
};

const heroStyle = {
  borderRadius: 30,
  padding: 22,
  backdropFilter: "blur(18px)"
};

const panelStyle = {
  borderRadius: 26,
  padding: 16,
  background: "linear-gradient(180deg, rgba(9,19,32,0.92), rgba(6,15,28,0.96))",
  border: "1px solid rgba(120,160,255,0.14)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const sectionTitle = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 14
};

const smallMeta = {
  color: "#a8c3e6",
  fontSize: 11
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