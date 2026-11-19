"use strict";
// Sluices are hydraulic barriers, not doors. Their state changes water
// permeability, never a character's ordinary access graph.
const {accessGraph}=require("./route-analysis");
const KEY=p=>p.join(",");
const EDGE=(a,b)=>[a,b].sort().join("|");
function gateModel(owner,doors=[],controls=[]){
 if(!Array.isArray(controls))throw Error("Hydraulic gates must be an array");
 const graph=accessGraph(owner,doors,"all"),ids=new Set(),edges=new Set(),gates=[];
 for(const gate of controls){
  if(!gate||typeof gate.id!=="string"||!/^[a-z][a-z0-9_-]*$/.test(gate.id)||
    ids.has(gate.id)||gate.kind!=="sluice"||
    !["open","closed"].includes(gate.default)||
    !Array.isArray(gate.a)||!Array.isArray(gate.b)||
    gate.a.length!==2||gate.b.length!==2||
    [...gate.a,...gate.b].some(n=>!Number.isInteger(n)))
     throw Error("Invalid or repeated hydraulic gate");
  const a=KEY(gate.a),b=KEY(gate.b),edge=EDGE(a,b);
  if(!owner.has(a)||!owner.has(b)||!graph.get(a)?.includes(b)||
    Math.abs(gate.a[0]-gate.b[0])+Math.abs(gate.a[1]-gate.b[1])!==1||
    gate.a.some(n=>n===0||n===19)||gate.b.some(n=>n===0||n===19)||
    edges.has(edge))throw Error("Gate must control one internal walkable edge");
  ids.add(gate.id);edges.add(edge);gates.push({id:gate.id,edge,default:gate.default});
 }
 return gates;
}
function applyGateStates(gates,previous=new Map(),changes={}){
 if(!changes||Array.isArray(changes)||typeof changes!=="object")throw Error("Invalid gate state changes");
 const state=new Map(gates.map(g=>[g.id,previous.get(g.id)||g.default]));
 for(const [id,value] of Object.entries(changes)){
  if(!state.has(id)||!["open","closed"].includes(value))throw Error("Unknown gate or gate state: "+id);
  state.set(id,value);
 }
 return state;
}
function hydraulicGraph(owner,doors,gates,states){
 const graph=accessGraph(owner,doors,"all");
 const closed=new Set(gates.filter(g=>states.get(g.id)==="closed").map(g=>g.edge));
 for(const [p,neighbors] of graph)graph.set(p,neighbors.filter(q=>!closed.has(EDGE(p,q))));
 return graph;
}

/**
 * Map symbols share the exact authored hydraulic edges. Render state may be
 * overridden for a scenario sheet without mutating the canonical blueprint.
 * These are cartographic gate symbols, not measured mechanical sections.
 */
function gateSvg(owner,doors=[],hydrology={},cellSize=24){
 const controls=hydrology.gates||[];
 const gates=gateModel(owner,doors,controls);
 if(!gates.length)return [];
 const states=applyGateStates(gates,new Map(),hydrology.render_gate_states||{});
 const out=['<g id="sluice-gates" fill="none" stroke-linejoin="round" stroke-linecap="square">'];
 for(const gate of controls){
  const state=states.get(gate.id),a=gate.a,b=gate.b;
  const horizontal=a[1]!==b[1];
  const x=(horizontal?a[0]:Math.max(a[0],b[0]))*cellSize;
  const y=(horizontal?Math.max(a[1],b[1]):a[1])*cellSize;
  out.push('<g data-gate-id="'+gate.id+'" data-state="'+state+'" transform="translate('+x+' '+y+')'+(horizontal?'':' rotate(90)')+'">');
  out.push('<title>'+gate.id.replace(/_/g," ")+' ('+state+')</title>');
  out.push('<path d="M0 -6V6 M'+cellSize+' -6V6" stroke="#454541" stroke-width="2.6"/>');
  if(state==="closed"){
   out.push('<rect x="2" y="-3.5" width="'+(cellSize-4)+'" height="7" fill="#585852" stroke="#272f30" stroke-width="1.5"/>');
   out.push('<path d="M5 -1.2H'+(cellSize-5)+' M5 1.2H'+(cellSize-5)+'" stroke="#c4bcab" stroke-width=".85"/>');
  }else{
   out.push('<rect x="2" y="-13" width="'+(cellSize-4)+'" height="4.5" fill="#d5c4a5" stroke="#403f39" stroke-width="1.5"/>');
   out.push('<path d="M'+(cellSize/2)+' -8V-3" stroke="#4d5653" stroke-width="1.35" stroke-dasharray="2 2"/>');
  }
  out.push('</g>');
 }
 out.push('</g>');
 return [out.join("\n")];
}

module.exports={gateModel,applyGateStates,hydraulicGraph,gateSvg};
