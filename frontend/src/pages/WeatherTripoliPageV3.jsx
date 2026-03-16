import React from "react";
import WeatherTripoliPage from "./WeatherTripoliPage.jsx";

export default function WeatherTripoliPageV3() {
  return (
    <div className="weather-v4-shell">
      <style>{`
        .weather-v4-shell{
          width:100%;
        }

        .weather-v4-command{
          width:100%;
          max-width:1720px;
          margin:0 auto 14px auto;
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap:12px;
        }

        .weather-v4-chip{
          border-radius:18px;
          padding:12px 14px;
          border:1px solid rgba(255,255,255,.08);
          background:
            radial-gradient(220px 90px at 100% 0%, rgba(70,120,255,.14), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
          box-shadow:0 14px 40px rgba(0,0,0,.18);
        }

        .weather-v4-chip-label{
          font-size:10px;
          letter-spacing:.8px;
          text-transform:uppercase;
          color:#8fb6ea;
          font-weight:900;
          margin-bottom:6px;
        }

        .weather-v4-chip-value{
          font-size:14px;
          color:#f2f7ff;
          font-weight:900;
          line-height:1.2;
        }

        .weather-v4-shell .wt-wrap{
          width:100% !important;
          max-width:1720px !important;
          gap:18px !important;
        }

        .weather-v4-shell .wt-hero,
        .weather-v4-shell .wt-mid{
          gap:16px !important;
          align-items:stretch !important;
        }

        .weather-v4-shell .wt-livebox{
          position:relative !important;
          overflow:hidden !important;
          border-radius:32px !important;
          padding:28px !important;
          border:1px solid rgba(120,210,255,.22) !important;
          background:
            radial-gradient(920px 420px at 12% 12%, rgba(40,120,255,.22), transparent 58%),
            radial-gradient(620px 280px at 88% 18%, rgba(0,255,200,.10), transparent 55%),
            radial-gradient(520px 240px at 50% 100%, rgba(255,180,60,.08), transparent 58%),
            linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.045)) !important;
          box-shadow:
            0 36px 110px rgba(0,0,0,.40),
            inset 0 1px 0 rgba(255,255,255,.09),
            0 0 0 1px rgba(90,150,255,.10) !important;
          backdrop-filter:blur(14px) !important;
        }

        .weather-v4-shell .wt-livebox::before{
          content:"WEATHER COMMAND";
          position:absolute;
          top:14px;
          right:18px;
          font-size:10px;
          letter-spacing:1px;
          font-weight:900;
          color:#9bd1ff;
          opacity:.9;
        }

        .weather-v4-shell .wt-livebox::after{
          content:"";
          position:absolute;
          inset:auto 0 0 0;
          height:2px;
          background:linear-gradient(90deg, rgba(0,0,0,0), rgba(98,196,255,.92), rgba(0,255,200,.55), rgba(0,0,0,0));
          opacity:.95;
        }

        .weather-v4-shell .wt-livebox-title{
          font-size:12px !important;
          letter-spacing:.9px !important;
          color:#8fb6ea !important;
          text-transform:uppercase !important;
          font-weight:900 !important;
        }

        .weather-v4-shell .wt-livebox-temp{
          font-size:108px !important;
          line-height:.92 !important;
          letter-spacing:-3px !important;
          margin:12px 0 6px !important;
          color:#fff !important;
          text-shadow:
            0 12px 44px rgba(120,170,255,.16),
            0 0 24px rgba(255,255,255,.06);
        }

        .weather-v4-shell .wt-livebox-label{
          font-size:26px !important;
          font-weight:1000 !important;
          color:#eef6ff !important;
        }

        .weather-v4-shell .wt-livebox-sub{
          font-size:15px !important;
          color:#a9c7ec !important;
          opacity:.96 !important;
        }

        .weather-v4-shell .wt-livebox-badge{
          background:linear-gradient(180deg, rgba(255,72,90,.20), rgba(255,72,90,.10)) !important;
          border-color:rgba(255,95,112,.36) !important;
          box-shadow:0 0 0 1px rgba(255,95,112,.12), 0 10px 30px rgba(255,72,90,.12) !important;
          font-weight:1000 !important;
          transform:translateY(2px);
        }

        .weather-v4-shell .wt-livebox-grid{
          gap:14px !important;
          margin-top:24px !important;
        }

        .weather-v4-shell .wt-livebox-kpi{
          border-radius:20px !important;
          padding:16px !important;
          background:linear-gradient(180deg, rgba(7,18,36,.54), rgba(7,14,28,.34)) !important;
          border:1px solid rgba(255,255,255,.08) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.04) !important;
        }

        .weather-v4-shell .wt-livebox-kpi-label{
          font-size:10px !important;
          letter-spacing:.8px !important;
          color:#89abd2 !important;
        }

        .weather-v4-shell .wt-livebox-kpi-value{
          font-size:28px !important;
          line-height:1.05 !important;
          font-weight:1000 !important;
        }

        .weather-v4-shell .wt-live-side{
          gap:16px !important;
          grid-template-rows:auto auto 1fr;
        }

        .weather-v4-shell .wt-live-side-card{
          position:relative !important;
          overflow:hidden !important;
          border-radius:26px !important;
          padding:20px !important;
          background:
            radial-gradient(500px 180px at 100% 0%, rgba(70,120,255,.16), transparent 55%),
            linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.045)) !important;
          border:1px solid rgba(255,255,255,.08) !important;
          box-shadow:0 22px 60px rgba(0,0,0,.24) !important;
        }

        .weather-v4-shell .wt-live-side-card::after{
          content:"";
          position:absolute;
          inset:auto 0 0 0;
          height:1px;
          background:linear-gradient(90deg, rgba(0,0,0,0), rgba(90,160,255,.7), rgba(0,0,0,0));
          opacity:.8;
        }

        .weather-v4-shell .wt-live-side-title{
          font-size:11px !important;
          letter-spacing:.75px !important;
          text-transform:uppercase !important;
          font-weight:900 !important;
          color:#93b8e7 !important;
        }

        .weather-v4-shell .wt-live-side-big{
          font-size:34px !important;
          line-height:1 !important;
          letter-spacing:-1px !important;
          font-weight:1000 !important;
          color:#ffffff !important;
          text-shadow:0 8px 30px rgba(120,170,255,.10);
        }

        .weather-v4-shell .wt-live-side-note{
          font-size:13px !important;
          color:#a7c2e6 !important;
        }

        .weather-v4-shell .wt-mid > div:last-child{
          position:relative !important;
        }

        .weather-v4-shell .wt-mid > div:last-child::before{
          content:"RAIN OPS";
          position:absolute;
          top:-10px;
          right:18px;
          z-index:3;
          padding:6px 10px;
          border-radius:999px;
          font-size:10px;
          font-weight:1000;
          letter-spacing:.8px;
          color:#dcecff;
          background:rgba(80,120,255,.18);
          border:1px solid rgba(120,170,255,.22);
          backdrop-filter:blur(8px);
        }

        .weather-v4-shell .wt-mid > div:last-child > div,
        .weather-v4-shell .wt-hero > div:last-child > div{
          border-radius:20px !important;
        }

        .weather-v4-shell .wt-hour-scroll{
          padding-bottom:10px !important;
        }

        .weather-v4-shell .wt-hour-scroll > div{
          min-width:182px !important;
          border-radius:24px !important;
          padding:16px !important;
          background:
            radial-gradient(220px 80px at 100% 0%, rgba(255,140,0,.09), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)) !important;
          border:1px solid rgba(255,255,255,.10) !important;
          box-shadow:0 18px 46px rgba(0,0,0,.18) !important;
          transition:transform .15s ease, border-color .15s ease, box-shadow .15s ease !important;
          position:relative !important;
        }

        .weather-v4-shell .wt-hour-scroll > div:hover{
          transform:translateY(-2px) !important;
          border-color:rgba(120,190,255,.24) !important;
          box-shadow:0 24px 54px rgba(0,0,0,.24) !important;
        }

        .weather-v4-shell .wt-hour-scroll > div:first-child{
          transform:translateY(-1px);
          border-color:rgba(255,214,102,.40) !important;
          background:
            radial-gradient(260px 100px at 100% 0%, rgba(255,196,0,.14), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05)) !important;
          box-shadow:
            0 0 0 1px rgba(255,210,90,.11),
            0 28px 60px rgba(0,0,0,.24) !important;
        }

        .weather-v4-shell .wt-hour-scroll > div:first-child::after{
          content:"LIVE";
          position:absolute;
          top:12px;
          right:12px;
          font-size:10px;
          font-weight:1000;
          letter-spacing:.8px;
          color:#ffe28a;
          opacity:.95;
        }

        .weather-v4-shell .wt-hour-scroll > div > div:first-child{
          font-size:12px !important;
          color:#8fb3df !important;
          font-weight:800 !important;
        }

        .weather-v4-shell .wt-hour-scroll > div > div:nth-child(2){
          font-size:38px !important;
          margin-top:10px !important;
        }

        .weather-v4-shell .wt-hour-scroll > div > div:nth-child(3){
          font-size:15px !important;
          font-weight:1000 !important;
          margin-top:8px !important;
          color:#fff !important;
          min-height:38px !important;
        }

        .weather-v4-shell .wt-hour-scroll > div > div:nth-child(5),
        .weather-v4-shell .wt-hour-scroll > div > div:nth-child(6),
        .weather-v4-shell .wt-hour-scroll > div > div:nth-child(7){
          font-size:12px !important;
          color:#b2c7e8 !important;
        }

        @media (max-width: 1220px){
          .weather-v4-command{
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .weather-v4-shell .wt-livebox-temp{
            font-size:82px !important;
          }
        }

        @media (max-width: 760px){
          .weather-v4-command{
            grid-template-columns: 1fr;
          }

          .weather-v4-shell .wt-wrap{
            gap:14px !important;
          }

          .weather-v4-shell .wt-livebox{
            padding:18px !important;
            border-radius:24px !important;
          }

          .weather-v4-shell .wt-livebox-temp{
            font-size:62px !important;
            letter-spacing:-2px !important;
          }

          .weather-v4-shell .wt-livebox-label{
            font-size:19px !important;
          }

          .weather-v4-shell .wt-livebox-kpi-value{
            font-size:22px !important;
          }

          .weather-v4-shell .wt-live-side-big{
            font-size:28px !important;
          }

          .weather-v4-shell .wt-hour-scroll > div{
            min-width:154px !important;
            border-radius:20px !important;
          }
        }
      `}</style>

      <div className="weather-v4-command">
        <div className="weather-v4-chip">
          <div className="weather-v4-chip-label">Data Source</div>
          <div className="weather-v4-chip-value">Open-Meteo + MET Norway</div>
        </div>

        <div className="weather-v4-chip">
          <div className="weather-v4-chip-label">Engine</div>
          <div className="weather-v4-chip-value">Fusion V1 Active</div>
        </div>

        <div className="weather-v4-chip">
          <div className="weather-v4-chip-label">Mode</div>
          <div className="weather-v4-chip-value">Command Center</div>
        </div>

        <div className="weather-v4-chip">
          <div className="weather-v4-chip-label">Status</div>
          <div className="weather-v4-chip-value">Live Weather Board</div>
        </div>
      </div>

      <WeatherTripoliPage />
    </div>
  );
}
