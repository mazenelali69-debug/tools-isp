import React, { useEffect, useState } from "react";

export default function WeatherTripoliPage() {

  const [data,setData] = useState(null);

  useEffect(()=>{

    async function load(){
      try{
        const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=34.4367&longitude=35.8497&current_weather=true");
        const j = await r.json();
        setData(j.current_weather);
      }catch(e){
        console.error(e);
      }
    }

    load();

    const t = setInterval(load,60000);

    return ()=>clearInterval(t);

  },[]);

  if(!data){
    return <div style={{padding:30,fontSize:20}}>Loading Tripoli Weather...</div>;
  }

  return (

    <div style={{padding:30}}>

      <h1>Tripoli Weather</h1>

      <div style={{fontSize:28,fontWeight:700}}>
        ?? Temperature: {data.temperature}°C
      </div>

      <div style={{fontSize:20,marginTop:10}}>
        ?? Wind: {data.windspeed} km/h
      </div>

      <div style={{fontSize:20}}>
        ?? Direction: {data.winddirection}°
      </div>

      <div style={{marginTop:20,opacity:.6}}>
        Updated every 60 seconds
      </div>

    </div>

  );
}
