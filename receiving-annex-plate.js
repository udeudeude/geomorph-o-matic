"use strict";
// Editable, layered plan/section for a specialist outfall annex.
// Coordinates are authored; hydraulic and foundation dimensions are assumptions.
const fs=require("node:fs"),path=require("node:path");
const {modelFromBlueprint,verifyAnnexPair}=require("./receiving-annex");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function makeReceivingAnnexPlate(data,spec){
 const {model:lip}=modelFromBlueprint(data,spec),audit=verifyAnnexPair(spec,lip);
 const S=19,OX=96,OY=160,SX=632,SY=242,DX=24;
 const cx=x=>OX+(x+.5)*S,cy=y=>OY+(y+.5)*S;
 const ex=i=>SX+i*DX,zy=z=>SY+(-6-z)*36;
 const ranges=spec.reaches,states=spec.receiving_levels_ft;
 const upper=spec.upper_terrace;
 const out=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="16in" height="10in" viewBox="0 0 1200 760" role="img" aria-label="Specialist exterior geomorph: receiving ravine, masonry apron, sediment pocket, high-water profile">',
 '<title>Postern Bastion | Exterior receiving-ravine architectural annex, study 01</title>',
 '<defs><pattern id="stone" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M0 11L11 0M-3 3L3-3" stroke="#938e78" stroke-width=".6" opacity=".48"/></pattern>',
 '<pattern id="riprap" width="15" height="12" patternUnits="userSpaceOnUse"><path d="M0 6L6 1L13 4L15 10L8 12L1 10Z" fill="none" stroke="#6d7468" stroke-width=".8"/></pattern>',
 '</defs>',
 '<rect width="1200" height="760" fill="#f3efe5"/>',
 '<text x="65" y="48" font-family="Georgia,serif" font-size="29" fill="#263c3a">THE RECEIVING RAVINE</text>',
 '<text x="66" y="73" font-family="sans-serif" font-size="12" fill="#5b625c">POSTERN BASTION / SPECIALIST EXTERIOR EDGE ANNEX / LEVEL -1 / ARCHITECTURAL STUDY</text>',
 '<path d="M65 91H1135" fill="none" stroke="#9c9b8a" stroke-width="1.4"/>',
 '<text x="95" y="123" font-family="sans-serif" font-size="16" font-weight="700" fill="#314f52">01  STONE CHANNEL AND SERVICE TERRACE / PLAN</text>',
 '<text x="631" y="123" font-family="sans-serif" font-size="16" font-weight="700" fill="#314f52">02  INVERT PROFILE / VERTICAL SCALE EXAGGERATED</text>',
 '<g id="natural-rock-context" transform="translate('+OX+' '+OY+')">',
 '<rect width="'+(20*S)+'" height="'+(20*S)+'" fill="#d7d0bc" stroke="#495b55" stroke-width="2"/>',
 '<path d="M0 104C90 135 150 101 240 87S360 111 380 72M0 246C72 216 140 266 234 277S337 256 380 295" stroke="#897e67" stroke-width="2.4" fill="none"/>',
 '<path d="M0 74C80 97 159 75 220 57S340 69 380 36M0 288C85 257 167 308 230 311S330 295 380 339" stroke="#9e9075" stroke-width="1.3" fill="none"/>',
 '<path d="M30 25Q118 50 179 28T365 16M7 350Q102 317 161 355T364 360" stroke="#b6a88d" stroke-width="1" fill="none"/>',
 '</g>',
 '<g id="watercourse-masonry-and-bed" stroke-linejoin="round">'
 ];
 const types={masonry_throat:["#34575c","#243e42"],stone_apron:["#608a91","#4c6870"],
  desilting_pocket:["#316d79","#36545a"],rocky_receiving_bed:["#497984","#435f60"]};
 for(const r of ranges){
  const top=cy(9)-r.clear_width_ft*S/5;
  const h=r.clear_width_ft*S/2.5;
  const x=OX+r.first*S,w=(r.last-r.first+1)*S;
  out.push('<rect data-treatment="'+r.id+'" x="'+x+'" y="'+(top-3)+'" width="'+w+'" height="'+(h+6)+'" fill="'+types[r.id][1]+'"/>');
  out.push('<rect x="'+x+'" y="'+top+'" width="'+w+'" height="'+h+'" fill="'+types[r.id][0]+'"/>');
 }
 out.push('</g>');
 out.push('<g id="flagstone-apron" stroke="#dfd0ad" stroke-width="1.2" opacity=".92">');
 for(let x=3;x<=7;x++)out.push('<path d="M'+(OX+x*S)+' '+(cy(9)-11)+'v22"/>');
 out.push('</g>');
 out.push('<g id="sediment-pocket" stroke="#d3b78b" fill="none" stroke-width="1.6">',
 '<rect x="'+(cx(10)-20)+'" y="'+(cy(9)-16)+'" width="40" height="32" stroke-dasharray="4 3"/>',
 '<path d="M'+(cx(10)-11)+' '+(cy(9)+7)+'l7 -6 6 4 8 -7"/>',
 '</g>');
 out.push('<g id="rock-protection" stroke="#c8c5ad" stroke-width=".8" fill="none">');
 for(let x=12;x<20;x++){
  const xx=cx(x),yy=cy(9);
  out.push('<path d="M'+(xx-6)+' '+(yy-9)+'l5 -4 7 6 -4 5 -7 -1Z M'+(xx-3)+' '+(yy+5)+'l6 0 5 5 -6 3 -6 -3Z"/>');
 }
 out.push('</g>');
 out.push('<g id="dry-service-route" fill="none" stroke="#eee5cf" stroke-width="9" stroke-linecap="square" stroke-linejoin="round">',
 '<polyline points="'+upper.path.map(p=>cx(p[0])+","+cy(p[1])).join(" ")+'"/>',
 '</g><g fill="none" stroke="#806d55" stroke-width="1.4" stroke-dasharray="3 3">',
 '<polyline points="'+upper.path.map(p=>cx(p[0])+","+cy(p[1])).join(" ")+'"/>',
 '</g>');
 out.push('<g id="elevated-inspection-bridge" data-deck-ft="'+upper.bridge.deck_ft+'">',
 '<rect x="'+(cx(12)-7)+'" y="'+cy(upper.bridge.from_y)+'" width="14" height="'+((upper.bridge.to_y-upper.bridge.from_y)*S)+'" fill="#e1c99d" stroke="#594a3e" stroke-width="2"/>',
 '<path d="M'+(cx(12)-10)+' '+cy(7)+'v'+(4*S)+' M'+(cx(12)+10)+' '+cy(7)+'v'+(4*S)+'" stroke="#5c4d40" stroke-width="2.2"/>',
 '</g>');
 out.push('<g id="cleanout-landing" fill="#f4e0b9" stroke="#7f6143" stroke-width="2">',
 '<rect x="'+(cx(10)-8)+'" y="'+(cy(7)-8)+'" width="16" height="16"/>',
 '<circle cx="'+cx(10)+'" cy="'+cy(7)+'" r="4" fill="none"/>',
 '</g><g id="external-interface-marks" stroke-width="4" fill="none">',
 '<path d="M'+OX+' '+(cy(9)-12)+'v24" stroke="#b46b49"/>',
 '<path d="M'+(OX+380)+' '+(cy(9)-28)+'v56" stroke="#396474" stroke-dasharray="4 4"/>',
 '</g>');
 out.push('<g id="plan-annotations" font-family="sans-serif" font-size="11" fill="#394e4c">',
 '<text x="100" y="145">W:9 / MATCHED POSTERN LIP</text>',
 '<text x="316" y="145">OPEN RAVINE BEYOND EAST EDGE</text>',
 '<text x="106" y="565">Dry access from north edge; not an interchangeable surface portal.</text>',
 '<text x="106" y="583">Bridge crosses the water above assumed high water, not through it.</text>',
 '</g>');
 const minX=ex(0),maxX=ex(19);
 out.push('<g id="longitudinal-rock-section">',
 '<rect x="'+minX+'" y="'+zy(-6.5)+'" width="'+(maxX-minX)+'" height="'+(zy(-13.65)-zy(-6.5))+'" fill="#ddd1ba"/>',
 '<path d="M'+minX+' '+zy(-6.5)+'H'+maxX+'" stroke="#8e866f" stroke-width="2" stroke-dasharray="5 4"/>',
 '<path d="M'+minX+' '+zy(-8)+'H'+ex(2)+'V'+zy(spec.bed_ft[2])+'" stroke="#4c4c46" stroke-width="6" fill="none"/>',
 '<path d="M'+minX+' '+zy(lip.invert_ft)+'L'+minX+' '+zy(spec.bed_ft[0])+'" stroke="#a56643" stroke-width="3"/>',
 '<polyline points="'+spec.bed_ft.map((z,i)=>ex(i)+","+zy(z)).join(" ")+'" fill="none" stroke="#385e68" stroke-width="4" stroke-linejoin="round"/>',
 '<rect x="'+ex(8)+'" y="'+zy(spec.bed_ft[8])+'" width="'+(ex(12)-ex(8))+'" height="'+(spec.desilting_pocket.extra_depth_ft*36)+'" fill="url(#stone)" stroke="#86694b" stroke-width="1.4"/>',
 '</g>');
 out.push('<g id="erosion-treatment-section" stroke="#746e5d" stroke-width="1" fill="url(#riprap)">');
 out.push('<path d="M'+ex(12)+' '+(zy(spec.bed_ft[12])+3)+'L'+maxX+' '+(zy(spec.bed_ft[19])+3)+'v16H'+ex(12)+'Z"/>');
 out.push('</g>');
 out.push('<g id="receiving-water-levels" font-family="sans-serif" font-size="12">');
 for(const [name,level,col,dash] of [["ordinary",states.ordinary,"#2e839b","6 5"],["high",states.high,"#a8583e","12 4"]]){
  out.push('<path data-water-state="'+name+'" d="M'+(minX-6)+' '+zy(level)+'H'+(maxX+10)+'" fill="none" stroke="'+col+'" stroke-width="2.5" stroke-dasharray="'+dash+'"/>');
  out.push('<text x="'+(maxX+13)+'" y="'+(zy(level)-8)+'" text-anchor="end" fill="'+col+'">'+name.toUpperCase()+' '+level.toFixed(2)+' ft</text>');
 }
 out.push('</g>');
 out.push('<g id="service-bridge-section" stroke="#756348" stroke-width="4" fill="none">',
 '<path d="M'+(ex(12)-21)+' '+zy(upper.bridge.deck_ft)+'h42"/>',
 '<path d="M'+(ex(12)-13)+' '+zy(upper.bridge.deck_ft)+'v'+(zy(-6.5)-zy(upper.bridge.deck_ft))+' M'+(ex(12)+13)+' '+zy(upper.bridge.deck_ft)+'v'+(zy(-6.5)-zy(upper.bridge.deck_ft))+'"/>',
 '</g>');
 out.push('<g id="section-labels" font-family="sans-serif" font-size="11" fill="#3e5353">',
 '<text x="636" y="194">MASONRY THROAT</text><text x="790" y="194">FLAGGED APRON</text><text x="938" y="194">OPEN ROCK REACH</text>',
 '<text x="635" y="568">Nominal receiving fall: '+audit.receiving_drop_ft.toFixed(2)+' ft over '+audit.receiving_run_ft.toFixed(1)+' ft</text>',
 '<text x="635" y="586">Desilting pocket: 1-ft additional depression (assumed); access is above.</text>',
 '</g>');
 out.push('<path d="M65 606H1134" stroke="#aaa393" stroke-width="1.1"/>');
 out.push('<g id="legend-and-limits" font-family="sans-serif" font-size="12" fill="#435956">',
 '<text x="85" y="635" font-weight="700">ARCHITECTURAL LOGIC</text>',
 '<text x="85" y="656">2-ft throat / 3-ft apron / 5-ft pocket / 7.5-ft rock reach.</text>',
 '<text x="85" y="676">Seam drop: '+audit.source_seam_drop_ft.toFixed(2)+' ft. Continuous downstream bed.</text>',
 '<text x="635" y="635" font-weight="700">UNRESOLVED ENGINEERING</text>',
 '<text x="635" y="656">High water drowns upstream arch crown; no discharge calculation.</text>',
 '<text x="635" y="676">Scour, flood duration, rock strength and open-river tailwater unverified.</text>',
 '</g><path d="M65 706H1135" stroke="#a6a393" stroke-width="1.2"/>',
 '<text x="65" y="729" font-family="sans-serif" font-size="11" fill="#6c6b5e">SPECIALIST ATTACHMENT, NOT A STANDARD DUNGEON TILE. The external channel beyond the east edge is still unmapped.</text>',
 '</svg>'
 );
 return out.join("\n")+"\n";
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const spec=JSON.parse(fs.readFileSync(path.join(__dirname,"examples/receiving_annex.json"),"utf8"));
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/receiving_annex_plate.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,makeReceivingAnnexPlate(data,spec));
 console.log("Receiving annex plate written "+target);
}
module.exports={makeReceivingAnnexPlate};
