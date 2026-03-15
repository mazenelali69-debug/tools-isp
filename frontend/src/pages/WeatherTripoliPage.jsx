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

function mm(v) {
  return Number(v || 0).toFixed(1);
}

function round(v) {
  return Math.round(Number(v || 0));
}

function weatherText(code) {
  const map = {
    0: "Clear",
    1: "Mostly clear",
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
  return map[code] || `Code ${code}`;
}

function makeOpenMeteoUrl() {
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
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const r = await fetch(makeOpenMeteoUrl(), { cache: "no-store" });
        const j = await r.json();
        if (!dead) {
          setData(j);
          setErr("");
          setLoading(false);
          setUpdatedAt(new Date().toLocaleString("en-GB"));
        }
      } catch (e) {
        if (!dead) {
          setErr(String(e?.message || e));
          setLoading(false);
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
      tempMaxC: data.daily.temperature_2m_max?.[i],
      tempMinC: data.daily.temperature_2m_min?.[i],
      precipMm: data.daily.precipitation_sum?.[i],
      precipProbMax: data.daily.precipitation_probability_max?.[i],
      windMaxKmh: data.daily.wind_speed_10m_max?.[i],
      weatherCode: data.daily.weather_code?.[i]
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

  if (loading) {
    return (
      <div style={{ minHeight: "100%", padding: 24, background: "linear-gradient(180deg,#030914 0%,#07101a 100%)", color: "#eef6ff" }}>
        Loading Tripoli Weather Pro...
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ minHeight: "100%", padding: 24, background: "linear-gradient(180deg,#030914 0%,#07101a 100%)", color: "#ffb4b4" }}>
        Weather load failed: {err}
      </div>
    );
  }

  const current = data?.current || {};

  return (
    <div style={{ minHeight: "100%", padding: 20, background: "linear-gradient(180deg,#030914 0%,#07101a 100%)", color: "#eef6ff" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <section style={panelStyle}>
          <div style={{ color: "#7fa7d8", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Weather Tripoli Pro Max</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>Tripoli, Lebanon</div>
          <div style={{ color: "#9bbce5", marginTop: 6 }}>
            {weatherText(current.weather_code)} • Updated {updatedAt}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(120px, 1fr))", gap: 12, marginTop: 16 }}>
            <StatCard label="Temperature" value={`${round(current.temperature_2m)}°C`} />
            <StatCard label="Feels Like" value={`${round(current.apparent_temperature)}°C`} />
            <StatCard label="Wind" value={`${round(current.wind_speed_10m)} km/h`} />
            <StatCard label="Humidity" value={`${round(current.relative_humidity_2m)}%`} />
            <StatCard label="Pressure" value={`${round(current.pressure_msl)} hPa`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 12, marginTop: 12 }}>
            <MiniInfo label="Wind Direction" value={`${round(current.wind_direction_10m)}°`} />
            <MiniInfo label="Wind Gust" value={`${round(current.wind_gusts_10m)} km/h`} />
            <MiniInfo label="Next Rain" value={rainInfo.nextRainAt ? fmtHour(rainInfo.nextRainAt) : "No near rain"} />
            <MiniInfo label="Rain Stops" value={rainInfo.rainStopsAt ? fmtHour(rainInfo.rainStopsAt) : "-"} />
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          <div style={panelStyle}>
            <div style={sectionTitle}>Hourly Rain + Wind (next 24h)</div>
            <div style={{ display: "grid", gap: 8, maxHeight: 460, overflow: "auto", paddingRight: 4 }}>
              {next24.map((h) => (
                <div key={h.time} style={hourRowStyle(Number(h.precipProb || 0), Number(h.precipMm || 0))}>
                  <div style={{ fontWeight: 800 }}>{fmtHour(h.time)}</div>
                  <div>{round(h.tempC)}°C</div>
                  <div>{round(h.precipProb)}% rain</div>
                  <div>{mm(h.precipMm)} mm</div>
                  <div>{round(h.windKmh)} km/h</div>
                  <div style={{ color: "#9bbce5" }}>{weatherText(h.weatherCode)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitle}>Radar</div>
            <div style={{ color: "#9bbce5", lineHeight: 1.7 }}>
              This page is running frontend-only for safety.
              <br />
              Radar live links are ready below.
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <a href="https://www.rainviewer.com/map.html" target="_blank" rel="noreferrer" style={radarBtnStyle}>
                Open RainViewer Radar
              </a>
              <a href="https://www.windy.com/34.436/35.850?radar,34.436,35.850,8" target="_blank" rel="noreferrer" style={radarBtnStyle}>
                Open Windy Radar
              </a>
              <a href="https://www.ventusky.com/?p=34.44;35.85;8&l=rain-3h" target="_blank" rel="noreferrer" style={radarBtnStyle}>
                Open Ventusky Rain Map
              </a>
            </div>

            <div style={{ marginTop: 16, borderRadius: 16, padding: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Quick Summary</div>
              <div style={{ color: "#9bbce5", lineHeight: 1.7 }}>
                Current rain: {mm(current.precipitation)} mm
                <br />
                Cloud cover: {round(current.cloud_cover)}%
                <br />
                Weather code: {current.weather_code}
              </div>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}>10 Day Forecast</div>
          <div style={{ display: "grid", gap: 8 }}>
            {daily.map((d) => (
              <div key={d.date} style={dayRowStyle(Number(d.precipProbMax || 0))}>
                <div style={{ fontWeight: 800 }}>{fmtDay(d.date)}</div>
                <div>{weatherText(d.weatherCode)}</div>
                <div>{round(d.tempMaxC)}° / {round(d.tempMinC)}°</div>
                <div>{round(d.precipProbMax)}% rain</div>
                <div>{mm(d.precipMm)} mm</div>
                <div>{round(d.windMaxKmh)} km/h</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      padding: 14,
      background: "rgba(255,255,255,0.03)"
    }}>
      <div style={{ color: "#7fa7d8", fontSize: 11, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: 10,
      background: "rgba(255,255,255,0.02)"
    }}>
      <div style={{ color: "#7fa7d8", fontSize: 10, marginBottom: 5 }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const panelStyle = {
  border: "1px solid rgba(120,160,255,0.14)",
  borderRadius: 24,
  padding: 16,
  background: "#06101a",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 900,
  marginBottom: 12
};

function hourRowStyle(prob, mmVal) {
  const hot = prob >= 60 || mmVal >= 1.5;
  const warm = !hot && (prob >= 30 || mmVal >= 0.2);

  return {
    display: "grid",
    gridTemplateColumns: "80px 80px 100px 90px 90px 1fr",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 14,
    background: hot
      ? "rgba(255,84,104,0.12)"
      : warm
      ? "rgba(255,200,92,0.10)"
      : "rgba(255,255,255,0.03)",
    border: hot
      ? "1px solid rgba(255,84,104,0.18)"
      : warm
      ? "1px solid rgba(255,200,92,0.16)"
      : "1px solid rgba(255,255,255,0.05)"
  };
}

function dayRowStyle(prob) {
  const hot = prob >= 60;
  const warm = !hot && prob >= 30;

  return {
    display: "grid",
    gridTemplateColumns: "110px 180px 140px 110px 90px 110px",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 14,
    background: hot
      ? "rgba(255,84,104,0.12)"
      : warm
      ? "rgba(255,200,92,0.10)"
      : "rgba(255,255,255,0.03)",
    border: hot
      ? "1px solid rgba(255,84,104,0.18)"
      : warm
      ? "1px solid rgba(255,200,92,0.16)"
      : "1px solid rgba(255,255,255,0.05)"
  };
}

const radarBtnStyle = {
  display: "block",
  textDecoration: "none",
  color: "#eef6ff",
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.04)"
};