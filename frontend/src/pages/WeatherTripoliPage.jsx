import React, { useEffect, useMemo, useState } from "react";

const LAT = 34.4367;
const LON = 35.8497;
const TZ = "Asia/Beirut";
const DEG = String.fromCharCode(176);

function pad(v) {
  return String(v).padStart(2, "0");
}

function fmtHour(iso) {
  try {
    const d = new Date(iso);
    return `${pad(d.getHours())}:00`;
  } catch {
    return "--:--";
  }
}

function fmtDay(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
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
  if (code === 0) return "☀";
  if (code === 1 || code === 2) return "⛅";
  if (code === 3) return "☁";
  if (code === 45 || code === 48) return "🌫";
  if (code >= 51 && code <= 57) return "🌦";
  if (code >= 61 && code <= 67) return "🌧";
  if (code >= 71 && code <= 77) return "❄";
  if (code >= 80 && code <= 82) return "🌦";
  if (code >= 85 && code <= 86) return "🌨";
  if (code >= 95) return "⛈";
  return "🌡";
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
    99: "Heavy thunderstorm hail",
  };
  return map[code] || "Weather";
}

function weatherTone(code, rainProb) {
  if (Number(rainProb || 0) >= 60 || code >= 61) {
    return {
      accent: "#69c8ff",
      glow: "rgba(91,190,255,.18)",
      chip: "rgba(91,190,255,.12)",
      border: "rgba(91,190,255,.24)",
      bar: "linear-gradient(90deg, #56d7ff, #6f8fff)",
      state: "Rain Window",
    };
  }

  if (code === 0) {
    return {
      accent: "#ffd76a",
      glow: "rgba(255,215,106,.16)",
      chip: "rgba(255,215,106,.10)",
      border: "rgba(255,215,106,.22)",
      bar: "linear-gradient(90deg, #ffd76a, #ffb347)",
      state: "Clear Window",
    };
  }

  if (code >= 95) {
    return {
      accent: "#ff8d8d",
      glow: "rgba(255,120,120,.16)",
      chip: "rgba(255,120,120,.10)",
      border: "rgba(255,120,120,.24)",
      bar: "linear-gradient(90deg, #ff7a8f, #ffb26a)",
      state: "Storm Risk",
    };
  }

  return {
    accent: "#b7cbff",
    glow: "rgba(130,160,255,.12)",
    chip: "rgba(130,160,255,.08)",
    border: "rgba(130,160,255,.16)",
    bar: "linear-gradient(90deg, #7edcff, #7f86ff)",
    state: "Cloud Window",
  };
}

function makeUrl() {
  return (
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${LAT}&longitude=${LON}` +
    `&timezone=${encodeURIComponent(TZ)}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
    "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,cloud_cover" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max" +
    "&forecast_days=10"
  );
}

function getRainLabel(prob, mm) {
  const p = Number(prob || 0);
  const r = Number(mm || 0);
  if (p >= 70 || r >= 3) return "Heavy rain likely";
  if (p >= 40 || r >= 0.8) return "Light rain possible";
  return "No strong rain signal";
}

function getStatus(code, prob) {
  if (Number(prob || 0) >= 60 || code >= 61) return "Rain";
  if (code === 0) return "Clear";
  if (code >= 95) return "Storm";
  if (code === 3) return "Overcast";
  return "Cloudy";
}

function findNextRain(hourly) {
  return hourly.find((h) => Number(h.precipProb || 0) >= 35 || Number(h.precipMm || 0) > 0.1) || null;
}

function findRainStop(hourly, startIndex) {
  if (startIndex < 0) return null;
  for (let i = startIndex + 1; i < hourly.length; i += 1) {
    const h = hourly[i];
    if (Number(h.precipProb || 0) < 25 && Number(h.precipMm || 0) <= 0.05) {
      return h;
    }
  }
  return null;
}

function findStrongestHour(hourly) {
  return [...hourly]
    .slice(0, 24)
    .sort((a, b) => {
      const av = Number(a.precipMm || 0) * 10 + Number(a.precipProb || 0);
      const bv = Number(b.precipMm || 0) * 10 + Number(b.precipProb || 0);
      return bv - av;
    })[0] || null;
}

