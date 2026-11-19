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
module.exports={gateModel,applyGateStates,hydraulicGraph};
