"use strict";
// Editable plate of provisional mechanical and inspection architecture.
// A centerline is not a measured shaft, winch or structural penetration.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {transmissionModel,inspectionModel}=require("./maintenance-works");
const {shapeCells}=require("./geometry");
const K=p=>p.join(",");
const S=40,OX=72,OY=173,XMIN=6,YMIN=8;
const X=x=>OX+(x-XMIN+.5)*S,Y=y=>OY+(y-YMIN+.5)*S;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function makeMaintenancePlate(data){
 const source=data.tiles.find(t=>t.id==="riftwater_lock");
 const receiver=data.tiles.find(t=>t.id==="postern_bastion");
 if(!source||!receiver)throw Error("Maintenance plate needs source and receiver");
 const owner=buildCells(source),drives=transmissionModel(source,owner);
 const sourceAccess=inspectionModel(source),sinkAccess=inspectionModel(receiver);
 if(drives.length!==3||sourceAccess.length!==2||sinkAccess.length!==2)
  throw Error("Mechanism plate needs the three authored drives and four inspection bends");
 const footprints=new Set(source.rooms.flatMap(([,,shape])=>shapeCells(shape).map(K)));
 const canals=new Set(source.hydrology.channels.map(K));
 const out=[
  '<svg xmlns="http://www.w3.org/2000/svg" width="11in" height="8.5in" viewBox="0 0 1210 935" role="img" aria-label="Riftwater Lock mechanism and buried inspection access architectural study">',
  '<title>Riftwater Lock | Sluice transmission and lower maintenance plate</title>',
  '<rect width="1210" height="935" fill="#f5f1e8"/>',
  '<text x="70" y="48" font-family="Georgia,serif" font-size="26" fill="#203f42">RIFTWATER LOCK / SERVICE ENGINEERING</text>',
  '<text x="70" y="76" font-family="sans-serif" font-size="13" fill="#52615c">Editable plan, mechanical arrangement and downstream maintenance schedule | Assumed dimensions; not a construction drawing</text>',
  '<path d="M70 94H1140" stroke="#87918a" stroke-width="1"/>',
  '<text x="72" y="131" font-size="16" font-family="sans-serif" font-weight="700" fill="#284a4f">01  OVERHEAD TRANSMISSION PLAN</text>',
  '<text x="553" y="131" font-size="16" font-family="sans-serif" font-weight="700" fill="#284a4f">02  SCHEMATIC LONGITUDINAL DRIVE SECTIONS</text>',
  '<rect x="72" y="173" width="400" height="400" fill="#dcd8ce" stroke="#4e625f" stroke-width="1.5"/>'
 ];
 // Ten by ten half-cell excerpt with rock, rooms, service corridors and water
 // separated by genuinely editable named layers.
 out.push('<g id="mechanism-rock-context">');
 for(let y=8;y<18;y++)for(let x=6;x<16;x++){
  const k=x+","+y;
  const fill=canals.has(k)?"#a9c5ca":footprints.has(k)?"#f0e9dd":owner.has(k)?"#fffcf4":"#d9d5cc";
  out.push('<rect x="'+(X(x)-S/2)+'" y="'+(Y(y)-S/2)+'" width="'+S+'" height="'+S+'" fill="'+fill+'" />');
 }
 out.push('</g><g id="mechanism-masonry-edges" fill="none" stroke="#59635c" stroke-width="2.3">');
 for(let y=8;y<18;y++)for(let x=6;x<16;x++){
  if(!owner.has(x+","+y))continue;
  for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
   if(owner.has((x+dx)+","+(y+dy)))continue;
   const a=X(x)-S/2,b=Y(y)-S/2;
   const d=dx===1?"M"+(a+S)+","+b+"v"+S:
    dx===-1?"M"+a+","+b+"v"+S:
    dy===1?"M"+a+","+(b+S)+"h"+S:
    "M"+a+","+b+"h"+S;
   out.push('<path d="'+d+'"/>');
  }
 }
 out.push('</g><g id="technical-half-cell-grid" stroke="#9aa09a" stroke-width=".65" opacity=".45">');
 for(let i=1;i<10;i++)out.push('<path d="M'+(72+i*S)+',173v400 M72,'+(173+i*S)+'h400"/>');
 out.push('</g>');
 out.push('<g id="separate-overhead-drives" fill="none" stroke-linejoin="round" stroke-linecap="round">');
 const colors=["#285d69","#556576","#775a45"];
 drives.forEach((m,i)=>{
  const points=m.path.map(p=>X(p[0])+","+Y(p[1])).join(" ");
  out.push('<g data-drive="'+esc(m.id)+'" data-axis-ft="'+m.axis_ft+'">');
  out.push('<polyline points="'+points+'" stroke="#f5f1e8" stroke-width="9"/>');
  out.push('<polyline points="'+points+'" stroke="'+colors[i]+'" stroke-width="4"/>');
  for(const p of m.bores){
   out.push('<circle data-rock-bore="'+K(p)+'" cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="8" stroke="#a75e32" stroke-width="2" stroke-dasharray="2 2" fill="#f2e8da"/>');
  }
  for(const p of m.bearings){
   const x=X(p[0]),y=Y(p[1]);
   out.push('<path data-bearing="'+K(p)+'" d="M'+x+','+(y-6)+'l6,6 -6,6 -6,-6z" fill="#faf7ed" stroke="'+colors[i]+'" stroke-width="2"/>');
  }
  const [cx,cy]=m.path[0],ax=X(cx),ay=Y(cy),gate=m.gate_rack;
  out.push('<circle cx="'+ax+'" cy="'+ay+'" r="11" fill="#f8f4e9" stroke="'+colors[i]+'" stroke-width="2.5"/>');
  out.push('<path d="M'+(ax-7)+','+ay+'h14 M'+ax+','+(ay-7)+'v14" stroke="'+colors[i]+'" stroke-width="1.4"/>');
  out.push('<rect x="'+(X(gate[0])-7)+'" y="'+(Y(gate[1])-7)+'" width="14" height="14" fill="#e5e4dc" stroke="'+colors[i]+'" stroke-width="2.3"/>');
  out.push('<title>'+esc(m.control)+' through sleeved rock penetrations to '+esc(m.gate)+' (vertical rack assumed)</title></g>');
 });
 out.push('</g><g id="inspection-floor-hatches" fill="none" stroke="#775a3d" stroke-width="2">');
 sourceAccess.forEach(a=>{
  const [x,y]=a.surface;
  out.push('<rect data-cover="'+K(a.surface)+'" x="'+(X(x)-8)+'" y="'+(Y(y)-8)+'" width="16" height="16" fill="#f3dfbf"/>');
  out.push('<path d="M'+(X(x)-5)+','+Y(y)+'h10 M'+X(x)+','+(Y(y)-5)+'v10"/>');
 });
 out.push('</g>');
 out.push('<g id="underground-inspection-spur" fill="none" stroke="#9a6a45" stroke-width="3.4" stroke-dasharray="5 5">');
 sourceAccess.filter(a=>a.branch.length>1).forEach(a=>{
  out.push('<polyline data-from-bend="'+K(a.at)+'" points="'+a.branch.map(p=>X(p[0])+","+Y(p[1])).join(" ")+'"/>');
 });
 out.push('</g>');
 out.push('<g id="plan-key" font-size="12" font-family="sans-serif" fill="#485954">');
 out.push('<text x="74" y="600">2.5 ft per grid cell · colored paths are ABOVE walking floor.</text>');
 out.push('<text x="74" y="618">Orange circles: sleeved bores through UNCARVED stone.</text>');
 out.push('<text x="74" y="636">Diamonds: assumed bearings. Crossed squares: cleanout covers.</text>');
 out.push('</g>');
 // Sections intentionally schematic: the length and height are NOT to scale.
 out.push('<g id="drive-elevations" font-family="sans-serif">');
 drives.forEach((m,i)=>{
  const y=190+i*135;
  out.push('<g data-section-drive="'+m.id+'">');
  out.push('<text x="555" y="'+y+'" font-size="15" font-weight="700" fill="'+colors[i]+'">'+(i+1)+'. '+esc(m.control.toUpperCase())+' → '+esc(m.gate.toUpperCase())+'</text>');
  out.push('<path d="M558 '+(y+75)+'H1110" stroke="#8e948a" stroke-width="2.1"/>');
  out.push('<text x="564" y="'+(y+93)+'" font-size="10" fill="#59635e">walking floor / local zero</text>');
  out.push('<path d="M588 '+(y+20)+'H1010" stroke="'+colors[i]+'" stroke-width="5"/>');
  out.push('<circle cx="590" cy="'+(y+20)+'" r="10" fill="#ede9df" stroke="'+colors[i]+'" stroke-width="2"/>');
  out.push('<path d="M588 '+(y+20)+'v55" stroke="'+colors[i]+'" stroke-width="2" stroke-dasharray="4 3"/>');
  out.push('<path d="M1010 '+(y+20)+'v55" stroke="'+colors[i]+'" stroke-width="5"/>');
  for(let n=0;n<4;n++)out.push('<path d="M1010 '+(y+36+n*10)+'l7,5" stroke="'+colors[i]+'" stroke-width="1.5"/>');
  out.push('<path d="M780 '+(y+14)+'v12 M785 '+(y+14)+'v12" stroke="#343e3b" stroke-width="2"/>');
  out.push('<text x="835" y="'+(y+10)+'" font-size="12" fill="#424e4b">'+m.bores.length+' rock bores; '+m.bearings.length+' bearings</text>');
  out.push('<text x="842" y="'+(y+63)+'" font-size="12" fill="#424e4b">shaft axis +'+m.axis_ft+' ft (assumed)</text>');
  out.push('<text x="1040" y="'+(y+51)+'" font-size="11" fill="#424e4b">vertical rack</text>');
  out.push('</g>');
 });
 out.push('</g>');
 // Real lower route bend coordinates, not invented man-size access shafts.
 out.push('<g id="subfloor-inspection-schedule" font-family="sans-serif">');
 out.push('<path d="M540 652H1138" stroke="#adb0a7" stroke-width="1"/>');
 out.push('<text x="553" y="684" font-size="16" font-weight="700" fill="#284a4f">03  BURIED BENDS / SEALED CLEANOUTS</text>');
 const access=[...sourceAccess.map(a=>["RIFTWATER",a]),...sinkAccess.map(a=>["POSTERN",a])];
 access.forEach(([name,a],i)=>{
  const y=718+i*37;
  out.push('<circle cx="567" cy="'+(y-4)+'" r="5" fill="#a46a45"/>');
  out.push('<text x="585" y="'+y+'" font-size="12" fill="#293c39">'+name+' bend '+K(a.at)+' → dry cover '+K(a.surface)+
   ' · '+a.branch_length_ft.toFixed(1)+' ft lateral branch</text>');
 });
 out.push('</g>');
 out.push('<path d="M70 874H1140" stroke="#87918a" stroke-width="1"/>');
 out.push('<text x="72" y="896" font-family="sans-serif" font-size="11" fill="#5f6059">DESIGN LIMITS  |  Not measured: shaft torque, gearing, masonry bore sleeves, ceiling support, manhole depth, hydraulic capacity, outfall or backwater.</text>');
 out.push('<text x="72" y="914" font-family="sans-serif" font-size="11" fill="#5f6059">A sealed 1.5 ft nominal cleanout is not a traversable access shaft; the Postern terminal is still an unmapped outfall.</text>');
 out.push('</svg>');
 return out.join("\n")+"\n";
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/riftwater_maintenance_plate.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,makeMaintenancePlate(data));
 console.log("Editable service engineering study written to "+target);
}
module.exports={makeMaintenancePlate};