function HourlyCard({ hour, index, currentHourIndex }) {
  const tone = weatherTone(hour.weatherCode, hour.precipProb);
  const isCurrent = index === currentHourIndex;

  return (
    <div
      style={{
        minWidth: 148,
        borderRadius: 20,
        padding: 14,
        flex: "0 0 auto",
        background: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025)), ${tone.glow}`,
        border: `1px solid ${isCurrent ? tone.accent : tone.border}`,
        boxShadow: isCurrent
          ? `0 0 0 1px ${tone.border}, 0 18px 36px rgba(0,0,0,.22)`
          : "0 14px 28px rgba(0,0,0,.16)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isCurrent ? (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: ".08em",
            color: tone.accent,
            textTransform: "uppercase",
          }}
        >
          Now
        </div>
      ) : null}

      <div style={{ color: "#a9c0e6", fontSize: 12, fontWeight: 700 }}>{fmtHour(hour.time)}</div>
      <div style={{ marginTop: 10, fontSize: 28, lineHeight: 1 }}>{weatherIcon(hour.weatherCode)}</div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color: "#f8fbff" }}>
        {round(hour.tempC)}{DEG}
      </div>
      <div style={{ marginTop: 6, color: "#b7c9e4", fontSize: 12 }}>{weatherLabel(hour.weatherCode)}</div>

      <div
        style={{
          marginTop: 12,
          height: 7,
          borderRadius: 999,
          background: "rgba(255,255,255,.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Number(hour.precipProb || 0))}%`,
            height: "100%",
            background: tone.bar,
          }}
        />
      </div>

      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, color: "#d7e4f7" }}>
        Rain {round(hour.precipProb)}%
        <br />
        {one(hour.precipMm)} mm
        <br />
        Wind {one(hour.windKmh)} km/h
      </div>
    </div>
  );
}

function DailyCard({ day }) {
  const tone = weatherTone(day.weatherCode, day.precipProbMax);
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 16,
        background: `linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), ${tone.glow}`,
        border: `1px solid ${tone.border}`,
        boxShadow: "0 14px 30px rgba(0,0,0,.16)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: "#f4f8ff" }}>{fmtDay(day.date)}</div>
        <div style={{ fontSize: 28 }}>{weatherIcon(day.weatherCode)}</div>
      </div>

      <div style={{ color: "#a9c0e6", marginTop: 8, fontSize: 13 }}>{weatherLabel(day.weatherCode)}</div>

      <div style={{ display: "flex", alignItems: "end", gap: 10, marginTop: 14 }}>
        <div style={{ fontSize: 34, fontWeight: 900, color: "#fff" }}>
          {round(day.tempMaxC)}{DEG}
        </div>
        <div style={{ fontSize: 18, color: "#97afd0" }}>
          {round(day.tempMinC)}{DEG}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          height: 7,
          borderRadius: 999,
          background: "rgba(255,255,255,.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Number(day.precipProbMax || 0))}%`,
            height: "100%",
            background: tone.bar,
          }}
        />
      </div>

      <div style={{ marginTop: 12, color: "#d4e0f2", fontSize: 12, lineHeight: 1.75 }}>
        Rain chance: {round(day.precipProbMax)}%
        <br />
        Rain sum: {one(day.precipMm)} mm
        <br />
        Wind max: {round(day.windMaxKmh)} km/h
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 14,
        background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div style={{ color: "#8caed9", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 8, color: "#fff" }}>{value}</div>
    </div>
  );
}

