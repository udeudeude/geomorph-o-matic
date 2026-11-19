"use strict";
// Original vector section of a mapped outfall lip and an unmapped receiver.
// Plan geometry is authored; elevations and water scenarios are assumed.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {shapeCells}=require("./geometry");
const {relayModel}=require("./subfloor-interfaces");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function makeOutfallSection(data){
 const tile=data.tiles.find(t=>t.id==="postern_bastion");
 if(!tile)throw Error("Outfall section requires Postern Bastion");
 const receiver=relayModel(tile),lip=receiver.outfall;
 const S=22,OX=70,OY=159,EX=648,END=1060,Y0=232;
 const X=x=>OX+(x+.5)*S,Y=y=>OY+(y+.5)*S;
 const Z=z=>Y0+(-7-z)*72;
 const z=receiver.grade.inverts_ft,water=lip.states;
 const out=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="16in" height="10in" viewBox="0 0 1200 760" role="img" aria-label="Postern underground outfall lip and conditional backwater section">',
 '<title>Postern Bastion | External masonry lip and receiving-water uncertainty</title>',
 '<rect width="1200" height="760" fill="#f3efe5"/>',
 '<text x="65" y="48" font-family="Georgia,serif" font-size="27" fill="#263e3d">POSTERN BASTION / EXTERIOR OUTFALL</text>',
 '<text x="65" y="75" font-family="sans-serif" font-size="12" fill="#4e625f">Level -1 | Authored masonry lip, provisional invert heights, uncharted receiving watercourse</text>',
 '<path d="M65 91H1134" stroke="#a6a393" stroke-width="1.3"/>',
 '<text x="70" y="127" font-family="sans-serif" font-size="16" fill="#274e58" font-weight="700">01  BURIED CONDUIT / SURFACE CONTEXT</text>',
 '<text x="635" y="127" font-family="sans-serif" font-size="16" fill="#274e58" font-weight="700">02  LONGITUDINAL SECTION / HEIGHT EXAGGERATED</text>',
 '<g id="outfall-plan-foundations" transform="translate('+OX+' '+OY+')">',
 '<rect width="440" height="440" fill="#d5d4c9" stroke="#385557" stroke-width="2"/>'
 ];
 for(const [key,kind] of buildCells(tile)){
  const [x,y]=key.split(",").map(Number);
  out.push('<rect x="'+x*S+'" y="'+y*S+'" width="'+S+'" height="'+S+'" fill="'+(kind==="hall"?"#faf7ee":"#e4d3b4")+'"/>');
 }
 for(const [name,,shape] of tile.rooms){
  const pts=shapeCells(shape),cx=pts.reduce((v,p)=>v+p[0]+.5,0)/pts.length*S;
  const cy=pts.reduce((v,p)=>v+p[1]+.5,0)/pts.length*S;
  out.push('<text x="'+cx+'" y="'+cy+'" text-anchor="middle" font-size="10" fill="#756648" font-family="sans-serif">'+esc(name.toUpperCase())+'</text>');
 }
 out.push('</g><g id="outfall-plan-grid" transform="translate('+OX+' '+OY+')" fill="none" stroke="#9da698" stroke-width=".7" opacity=".55">');
 for(let i=2;i<20;i+=2)out.push('<path d="M'+i*S+' 0V440 M0 '+i*S+'H440"/>');
 out.push('</g><g id="subfloor-outfall-route" stroke="#276c7d" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="7">');
 out.push('<polyline points="'+tile.hydrology.subfloor_relay.cells.map(p=>X(p[0])+","+Y(p[1])).join(" ")+'"/>');
 out.push('</g><g id="outfall-lip" data-level="-1" data-external-boundary="E:9">');
 out.push('<path d="M'+(OX+440)+' '+(Y(9)-13)+'v26" stroke="#ab643f" stroke-width="7"/>');
 out.push('<path d="M'+(OX+440)+' '+Y(9)+'h25" stroke="#276c7d" stroke-width="3" stroke-dasharray="5 4"/>');
 out.push('<title>Mapped underground masonry opening in eastern outer wall; continuation uncharted</title>');
 out.push('</g><g id="buried-cleanout-plan" stroke="#946746" fill="#f3e7d0" stroke-width="2">');
 for(const a of tile.hydrology.subfloor_relay.inspections)
  out.push('<rect x="'+(X(a.surface[0])-5)+'" y="'+(Y(a.surface[1])-5)+'" width="10" height="10"/>');
 out.push('</g><g font-family="sans-serif" font-size="11" fill="#556862">');
 out.push('<text x="70" y="630">Pale floor and rooms are overhead structural context.</text>');
 out.push('<text x="70" y="649">Blue route is NOT walkable. Grid: 5 feet per full square.</text>');
 out.push('</g>');
 const delta=(END-EX)/(z.length-1);
 out.push('<g id="outfall-longitudinal" font-family="sans-serif">');
 out.push('<rect x="'+EX+'" y="'+Z(receiver.grade.crown_ft)+'" width="'+(END-EX)+'" height="'+(Z(z.at(-1))-Z(receiver.grade.crown_ft)+12)+'" fill="#ddcdb4" opacity=".65"/>');
 out.push('<path d="M'+EX+','+Z(receiver.grade.crown_ft)+'H'+END+'" fill="none" stroke="#54544a" stroke-width="5"/>');
 out.push('<polyline points="'+z.map((v,i)=>(EX+i*delta)+","+Z(v)).join(" ")+'" fill="none" stroke="#286879" stroke-width="4"/>');
 out.push('<path d="M'+END+','+Z(receiver.grade.crown_ft)+'V'+Z(z.at(-1))+'" stroke="#a65a36" stroke-width="6"/>');
 out.push('<path d="M'+EX+','+Z(receiver.grade.max_tailwater_ft)+'H'+END+'" stroke="#5195a5" stroke-width="2" stroke-dasharray="4 5"/>');
 out.push('<text x="'+EX+'" y="'+(Z(receiver.grade.crown_ft)-14)+'" fill="#434941" font-size="11">Crown '+receiver.grade.crown_ft.toFixed(2)+' ft</text>');
 out.push('<text x="'+END+'" y="'+(Z(z.at(-1))+17)+'" text-anchor="end" fill="#2f6274" font-size="11">Lip invert '+lip.invert_ft.toFixed(2)+' ft</text>');
 out.push('</g><g id="receiver-water-envelopes" font-family="sans-serif">');
 for(const state of water){
  const yy=Z(state.water_surface_ft),col=state.crown_drowned?"#a34e37":"#2b889b";
  out.push('<path data-state="'+state.id+'" d="M'+(END-15)+','+yy+'h73" fill="none" stroke="'+col+'" stroke-width="3.5" stroke-dasharray="'+(state.crown_drowned?"9 4":"4 4")+'"/>');
  out.push('<text x="1132" y="'+(yy-10)+'" text-anchor="end" font-size="11" fill="'+col+'">'+
   (state.crown_drowned?"HIGH WATER / CROWN DROWNED":"ORDINARY / PARTLY SUBMERGED")+'</text>');
 }
 out.push('</g><g id="outfall-assumptions" font-family="sans-serif" font-size="12" fill="#455956">');
 out.push('<text x="641" y="642">Outfall lip: '+lip.nominal_clear_width_ft+'-ft nominal clear width.</text>');
 out.push('<text x="641" y="662">High water exceeds -8.75-ft modeled tailwater envelope.</text>');
 out.push('<text x="641" y="683" fill="#994c37">Potential backwater: no computed discharge or venting.</text>');
 out.push('</g><path d="M65 706H1135" stroke="#a6a393" stroke-width="1.2"/>');
 out.push('<text x="65" y="730" font-family="sans-serif" font-size="11" fill="#66675e">CONDITIONAL STUDY, NOT A CONSTRUCTION DRAWING. Outside watercourse, foundation depth and capacity are unverified.</text>');
 out.push('</svg>');
 return out.join("\n")+"\n";
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/postern_outfall_section.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,makeOutfallSection(data));
 console.log("Outfall section written "+target);
}
module.exports={makeOutfallSection};
