"use strict";
// Engineered canals are hydraulically distinct from pedestrian corridors.
// No flow rate or pressure is inferred: a channel is a bounded possible path.
const {gateModel} = require("./hydraulic-control");
const {terrainModel,terrainGraph,PORTALS} = require("./terrain");
const {distances} = require("./route-analysis");
const POS = p => p.join(",");
const EDGE = (a,b) => [a,b].sort().join("|");
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
function coordinate(owner,p,label) {
 if (!Array.isArray(p) || p.length !== 2 ||
     p.some(n => !Number.isInteger(n) || n < 0 || n > 19) ||
     !owner.has(POS(p))) throw Error("Invalid waterworks " + label + " position");
 return POS(p);
}
function hydraulicCanalGraph(canal,gates,states,walls=new Set()) {
 const blocked = new Set(gates.filter(g => states.get(g.id) === "closed").map(g => g.edge));
 const graph = new Map([...canal].map(p => [p,[]]));
 for (const p of canal) {
  const [x,y] = p.split(",").map(Number);
  for (const [dx,dy] of DIRS) {
   const q = POS([x+dx,y+dy]);
   if (canal.has(q) && !blocked.has(EDGE(p,q)) && !walls.has(EDGE(p,q))) graph.get(p).push(q);
  }
 }
 return graph;
}
function waterwayModel(owner,doors=[],hydrology={},terrain={}) {
 if (hydrology.channels === undefined) return null; // legacy authored flood studies
 if (!Array.isArray(hydrology.channels) || !hydrology.channels.length)
  throw Error("Engineered waterway requires occupied channel cells");
 const canal = new Set();
 for (const p of hydrology.channels) {
  const k = coordinate(owner,p,"channel");
  if (canal.has(k) || PORTALS.includes(k)) throw Error("Repeated or boundary waterway channel");
  canal.add(k);
 }
 const {water,barriers} = terrainModel(owner,terrain);
 for (const p of water) if (!canal.has(p)) throw Error("Existing water outside engineered waterway");
 const inlet = coordinate(owner,hydrology.intake,"intake");
 const outlet = coordinate(owner,hydrology.outlet,"outlet");
 if (!canal.has(inlet) || !canal.has(outlet) || inlet === outlet || !water.has(inlet))
  throw Error("Intake and outlet must occupy distinct channel cells; intake must be wet");
 const gates = gateModel(owner,doors,hydrology.gates||[]);
 for (const gate of hydrology.gates||[]) {
  if (!canal.has(POS(gate.a)) || !canal.has(POS(gate.b)))
   throw Error("Sluice cannot straddle dry pedestrian corridors");
 }
 const culverts=new Set();
 for (const c of hydrology.culverts||[]) {
  if (!Array.isArray(c) || c.length!==2) throw Error("Invalid hydraulic culvert");
  const a=coordinate(owner,c[0],"culvert"),b=coordinate(owner,c[1],"culvert");
  const edge=EDGE(a,b);
  const [ax,ay]=c[0],[bx,by]=c[1];
  if (!canal.has(a)||!canal.has(b)||Math.abs(ax-bx)+Math.abs(ay-by)!==1||
      owner.get(a)===owner.get(b)||culverts.has(edge))throw Error("Culvert must cross one unique masonry boundary");
  culverts.add(edge);
 }
 const walls=new Set();
 for (const p of canal) {
  const [x,y]=p.split(",").map(Number);
  for (const [dx,dy] of DIRS) {
   const q=POS([x+dx,y+dy]);
   if (canal.has(q)&&owner.get(p)!==owner.get(q)&&!culverts.has(EDGE(p,q)))walls.add(EDGE(p,q));
  }
 }
 // These are full-height architectural dividers, not merely painted lines.
 // They remain impermeable even when every sluice is lifted.
 const gateEdges=new Set(gates.map(g=>g.edge));
 for(const edge of barriers){
  if(gateEdges.has(edge)||culverts.has(edge))throw Error("Masonry partition cannot overlap sluice or culvert");
  const [a,b]=edge.split("|");
  if(canal.has(a)&&canal.has(b))walls.add(edge);
 }
 const allOpen = new Map(gates.map(g => [g.id,"open"]));
 if (!distances(hydraulicCanalGraph(canal,gates,allOpen,walls),inlet).has(outlet))
  throw Error("Engineered waterway cannot connect intake to outlet");
 if(hydrology.isolated_shutters!==undefined && typeof hydrology.isolated_shutters!=="boolean")
  throw Error("Invalid isolated-shutter contract");
 if(hydrology.isolated_shutters){
  if(gates.length<2)throw Error("Isolated shutters require multiple independently controlled branches");
  const claimed=new Set();
  for(const gate of gates){
   const states=new Map(gates.map(g=>[g.id,g.id===gate.id?"open":"closed"]));
   const reached=distances(hydraulicCanalGraph(canal,gates,states,walls),inlet);
   const fresh=[...reached].filter(p=>!water.has(p));
   if(!fresh.length||fresh.some(p=>claimed.has(p)))
    throw Error("Sluices do not isolate independent downstream receiving pockets");
   for(const p of fresh)claimed.add(p);
  }
 }
 return {canal,inlet,outlet,walls,culverts,partitions:new Set([...barriers].filter(e=>{
  const [a,b]=e.split("|");return canal.has(a)&&canal.has(b);
 }))};
}
// Potential reachability if exactly one shutter is lifted from an all-shut bank.
 // This is a hydraulic access test, not a simulation of flow velocity or head.