function LinkButton({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        color: "#eef6ff",
        fontWeight: 800,
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14,
        padding: "12px 14px",
        background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
      }}
    >
      {children}
    </a>
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
      windKmh: data.hourly.wind_speed_10m?.[i],
      cloud: data.hourly.cloud_cover?.[i],
    }));
  }, [data]);

  const daily = useMemo(() => {
    if (!data?.daily?.time) return [];
    return data.daily.time.map((date, i) => ({
      date,
      weatherCode: data.daily.weather_code?.[i],
      tempMaxC: data.daily.temperature_2m_max?.[i],
      tempMinC: data.daily.temperature_2m_min?.[i],
      precipMm: data.daily.precipitation_sum?.[i],
      precipProbMax: data.daily.precipitation_probability_max?.[i],
      windMaxKmh: data.daily.wind_speed_10m_max?.[i],
    }));
  }, [data]);

  const next24 = useMemo(() => {
    if (!hourly.length) return [];
    const now = new Date();
    const idx = hourly.findIndex((h) => new Date(h.time) >= now);
    const start = idx >= 0 ? idx : 0;
    return hourly.slice(start, start + 24);
  }, [hourly]);

  const currentHourIndex = 0;

  const rainInfo = useMemo(() => {
    if (!hourly.length) {
      return { nextRain: null, stopRain: null, strongest: null };
    }
    const nextRain = findNextRain(hourly);
    const startIndex = nextRain ? hourly.findIndex((h) => h.time === nextRain.time) : -1;
    const stopRain = findRainStop(hourly, startIndex);
    const strongest = findStrongestHour(hourly);
    return { nextRain, stopRain, strongest };
  }, [hourly]);

  if (!data) {
    return <div style={pageStyle}>Loading Tripoli Weather System...</div>;
  }

  if (err) {
    return <div style={{ ...pageStyle, color: "#ffb4b4" }}>Weather load failed: {err}</div>;
  }

  const current = data.current || {};
  const tone = weatherTone(current.weather_code, current.precipitation);
  const currentTemp = round(current.temperature_2m);
  const currentLabel = weatherLabel(current.weather_code);
  const currentState = getStatus(current.weather_code, current.precipitation);
  const rainLabel = getRainLabel(current.precipitation, current.precipitation);

  return (
    <div style={pageStyle}>
      <style>{`
        .wt-wrap {
          width: 100%;
          max-width: 100%;
          margin: 0;
          display: grid;
          gap: 18px;
        }

        .wt-top {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
          gap: 18px;
        }

        .wt-mid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
          gap: 18px;
        }

        .wt-hour-scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 8px;
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

        @media (max-width: 1100px) {
          .wt-top,
          .wt-mid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .wt-title {
            font-size: 42px !important;
          }

          .wt-current-temp {
            font-size: 62px !important;
          }

          .wt-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .wt-daily-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={glowA} />
      <div style={glowB} />
      <div style={glowC} />

      <div className="wt-wrap">
        <section className="wt-top">
          <div
            style={{
              ...panelStyle,
              background: `radial-gradient(700px 260px at 15% 10%, ${tone.glow}, transparent 60%), linear-gradient(180deg, rgba(9,19,32,.96), rgba(6,15,28,.98))`,
              border: `1px solid ${tone.border}`,
            }}
          >
            <div style={{ color: "#8fb3df", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              Tripoli Weather
            </div>

            <div className="wt-title" style={{ fontSize: 56, fontWeight: 1000, marginTop: 10, lineHeight: 0.96 }}>
              Tripoli, Lebanon
            </div>

            <div style={{ color: "#9bbce5", marginTop: 12, fontSize: 15 }}>
              {currentLabel} - Updated {updatedAt}
            </div>

            <div
              style={{
                marginTop: 18,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                background: tone.chip,
                border: `1px solid ${tone.border}`,
                color: tone.accent,
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: tone.accent,
                  boxShadow: `0 0 12px ${tone.accent}`,
                }}
              />
              {tone.state}
            </div>

            <div
              className="wt-kpi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
                marginTop: 22,
              }}
            >
              <StatCard label="Feels Like" value={`${round(current.apparent_temperature)}${DEG}C`} />
              <StatCard label="Humidity" value={`${round(current.relative_humidity_2m)}%`} />
              <StatCard label="Wind" value={`${one(current.wind_speed_10m)} km/h`} />
              <StatCard label="Pressure" value={`${round(current.pressure_msl)} hPa`} />
            </div>
          </div>

          <div
            style={{
              ...panelStyle,
              background: `radial-gradient(580px 240px at 80% 10%, ${tone.glow}, transparent 60%), linear-gradient(180deg, rgba(9,19,32,.96), rgba(6,15,28,.98))`,
              border: `1px solid ${tone.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
              <div>
                <div
                  className="wt-current-temp"
                  style={{
                    fontSize: 88,
                    fontWeight: 1000,
                    lineHeight: 0.92,
                    letterSpacing: -3,
                    color: "#fff",
                  }}
                >
                  {currentTemp}{DEG}C
                </div>

                <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900, color: "#eef6ff" }}>
                  {currentState}
                </div>

                <div style={{ color: "#9bbce5", marginTop: 8, fontSize: 14 }}>
                  {rainLabel}
                </div>
              </div>

              <div style={{ fontSize: 72, lineHeight: 1 }}>{weatherIcon(current.weather_code)}</div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                marginTop: 18,
              }}
            >
              <StatCard label="Direction" value={`${round(current.wind_direction_10m)}${DEG}`} />
              <StatCard label="Gust" value={`${round(current.wind_gusts_10m)} km/h`} />
              <StatCard label="Cloud" value={`${round(current.cloud_cover)}%`} />
            </div>
          </div>
        </section>

        <section className="wt-mid">
          <div style={panelStyle}>
            <div style={sectionTitle}>Today Timeline</div>
            <div style={{ color: "#93aed0", fontSize: 13, marginTop: -6, marginBottom: 14 }}>
              Hour by hour rain, sky condition, temperature, and wind speed.
            </div>

            <div className="wt-hour-scroll">
              {next24.map((h, i) => (
                <HourlyCard key={h.time} hour={h} index={i} currentHourIndex={currentHourIndex} />
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitle}>Rain + Alerts</div>

            <div style={{ display: "grid", gap: 10 }}>
              <StatCard label="Next Rain" value={rainInfo.nextRain ? fmtHour(rainInfo.nextRain.time) : "No near rain"} />
              <StatCard label="Rain Stops" value={rainInfo.stopRain ? fmtHour(rainInfo.stopRain.time) : "-"} />
              <StatCard label="Strongest Hour" value={rainInfo.strongest ? fmtHour(rainInfo.strongest.time) : "-"} />
              <StatCard label="Current Rain" value={`${one(current.precipitation)} mm`} />
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <LinkButton href="https://www.rainviewer.com/map.html">RainViewer Radar</LinkButton>
              <LinkButton href="https://www.windy.com/34.436/35.850?radar,34.436,35.850,8">Windy Radar</LinkButton>
              <LinkButton href="https://www.ventusky.com/?p=34.44;35.85;8&l=rain-3h">Ventusky Rain Map</LinkButton>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}>10 Day Forecast</div>
          <div style={{ color: "#93aed0", fontSize: 13, marginTop: -6, marginBottom: 14 }}>
            Daily max, min, rain probability, rain total, and wind maximum.
          </div>

          <div
            className="wt-daily-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 14,
            }}
          >
            {daily.map((d) => (
              <DailyCard key={d.date} day={d} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100%",
  padding: 20,
  color: "#eef6ff",
  background:
    "radial-gradient(circle at top right, rgba(38,55,112,0.18), transparent 24%), linear-gradient(180deg,#020814 0%,#07111c 50%,#030914 100%)",
  position: "relative",
  overflow: "hidden",
};

const panelStyle = {
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(180deg, rgba(9,19,32,.92), rgba(6,15,28,.96))",
  border: "1px solid rgba(120,160,255,.14)",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
};

const sectionTitle = {
  fontSize: 28,
  fontWeight: 1000,
  marginBottom: 12,
  color: "#f5f9ff",
};

const glowA = {
  position: "absolute",
  top: 20,
  right: 120,
  width: 260,
  height: 260,
  borderRadius: "999px",
  background: "rgba(84,120,255,0.10)",
  filter: "blur(70px)",
  pointerEvents: "none",
};

const glowB = {
  position: "absolute",
  top: 220,
  left: 120,
  width: 220,
  height: 220,
  borderRadius: "999px",
  background: "rgba(76,219,255,0.07)",
  filter: "blur(70px)",
  pointerEvents: "none",
};

const glowC = {
  position: "absolute",
  bottom: 120,
  right: 320,
  width: 220,
  height: 220,
  borderRadius: "999px",
  background: "rgba(255,183,78,0.06)",
  filter: "blur(70px)",
  pointerEvents: "none",
};
