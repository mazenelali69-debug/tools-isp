import React from "react";

const nodes = [
{ id:"up1", label:"155.15.59.4", type:"upstream", x:500, y:40 },
{ id:"up2", label:"122.24.30.4", type:"upstream", x:650, y:40 },

{ id:"core1", label:"88.88.88.254", type:"core", x:450, y:160 },
{ id:"core2", label:"88.88.88.253", type:"core", x:550, y:160 },
{ id:"core3", label:"88.88.88.252", type:"core", x:650, y:160 },
{ id:"core4", label:"88.88.88.251", type:"core", x:750, y:160 },
{ id:"core5", label:"10.88.88.254", type:"core", x:350, y:160 },

{ id:"r1", label:"88.88.88.250", type:"router", x:200, y:320 },
{ id:"r2", label:"88.88.88.249", type:"router", x:300, y:320 },
{ id:"r3", label:"88.88.88.1", type:"router", x:400, y:320 },
{ id:"r4", label:"88.88.88.2", type:"router", x:500, y:320 },
{ id:"r5", label:"88.88.88.4", type:"router", x:600, y:320 },
{ id:"r6", label:"88.88.88.5", type:"router", x:700, y:320 },
{ id:"r7", label:"88.88.88.6", type:"router", x:800, y:320 },
{ id:"r8", label:"88.88.88.7", type:"router", x:900, y:320 },

{ id:"r9", label:"88.88.88.9", type:"router", x:250, y:420 },
{ id:"r10", label:"88.88.88.10", type:"router", x:350, y:420 },
{ id:"r11", label:"88.88.88.11", type:"router", x:450, y:420 },
{ id:"r12", label:"88.88.88.12", type:"router", x:550, y:420 },
{ id:"r13", label:"88.88.88.13", type:"router", x:650, y:420 },
{ id:"r14", label:"88.88.88.14", type:"router", x:750, y:420 },
{ id:"r15", label:"88.88.88.15", type:"router", x:850, y:420 },
{ id:"r16", label:"10.88.88.111", type:"router", x:950, y:420 }
];

const links = [
["up1","core1"],["up2","core2"],
["core1","core2"],["core2","core3"],["core3","core4"],["core1","core5"],

["core1","r1"],["core1","r2"],
["core2","r3"],["core2","r4"],
["core3","r5"],["core3","r6"],
["core4","r7"],["core4","r8"],

["core5","r9"],["core5","r10"],
["core2","r11"],["core2","r12"],
["core3","r13"],["core3","r14"],
["core4","r15"],["core4","r16"]
];

function nodeColor(type){
if(type==="upstream") return "#ffcc00";
if(type==="core") return "#00d4ff";
return "#00ff88";
}

export default function TopologyMapPage(){

const map={};
nodes.forEach(n=>map[n.id]=n);

return (
<div style={{background:"#0b0f14",height:"100%",padding:20}}>
<h2 style={{color:"#fff",marginBottom:20}}>ISP Backbone Topology</h2>

<svg width="1200" height="600">

{links.map((l,i)=>{
const a=map[l[0]];
const b=map[l[1]];
return (
<line key={i}
x1={a.x} y1={a.y}
x2={b.x} y2={b.y}
stroke="#3a4757"
strokeWidth="2"
/>
);
})}

{nodes.map(n=>(
<g key={n.id}>
<circle
cx={n.x}
cy={n.y}
r={16}
fill={nodeColor(n.type)}
stroke="#0b0f14"
strokeWidth="3"
/>
<text
x={n.x}
y={n.y+32}
textAnchor="middle"
fill="#fff"
fontSize="12"
>
{n.label}
</text>
</g>
))}

</svg>
</div>
);
}
