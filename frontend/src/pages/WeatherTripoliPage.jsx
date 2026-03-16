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
  if (code === 0) return "â˜€ï¸";
  if (code === 1 || code === 2) return "ðŸŒ¤ï¸";
  if (code === 3) return "â˜ï¸";
  if (code === 45 || code === 48) return "ðŸŒ«ï¸";
  if (code >= 51 && code <= 57) return "ðŸŒ¦ï¸";
  if (code >= 61 && code <= 67) return "ðŸŒ§ï¸";
  if (code >= 71 && code <= 77) return "â„ï¸";
  if (code >= 80 && code <= 82) return "ðŸŒ¦ï¸";
  if (code >= 85 && code <= 86) return "ðŸŒ¨ï¸";
  if (code >= 95) return "â›ˆï¸";
  return "ðŸŒ¡ï¸";
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
      bg: "linear-gradient(180deg, rgba(255,96,120,0.18), rgba(255,62,62,0.08))",
      border: "1px solid rgba(255,92,92,0.28)",
      accent: "#ff7a89"
    };
  }
  if (kind === "warm") {
    return {
      bg: "linear-gradient(180deg, rgba(255,210,95,0.16), rgba(255,166,0,0.07))",
      border: "1px solid rgba(255,196,92,0.24)",
      accent: "#ffd05c"
    };
  }
  return {
    bg: "linear-gradient(180deg, rgba(87,180,255,0.12), rgba(76,127,255,0.05))",
    border: "1px solid rgba(120,160,255,0.16)",
    accent: "#7edcff"
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

  const next18 = useMemo(() => hourly.slice(0, 18), [hourly]);

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
    if (!hourly.length) return { nextRainAt: null, rainStopsAt: null, strongest: null };

    const rainy = hourly.find(h => Number(h.precipProb || 0) >= 35 || Number(h.precipMm || 0) > 0.1);
    const strongest = [...hourly].slice(0, 24).sort((a, b) => {
      const av = Number(a.precipMm || 0) * 10 + Number(a.precipProb || 0);
      const bv = Number(b.precipMm || 0) * 10 + Number(b.precipProb || 0);
      return bv - av;
    })[0] || null;

    if (!rainy) return { nextRainAt: null, rainStopsAt: null, strongest };

    let stop = null;
    const startIndex = hourly.findIndex(h => h.time === rainy.time);
    for (let i = startIndex + 1; i < hourly.length; i++) {
      const h = hourly[i];
      if (Number(h.precipProb || 0) < 25 && Number(h.precipMm || 0) <= 0.05) {
        stop = h.time;
        break;
      }
    }

    return { nextRainAt: rainy.time, rainStopsAt: stop, strongest };
  }, [hourly]);

  if (!data) {
    return <div style={pageStyle}>Loading Tripoli Weather Premium...</div>;
  }

  if (err) {
    return <div style={{ ...pageStyle, color: "#ffb4b4" }}>Weather load failed: {err}</div>;
  }

  const current = data.current || {};
  const currentTheme = severityStyle(severity(Number(current.precipitation || 0) * 20, Number(current.precipitation || 0)));

  const liveBadge = (() => {
    const wind = Number(current.wind_speed_10m || 0);
    const rain = Number(current.rain || current.showers || current.precipitation || 0);
    const cloud = Number(current.cloud_cover || 0);
    if (rain >= 1) return "rain live";
    if (wind >= 28) return "wind alert";
    if (cloud <= 20) return "clear live";
    return "live";
  })();

  const strongestHour = rainInfo?.strongest || null;

  return (
    <div style={pageStyle}>
      <style>{`
        .wt-wrap {
          width: 100%;
          max-width: 1540px;
          margin: 0 auto;
          display: grid;
          gap: 22px;
        }

        .wt-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(340px, .8fr);
          gap: 18px;
        }

        .wt-mid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(320px, .75fr);
          gap: 18px;
        }

        .wt-hour-scroll::-webkit-scrollbar {
          height: 10px;
        }

        .wt-hour-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,.04);
          border-radius: 999px;
        }

        .wt-hour-scroll::-webkit-scrollbar-thumb {
          background: rgba(127,167,216,.35);
          border-radius: 999px;
        }

        @media (max-width: 1220px) {
          .wt-hero, .wt-mid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .wt-title { font-size: 32px !important; }
          .wt-big-temp { font-size: 56px !important; }
          .wt-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .wt-daily-grid { grid-template-columns: 1fr !important; }
        }

        /* SAFE_WEATHER_LIVEBOX_V1 */
        .wt-livebox {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          padding: 24px;
          border: 1px solid rgba(120,190,255,.18);
          background:
            radial-gradient(700px 320px at 15% 10%, rgba(87,180,255,.18), transparent 55%),
            radial-gradient(500px 240px at 85% 20%, rgba(100,255,210,.10), transparent 55%),
            linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05));
          box-shadow: 0 24px 80px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.06);
          backdrop-filter: blur(14px);
        }

        .wt-livebox::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent);
          pointer-events: none;
        }

        .wt-livebox-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .wt-livebox-title {
          font-size: 13px;
          color: #9fc2ea;
          font-weight: 900;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .wt-livebox-temp {
          font-size: 78px;
          line-height: .94;
          font-weight: 1000;
          letter-spacing: -2px;
          margin: 10px 0 8px;
          color: #fff;
        }

        .wt-livebox-label {
          font-size: 20px;
          font-weight: 900;
          color: #eef6ff;
        }

        .wt-livebox-sub {
          color: #9bbce5;
          font-size: 14px;
          margin-top: 8px;
        }

        .wt-livebox-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,70,70,.14);
          border: 1px solid rgba(255,70,70,.24);
          color: #ffd7d7;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .6px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .wt-livebox-badge::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #ff5f70;
          box-shadow: 0 0 12px rgba(255,95,112,.65);
        }

        .wt-livebox-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .wt-livebox-kpi {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(6,14,28,.32);
        }

        .wt-livebox-kpi-label {
          font-size: 11px;
          color: #90afd6;
          text-transform: uppercase;
          letter-spacing: .55px;
          margin-bottom: 8px;
          font-weight: 800;
        }

        .wt-livebox-kpi-value {
          font-size: 24px;
          font-weight: 900;
          color: #fff;
        }

        .wt-live-side {
          display: grid;
          gap: 14px;
        }

        .wt-live-side-card {
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.05));
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .wt-live-side-title {
          font-size: 12px;
          color: #9fc2ea;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 10px;
        }

        .wt-live-side-big {
          font-size: 28px;
          font-weight: 1000;
          color: #fff;
        }

        .wt-live-side-note {
          color: #9bbce5;
          font-size: 13px;
          margin-top: 6px;
        }

        @media (max-width: 1220px) {
          .wt-livebox-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .wt-livebox {
            padding: 18px;
            border-radius: 22px;
          }

          .wt-livebox-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .wt-livebox-temp {
            font-size: 56px;
          }

          .wt-livebox-label {
            font-size: 17px;
          }

          .wt-livebox-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div style={glowA} />
      <div style={glowB} />
      <div style={glowC} />

      <div className="wt-wrap">
        <section className="wt-hero">
          <div style={heroLeftStyle}>
            <div style={{ color: "#8fb3df", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              Weather Final Premium
            </div>

            <div className="wt-title" style={{ fontSize: 46, fontWeight: 900, marginTop: 10 }}>
              Tripoli, Lebanon
            </div>

            <div style={{ color: "#9bbce5", marginTop: 10, fontSize: 16 }}>
              {weatherLabel(current.weather_code)} â€¢ Updated {updatedAt}
            </div>

            <div className="wt-stats" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginTop: 22
            }}>
              <MetricCard label="Feels Like" value={`${round(current.apparent_temperature)}Â°C`} />
              <MetricCard label="Humidity" value={`${round(current.relative_humidity_2m)}%`} />
              <MetricCard label="Wind" value={`${round(current.wind_speed_10m)} km/h`} />
              <MetricCard label="Pressure" value={`${round(current.pressure_msl)} hPa`} />
            </div>
          </div>

          <div style={{ ...heroRightStyle, background: currentTheme.bg, border: currentTheme.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 18 }}>
              <div>
                <div className="wt-big-temp" style={{ fontSize: 80, fontWeight: 900, lineHeight: .92 }}>
                  {round(current.temperature_2m)}Â°C
                </div>
                <div style={{ color: "#9bbce5", marginTop: 10, fontSize: 16 }}>
                  {weatherLabel(current.weather_code)}
                </div>
              </div>

              <div style={{ fontSize: 70 }}>{weatherIcon(current.weather_code)}</div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              marginTop: 18
            }}>
              <MiniChip label="Direction" value={`${round(current.wind_direction_10m)}Â°`} />
              <MiniChip label="Gust" value={`${round(current.wind_gusts_10m)} km/h`} />
              <MiniChip label="Cloud" value={`${round(current.cloud_cover)}%`} />
            </div>
          </div>
        </section>

        <section className="wt-mid">
          <div style={panelStyle}>
            <div style={sectionTitle}>Hourly Forecast</div>

            <div className="wt-hour-scroll" style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingBottom: 10
            }}>
              {next18.map((h) => {
                const sev = severityStyle(severity(Number(h.precipProb || 0), Number(h.precipMm || 0)));
                return (
                  <div key={h.time} style={{
                    minWidth: 146,
                    padding: 14,
                    borderRadius: 20,
                    background: sev.bg,
                    border: sev.border,
                    flex: "0 0 auto",
                    boxShadow: "0 14px 30px rgba(0,0,0,.18)"
                  }}>
                    <div style={{ color: "#9bbce5", fontSize: 12 }}>{fmtHour(h.time)}</div>
                    <div style={{ fontSize: 28, marginTop: 8 }}>{weatherIcon(h.weatherCode)}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{round(h.tempC)}Â°</div>
                    <div style={{ color: "#9bbce5", fontSize: 12, marginTop: 8 }}>{weatherLabel(h.weatherCode)}</div>

                    <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, Number(h.precipProb || 0))}%`,
                        height: "100%",
                        background: "linear-gradient(90deg,#4fdcff,#7f86ff)"
                      }} />
                    </div>

                    <div style={{ color: "#b9cde8", fontSize: 12, marginTop: 10, lineHeight: 1.65 }}>
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

            <div style={{ display: "grid", gap: 10 }}>
              <MetricCard label="Next Rain" value={rainInfo.nextRainAt ? fmtHour(rainInfo.nextRainAt) : "No near rain"} />
              <MetricCard label="Rain Stops" value={rainInfo.rainStopsAt ? fmtHour(rainInfo.rainStopsAt) : "-"} />
              <MetricCard label="Strongest Hour" value={rainInfo.strongest ? fmtHour(rainInfo.strongest.time) : "-"} />
              <MetricCard label="Current Rain" value={`${one(current.precipitation)} mm`} />
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <a href="https://www.rainviewer.com/map.html" target="_blank" rel="noreferrer" style={radarBtnStyle}>RainViewer Radar</a>
              <a href="https://www.windy.com/34.436/35.850?radar,34.436,35.850,8" target="_blank" rel="noreferrer" style={radarBtnStyle}>Windy Radar</a>
              <a href="https://www.ventusky.com/?p=34.44;35.85;8&l=rain-3h" target="_blank" rel="noreferrer" style={radarBtnStyle}>Ventusky Rain Map</a>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}>10 Day Forecast</div>

          <div className="wt-daily-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14
          }}>
            {daily.map((d) => {
              const sev = severityStyle(severity(Number(d.precipProbMax || 0), Number(d.precipMm || 0)));
              return (
                <div key={d.date} style={{
                  borderRadius: 20,
                  padding: 16,
                  background: sev.bg,
                  border: sev.border,
                  boxShadow: "0 14px 28px rgba(0,0,0,.16)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{fmtDay(d.date)}</div>
                    <div style={{ fontSize: 30 }}>{weatherIcon(d.weatherCode)}</div>
                  </div>

                  <div style={{ color: "#9bbce5", marginTop: 8, fontSize: 13 }}>
                    {weatherLabel(d.weatherCode)}
                  </div>

                  <div style={{ display: "flex", alignItems: "end", gap: 10, marginTop: 14 }}>
                    <div style={{ fontSize: 34, fontWeight: 900 }}>{round(d.tempMaxC)}Â°</div>
                    <div style={{ fontSize: 18, color: "#9bbce5" }}>{round(d.tempMinC)}Â°</div>
                  </div>

                  <div style={{ marginTop: 12, height: 7, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, Number(d.precipProbMax || 0))}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#4fdcff,#7f86ff)"
                    }} />
                  </div>

                  <div style={{ marginTop: 12, color: "#b9cde8", fontSize: 12, lineHeight: 1.75 }}>
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
  background: "radial-gradient(circle at top right, rgba(38,55,112,0.22), transparent 24%), linear-gradient(180deg,#020814 0%,#07111c 50%,#030914 100%)",
  position: "relative",
  overflow: "hidden"
};

const heroLeftStyle = {
  borderRadius: 28,
  padding: 20,
  background: "linear-gradient(180deg, rgba(9,19,32,0.96), rgba(6,15,28,0.98))",
  border: "1px solid rgba(120,160,255,0.14)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const heroRightStyle = {
  borderRadius: 28,
  padding: 20,
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const panelStyle = {
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(180deg, rgba(9,19,32,0.92), rgba(6,15,28,0.96))",
  border: "1px solid rgba(120,160,255,0.14)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const sectionTitle = {
  fontSize: 24,
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

const glowA = {
  position: "absolute",
  top: 20,
  right: 120,
  width: 260,
  height: 260,
  borderRadius: "999px",
  background: "rgba(84,120,255,0.12)",
  filter: "blur(70px)",
  pointerEvents: "none"
};

const glowB = {
  position: "absolute",
  top: 220,
  left: 120,
  width: 220,
  height: 220,
  borderRadius: "999px",
  background: "rgba(76,219,255,0.08)",
  filter: "blur(70px)",
  pointerEvents: "none"
};

const glowC = {
  position: "absolute",
  bottom: 120,
  right: 320,
  width: 220,
  height: 220,
  borderRadius: "999px",
  background: "rgba(255,183,78,0.08)",
  filter: "blur(70px)",
  pointerEvents: "none"
};

