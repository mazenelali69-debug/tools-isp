import React from "react";
import WeatherTripoliPage from "./WeatherTripoliPage.jsx";

export default function WeatherTripoliPageV3() {
  return (
    <div className="weather-v3-shell">
      <style>{`
        .weather-v3-shell{
          width:100%;
        }

        .weather-v3-shell .wt-wrap{
          width:100% !important;
          max-width:1720px !important;
          gap:18px !important;
        }

        .weather-v3-shell .wt-hero,
        .weather-v3-shell .wt-mid{
          gap:16px !important;
          align-items:stretch !important;
        }

        .weather-v3-shell .wt-livebox{
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
            0 30px 90px rgba(0,0,0,.34),
            inset 0 1px 0 rgba(255,255,255,.08),
            0 0 0 1px rgba(80,140,255,.08) !important;
          backdrop-filter:blur(14px) !important;
        }

        .weather-v3-shell .wt-livebox::after{
          content:"";
          position:absolute;
          inset:auto 0 0 0;
          height:2px;
          background:linear-gradient(90deg, rgba(0,0,0,0), rgba(98,196,255,.92), rgba(0,255,200,.55), rgba(0,0,0,0));
          opacity:.95;
        }

        .weather-v3-shell .wt-livebox-title{
          font-size:12px !important;
          letter-spacing:.9px !important;
          color:#8fb6ea !important;
          text-transform:uppercase !important;
          font-weight:900 !important;
        }

        .weather-v3-shell .wt-livebox-temp{
          font-size:96px !important;
          line-height:.92 !important;
          letter-spacing:-3px !important;
          margin:12px 0 6px !important;
          color:#fff !important;
          text-shadow:0 8px 40px rgba(120,170,255,.16);
        }

        .weather-v3-shell .wt-livebox-label{
          font-size:24px !important;
          font-weight:1000 !important;
          color:#eef6ff !important;
        }

        .weather-v3-shell .wt-livebox-sub{
          font-size:15px !important;
          color:#a9c7ec !important;
        }

        .weather-v3-shell .wt-livebox-badge{
          background:linear-gradient(180deg, rgba(255,72,90,.20), rgba(255,72,90,.10)) !important;
          border-color:rgba(255,95,112,.36) !important;
          box-shadow:0 0 0 1px rgba(255,95,112,.12), 0 10px 30px rgba(255,72,90,.12) !important;
          font-weight:1000 !important;
        }

        .weather-v3-shell .wt-livebox-grid{
          gap:14px !important;
          margin-top:24px !important;
        }

        .weather-v3-shell .wt-livebox-kpi{
          border-radius:20px !important;
          padding:16px !important;
          background:linear-gradient(180deg, rgba(7,18,36,.54), rgba(7,14,28,.34)) !important;
          border:1px solid rgba(255,255,255,.08) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.04) !important;
        }

        .weather-v3-shell .wt-livebox-kpi-label{
          font-size:10px !important;
          letter-spacing:.8px !important;
          color:#89abd2 !important;
        }

        .weather-v3-shell .wt-livebox-kpi-value{
          font-size:28px !important;
          line-height:1.05 !important;
          font-weight:1000 !important;
        }

        .weather-v3-shell .wt-live-side{
          gap:16px !important;
        }

        .weather-v3-shell .wt-live-side-card{
          border-radius:26px !important;
          padding:20px !important;
          background:
            radial-gradient(500px 180px at 100% 0%, rgba(70,120,255,.16), transparent 55%),
            linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.045)) !important;
          border:1px solid rgba(255,255,255,.08) !important;
          box-shadow:0 22px 60px rgba(0,0,0,.24) !important;
        }

        .weather-v3-shell .wt-live-side-title{
          font-size:11px !important;
          letter-spacing:.75px !important;
          text-transform:uppercase !important;
          font-weight:900 !important;
        }

        .weather-v3-shell .wt-live-side-big{
          font-size:34px !important;
          line-height:1 !important;
          letter-spacing:-1px !important;
          font-weight:1000 !important;
        }

        .weather-v3-shell .wt-live-side-note{
          font-size:13px !important;
          color:#a7c2e6 !important;
        }

        .weather-v3-shell .wt-hour-scroll{
          padding-bottom:10px !important;
        }

        .weather-v3-shell .wt-hour-scroll > div{
          min-width:176px !important;
          border-radius:24px !important;
          padding:16px !important;
          background:
            radial-gradient(220px 80px at 100% 0%, rgba(255,140,0,.09), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)) !important;
          border:1px solid rgba(255,255,255,.10) !important;
          box-shadow:0 18px 46px rgba(0,0,0,.18) !important;
          transition:transform .15s ease, border-color .15s ease, box-shadow .15s ease !important;
        }

        .weather-v3-shell .wt-hour-scroll > div:hover{
          transform:translateY(-2px) !important;
          border-color:rgba(120,190,255,.24) !important;
          box-shadow:0 24px 54px rgba(0,0,0,.24) !important;
        }

        .weather-v3-shell .wt-hour-scroll > div:first-child{
          border-color:rgba(255,210,90,.30) !important;
          background:
            radial-gradient(260px 100px at 100% 0%, rgba(255,196,0,.14), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05)) !important;
          box-shadow:0 0 0 1px rgba(255,210,90,.09), 0 24px 54px rgba(0,0,0,.22) !important;
        }

        .weather-v3-shell .wt-hour-scroll > div > div:first-child{
          font-size:12px !important;
          color:#8fb3df !important;
          font-weight:800 !important;
        }

        .weather-v3-shell .wt-hour-scroll > div > div:nth-child(2){
          font-size:34px !important;
          margin-top:10px !important;
        }

        .weather-v3-shell .wt-hour-scroll > div > div:nth-child(3){
          font-size:15px !important;
          font-weight:1000 !important;
          margin-top:8px !important;
          color:#fff !important;
        }

        .weather-v3-shell .wt-hour-scroll > div > div:nth-child(5),
        .weather-v3-shell .wt-hour-scroll > div > div:nth-child(6),
        .weather-v3-shell .wt-hour-scroll > div > div:nth-child(7){
          font-size:12px !important;
          color:#b2c7e8 !important;
        }

        .weather-v3-shell .wt-mid > div:last-child > div,
        .weather-v3-shell .wt-hero > div:last-child > div{
          border-radius:20px !important;
        }

        @media (max-width: 1220px){
          .weather-v3-shell .wt-livebox-temp{
            font-size:74px !important;
          }
        }

        @media (max-width: 760px){
          .weather-v3-shell .wt-wrap{
            gap:14px !important;
          }

          .weather-v3-shell .wt-livebox{
            padding:18px !important;
            border-radius:24px !important;
          }

          .weather-v3-shell .wt-livebox-temp{
            font-size:58px !important;
            letter-spacing:-2px !important;
          }

          .weather-v3-shell .wt-livebox-label{
            font-size:18px !important;
          }

          .weather-v3-shell .wt-livebox-kpi-value{
            font-size:22px !important;
          }

          .weather-v3-shell .wt-live-side-big{
            font-size:28px !important;
          }

          .weather-v3-shell .wt-hour-scroll > div{
            min-width:148px !important;
            border-radius:20px !important;
          }
        }
      `}</style>

      <WeatherTripoliPage />
    </div>
  );
}
