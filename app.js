const API = (localStorage.getItem("safehelm_api") || "http://localhost:5000").replace(/\/$/,"");
const $=id=>document.getElementById(id);
let telemetry=[], incidents=[], demoMode=true;

async function getState(){
  try{
    const r=await fetch(API+"/api/state"); const d=await r.json();
    $("connection").textContent="● BACKEND ONLINE"; $("connection").classList.add("online");
    render(d);
  }catch(e){
    $("connection").textContent="● DEMO FALLBACK"; $("connection").classList.remove("online");
    fallbackTick();
  }
}
function fallbackTick(){
  const t={temperature:31+Math.random()*2,gas:15+Math.random()*8,motion:.95+Math.random()*.1,heart:74+Math.random()*10};
  render({telemetry:t, risk:{score:12,label:"LOW",message:"Environmental conditions are within safe operating limits.",stage:"ANALYZE → REASON → ACT"},alerts:[],incidents});
}
function render(d){
  const t=d.telemetry||{}, r=d.risk||{};
  $("temp").textContent=(+t.temperature).toFixed(1)+"°C";
  $("gas").textContent=Math.round(t.gas)+" ppm";
  $("motion").textContent=(+t.motion).toFixed(2)+" g";
  $("heart").textContent=Math.round(t.heart)+" bpm";
  $("gasState").textContent=t.gas>100?"Elevated":t.gas>50?"Watch":"Normal";
  $("motionState").textContent=t.motion>2.2?"Impact detected":"Stable";
  $("score").textContent=Math.round(r.score||0);
  $("riskLabel").textContent=r.label||"LOW";
  $("aiMessage").textContent=r.message||"Monitoring.";
  $("agentStage").textContent=r.stage||"ANALYZE → REASON → ACT";
  $("meter").style.width=Math.min(100,Math.max(0,r.score||0))+"%";
  $("helmetState").textContent=r.label==="CRITICAL"?"CRITICAL":r.label==="ELEVATED"?"WARNING":"SAFE";
  $("helmetState").className="badge "+(r.label==="CRITICAL"?"critical":r.label==="ELEVATED"?"warn":"safe");
  draw(+t.gas||0);
  renderAlerts(d.alerts||[]);
  renderIncidents(d.incidents||incidents);
}
function renderAlerts(a){
  $("alertCount").textContent=a.length;
  $("alerts").innerHTML=a.length?a.map(x=>`<div class="alert-item"><b>${x.title}</b><div>${x.detail}</div><small>${x.time}</small></div>`).join(""):'<div class="empty">No active safety alerts.</div>';
}
function renderIncidents(list){
  if(!list.length){$("incidentList").innerHTML='<div class="empty">No incidents recorded in this session.</div>';return}
  $("incidentList").innerHTML=list.slice().reverse().slice(0,8).map(x=>`<div class="event ${x.severity.toLowerCase()}"><time>${new Date(x.timestamp).toLocaleTimeString()}</time><div><b>${x.title}</b><span>${x.detail}</span></div><span>${x.severity}</span></div>`).join("");
}
function draw(gas){
  const c=$("chart"),ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=210;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);
  telemetry.push(gas); if(telemetry.length>50)telemetry.shift();
  ctx.strokeStyle="#24564d";ctx.lineWidth=1; for(let y=20;y<h;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  ctx.strokeStyle="#56e7b7";ctx.lineWidth=2;ctx.beginPath();
  telemetry.forEach((v,i)=>{const x=i/(49)*w,y=h-20-(Math.min(v,160)/160)*(h-40);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
}
$("simulateBtn").onclick=async()=>{
  try{await fetch(API+"/api/demo/hazard",{method:"POST"});getState()}
  catch(e){alert("Start backend or use the built-in fallback.");}
};
$("modeBtn").onclick=async()=>{
  try{const r=await fetch(API+"/api/demo/mode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:!demoMode})});demoMode=!demoMode;$("modeBtn").textContent=demoMode?"LIVE SIMULATION":"DEMO PAUSED";getState()}catch(e){}
};
setInterval(getState,1000); getState();