function sluiceImpact(owner,doors=[],hydrology={},terrain={}) {
 const model=waterwayModel(owner,doors,hydrology,terrain);
 if(!model)return [];
 const gates=gateModel(owner,doors,hydrology.gates||[]);
 const baseline=terrainModel(owner,terrain).water;
 const result=[];
 for(const gate of gates){
  const states=new Map(gates.map(g=>[g.id,g.id===gate.id?"open":"closed"]));
  const graph=hydraulicCanalGraph(model.canal,gates,states,model.walls);
  const seen=distances(graph,model.inlet);
  const newlyAccessible=[...seen].filter(p=>!baseline.has(p)).sort();
  result.push({gate:gate.id,newly_accessible_canals:newlyAccessible,
   potential_new_cells:newlyAccessible.length});
 }
 return result;
}
function controlModel(owner,doors=[],hydrology={},terrain={}) {
 if (hydrology.controls === undefined) return [];
 if (!Array.isArray(hydrology.controls)) throw Error("Invalid hydraulic controls");
 const gates = gateModel(owner,doors,hydrology.gates||[]);
 const ids = new Set(gates.map(g => g.id)),assigned = new Set(),occupied = new Set(),controlIds=new Set();
 const wet = terrainModel(owner,terrain).water;
 const controls = [];
 for (const control of hydrology.controls) {
  if (!control || typeof control.id !== "string" ||
      !/^[a-z][a-z0-9_-]*$/.test(control.id) ||
      control.kind !== "handwheel" || !ids.has(control.gate) ||
      assigned.has(control.gate) || controlIds.has(control.id)) throw Error("Invalid or repeated hydraulic control");
  const k = coordinate(owner,control.at,"control");
  if (owner.get(k) !== "hall" || wet.has(k) || occupied.has(k) || PORTALS.includes(k))
   throw Error("Hydraulic controls require unique dry service-gallery positions");
  controls.push({...control,key:k});
  assigned.add(control.gate);occupied.add(k);controlIds.add(control.id);
 }
 if (assigned.size !== gates.length) throw Error("Every sluice requires its own control station");
 return controls;
}
function controlAudit(owner,doors=[],hydrology={},terrain={}) {
 const controls = controlModel(owner,doors,hydrology,terrain);
 const graph = terrainGraph(owner,doors,terrain,"ordinary","dry");
 const reach = PORTALS.map(p => distances(graph,p));
 return controls.map(c => ({id:c.id,gate:c.gate,
  dry_portal_approaches:reach.filter(d => d.has(c.key)).length,
  reachable_from_northwest:reach[0].has(c.key)}));
}
// All symbols below are independent SVG layers and carry machine-readable IDs.
// Adit/outfall labels represent off-sheet connections, not surveyed elevations.
function waterworksSvg(owner,doors=[],hydrology={},terrain={},cellSize=24) {
 const model = waterwayModel(owner,doors,hydrology,terrain);
 const controls = controlModel(owner,doors,hydrology,terrain);
 if (!model && !controls.length) return [];
 const out = [];
 const S = cellSize;
 if (model) {
  out.push('<g id="engineered-canal-banks" fill="none" stroke-linejoin="miter">');
  for (const p of [...model.canal].sort()) {
   const [x,y]=p.split(",").map(Number);
   for (const [dx,dy] of DIRS) {
    if (model.canal.has(POS([x+dx,y+dy]))) continue;
    const X=x*S,Y=y*S;
    const d = dx===1?'M'+(X+S)+','+Y+'v'+S:
      dx===-1?'M'+X+','+Y+'v'+S:
      dy===1?'M'+X+','+(Y+S)+'h'+S:
      'M'+X+','+Y+'h'+S;
    out.push('<path d="'+d+'" stroke="#596461" stroke-width="2.2"/>');
   }
  }
  out.push('</g><g id="intake-and-outfall" font-family="sans-serif" font-size="9" font-weight="700" text-anchor="middle">');
  for (const [kind,p,letter] of [["intake",model.inlet,"I"],["outfall",model.outlet,"T"]]) {
   const [x,y]=p.split(",").map(Number);
   const X=(x+.5)*S,Y=(y+.5)*S;
   out.push('<g data-hydraulic-terminal="'+kind+'"><title>'+ (kind==="intake"?"Uncharted upstream intake adit":"Uncharted downstream tailrace outfall")+
    '</title><circle cx="'+X+'" cy="'+Y+'" r="6.4" fill="#f3eadd" stroke="#344e52" stroke-width="1.1"/>'+
    '<text x="'+X+'" y="'+(Y+3.1)+'" fill="#344e52">'+letter+'</text></g>');
  }
  out.push('</g>');
 }
 if (controls.length) {
  out.push('<g id="sluice-control-stations" fill="none" stroke="#3e4945" stroke-linecap="round">');
  for (const control of controls) {
   const [x,y] = control.at, X=(x+.5)*S,Y=(y+.4)*S;
   out.push('<g data-controls-gate="'+control.gate+'" data-control-id="'+control.id+'"><title>'+
    control.id.replace(/_/g," ")+' operates '+control.gate.replace(/_/g," ")+
    '</title><circle cx="'+X+'" cy="'+Y+'" r="8" fill="#e5dbc7" stroke-width="1.6"/>'+
    '<circle cx="'+X+'" cy="'+Y+'" r="2.1" fill="#586764"/>');
   for(let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    out.push('<path d="M'+(X+2.4*Math.cos(a)).toFixed(2)+','+(Y+2.4*Math.sin(a)).toFixed(2)+
     'L'+(X+7*Math.cos(a)).toFixed(2)+','+(Y+7*Math.sin(a)).toFixed(2)+'" stroke-width="1.3"/>');
   }
   out.push('</g>');
  }
  out.push('</g>');
 }
 return out;
}
module.exports={waterwayModel,hydraulicCanalGraph,sluiceImpact,controlModel,controlAudit,waterworksSvg};
