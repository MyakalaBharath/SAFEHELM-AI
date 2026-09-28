const express=require("express");
const cors=require("cors");
const path=require("path");
const app=express();
const PORT=process.env.PORT||5000;
app.use(cors());
app.use(express.json());

let mode=true;
let hazardUntil=0;
let last={temperature:31.2,gas:18,motion:.98,heart:78};
let incidents=[];

function telemetry(){
  const hazard=Date.now()<hazardUntil;
  if(hazard){
    last={temperature:58+Math.random()*4,gas:125+Math.random()*35,motion:2.6+Math.random()*.8,heart:105+Math.random()*12};
  }else{
    last={temperature:30+Math.random()*4,gas:12+Math.random()*14,motion:.94+Math.random()*.12,heart:72+Math.random()*12};
  }
  return last;
}
function evaluate(t){
  let score=0, reasons=[];
  if(t.temperature>45){score+=30;reasons.push("high temperature")}
  else if(t.temperature>38){score+=12;reasons.push("temperature rising")}
  if(t.gas>100){score+=45;reasons.push("gas anomaly")}
  else if(t.gas>50){score+=20;reasons.push("gas elevated")}
  if(t.motion>2.2){score+=35;reasons.push("impact/fall signature")}
  if(t.heart>110){score+=15;reasons.push("vital signal elevated")}
  score=Math.min(100,score);
  const label=score>=70?"CRITICAL":score>=30?"ELEVATED":"LOW";
  const message=score>=70?"Immediate hazard detected. Alert worker and supervisor.":score>=30?"Conditions require attention and continued monitoring.":"Environmental conditions are within safe operating limits.";
  return {score,label,message,reasons,stage:score>=70?"ANALYZE → REASON → ACT: ALERT + EVACUATE":score>=30?"ANALYZE → REASON → ACT: WATCH":"ANALYZE → REASON → ACT: MONITOR"};
}
function makeIncidents(r,t){
  if(r.label==="CRITICAL" && (incidents.length===0 || Date.now()-new Date(incidents[incidents.length-1].timestamp).getTime()>5000)){
    incidents.push({timestamp:new Date().toISOString(),severity:"CRITICAL",title:"Multi-sensor hazard detected",detail:`${r.reasons.join(", ")}. Worker-01 / Zone A.`});
  }
}
function state(){
  const t=telemetry(),r=evaluate(t); makeIncidents(r,t);
  const alerts=r.label==="CRITICAL"?r.reasons.map(x=>({title:x.toUpperCase(),detail:"SAFEHELM AI recommends immediate supervisor response.",time:new Date().toLocaleTimeString()})):[];
  return {mode,telemetry:t,risk:r,alerts,incidents,device:{id:"SAFEHELM-ESP32-01",gps:"Zone A",online:true}};
}
app.get("/api/health",(req,res)=>res.json({ok:true,service:"SAFEHELM backend",time:new Date().toISOString()}));
app.get("/api/state",(req,res)=>res.json(state()));
app.get("/api/incidents",(req,res)=>res.json(incidents));
app.post("/api/demo/hazard",(req,res)=>{hazardUntil=Date.now()+15000;res.json({ok:true,message:"15-second hazard simulation started"});});
app.post("/api/demo/mode",(req,res)=>{mode=!!req.body.enabled;res.json({ok:true,mode});});

// ESP32-ready telemetry endpoint.
// POST JSON: {deviceId,temperature,gas,motion,heart,gps}
app.post("/api/telemetry",(req,res)=>{
  const b=req.body||{};
  if(typeof b.temperature!=="number"||typeof b.gas!=="number"||typeof b.motion!=="number")
    return res.status(400).json({ok:false,error:"temperature, gas and motion must be numbers"});
  last={temperature:b.temperature,gas:b.gas,motion:b.motion,heart:typeof b.heart==="number"?b.heart:last.heart};
  const r=evaluate(last); makeIncidents(r,last);
  res.json({ok:true,risk:r,receivedAt:new Date().toISOString()});
});

app.use(express.static(path.join(__dirname,"../frontend")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"../frontend/index.html")));
app.listen(PORT,()=>console.log(`SAFEHELM running on port ${PORT}`));
