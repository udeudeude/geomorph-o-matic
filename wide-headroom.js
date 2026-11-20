"use strict";
// Fictional ceiling-clearance scenarios attached to authored wide cave floors.
// This is not a cave survey, roof-load model or certified passage clearance.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainGraph}=require("./terrain");
const {distances}=require("./route-analysis");
const {inspectTile,boundaryCell}=require("./seam-profiles");
const {applyAbsoluteVault}=require("./wide-vault-datum");

const WIDTH_FEET=2.5;
const POSTURES=Object.freeze({standing:6,crouching:4,crawling:2.5});
const key=([x,y])=>x+","+y;
const xy=s=>s.split(",").map(Number);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function roofModel(owner,scenario,profile="cave-wide-v1",terrain){
  if(!(owner instanceof Map))throw Error("Roof scenario requires the canonical floor Map");
  if(!scenario||scenario.status!=="hypothetical"||!Number.isFinite(scenario.baseline_feet)||
      scenario.baseline_feet<6||scenario.baseline_feet>25||
      !Number.isFinite(scenario.mouth_crown_feet)||
      scenario.mouth_crown_feet<6||scenario.mouth_crown_feet>scenario.baseline_feet||
      !Array.isArray(scenario.zones)||!scenario.zones.length)
    throw Error("Invalid hypothetical roof scenario");
  const taperRate=scenario.throat_transition_feet_per_half_cell;
  if(taperRate!==undefined&&(!Number.isFinite(taperRate)||taperRate<0||taperRate>0.5))
    throw Error("Invalid hypothetical entrance-to-vault crown transition");
  const floors=new Map([...owner.keys()].map(p=>[p,scenario.baseline_feet]));
  const protectedCells=new Set();
  for(const side of ["N","E","S","W"])for(const o of [4,5,14,15])for(let depth=0;depth<2;depth++)
    protectedCells.add(key(boundaryCell(side,o,depth)));
  if(profile!=="cave-wide-v1")throw Error("Roof scenarios currently require wide mouths");
  for(const cell of protectedCells){
    if(!owner.has(cell))throw Error("An explicitly modeled five-foot mouth lacks floor");
    floors.set(cell,scenario.mouth_crown_feet);
  }
  // Shape the first interior feet of every wide mouth into its larger vault.
  // Propagate across genuinely occupied adjacent floor, never across bare rock.
  // These are assumed LOCAL overhead clearances, not surveyed roof elevations.
  const mouthDistances=new Map([...protectedCells].map(p=>[p,0]));
  const queue=[...protectedCells];
  for(let i=0;i<queue.length;i++){
    const p=queue[i],distance=mouthDistances.get(p),[x,y]=xy(p);
    for(const q of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].map(key)){
      if(!owner.has(q)||mouthDistances.has(q))continue;
      mouthDistances.set(q,distance+1);
      queue.push(q);
    }
  }
  if(mouthDistances.size!==owner.size)throw Error("Roof model has floor not connected to any wide mouth");
  const tapered=[];
  if(taperRate!==undefined){
    for(const [p,distance] of mouthDistances){
      const height=Math.min(scenario.baseline_feet,scenario.mouth_crown_feet+taperRate*distance);
      floors.set(p,height);
      if(distance>0&&height<scenario.baseline_feet)
        tapered.push({cell:p,distance_from_mouth_half_cells:distance,clearance_feet:height});
    }
  }
  const occupied=new Set(),ids=new Set(),zones=[];
  for(const zone of scenario.zones){
    if(!zone||typeof zone.id!=="string"||!/^[a-z][a-z0-9_-]+$/.test(zone.id)||
        ids.has(zone.id)||typeof zone.interpretation!=="string"||zone.interpretation.length<12||
        !Number.isFinite(zone.clearance_feet)||zone.clearance_feet<2.5||
        zone.clearance_feet>=scenario.baseline_feet||
        !Array.isArray(zone.cells)||zone.cells.length<2)
      throw Error("Invalid low-roof zone");
    ids.add(zone.id);
    const cells=new Set();
    for(const p of zone.cells){
      if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||
          p.some(n=>n<0||n>=20)||!owner.has(key(p))||
          protectedCells.has(key(p))||occupied.has(key(p))||cells.has(key(p)))
        throw Error("Low roof must cover unique occupied interior floor, never a protected mouth");
      cells.add(key(p));occupied.add(key(p));floors.set(key(p),zone.clearance_feet);
    }
    const todo=[cells.values().next().value],seen=new Set(todo);
    for(let i=0;i<todo.length;i++){
      const [x,y]=xy(todo[i]);
      for(const q of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].map(key))
        if(cells.has(q)&&!seen.has(q)){seen.add(q);todo.push(q)}
    }
    if(seen.size!==cells.size)throw Error("Low-roof zone must be contiguous in the floor plan");
    zones.push({id:zone.id,interpretation:zone.interpretation,
      clearance_feet:zone.clearance_feet,cells:[...cells].sort((a,b)=>{const [x,y]=xy(a),[u,v]=xy(b);return y-v||x-u;})});
  }
  return applyAbsoluteVault(owner,scenario,terrain,{baseline_feet:scenario.baseline_feet,mouth_crown_feet:scenario.mouth_crown_feet,clearances:floors,zones,
    throat_transition_feet_per_half_cell:taperRate??null,
    tapered_cells:tapered.filter(x=>!occupied.has(x.cell)).sort((a,b)=>a.distance_from_mouth_half_cells-b.distance_from_mouth_half_cells||a.cell.localeCompare(b.cell)),
    mouth_distances:mouthDistances,
    status:"hypothetical design geometry, not measured or physically verified"});
}
function headroomGraph(graph,model,requiredFeet){
  if(!(graph instanceof Map)||!Number.isFinite(requiredFeet)||requiredFeet<=0)
    throw Error("Invalid headroom navigation input");
  const admitted=p=>model.clearances.has(p)&&model.clearances.get(p)>=requiredFeet;
  return new Map([...graph].filter(([p])=>admitted(p))
    .map(([p,neighbors])=>[p,neighbors.filter(admitted)]));
}
function analyze(tile){
  const floor=buildCells(tile),seams=inspectTile(tile,"cave-wide-v1");
  const roof=roofModel(floor,tile.roof_scenario,tile.seam_profile,tile.terrain);
  const walking=terrainGraph(floor,doorEdges(tile),tile.terrain||{},"ordinary","dry");
  const mouths=seams.mouths.flatMap(m=>m.offsets.map(n=>key(boundaryCell(m.side,n))));
  const reference=headroomGraph(walking,roof,POSTURES.crawling);
  const fromStart=distances(reference,"4,0");
  if(fromStart.size!==floor.size)throw Error("Crawling scenario does not reach all authored floor");
  const postures={};
  for(const [name,minFeet] of Object.entries(POSTURES)){
    const graph=headroomGraph(walking,roof,minFeet);
    const all=mouths.map(p=>distances(graph,p));
    let reachablePairs=0,changedPairs=0,longestDetour=0,unreachablePairs=0;
    for(let i=0;i<mouths.length;i++)for(let j=i+1;j<mouths.length;j++){
      const after=all[i].get(mouths[j]),before=distances(reference,mouths[i]).get(mouths[j]);
      if(after===undefined){unreachablePairs++;continue}
      reachablePairs++;
      if(after>before){changedPairs++;longestDetour=Math.max(longestDetour,after-before)}
    }
    postures[name]={minimum_assumed_clearance_feet:minFeet,
      reachable_floor_cells:distances(graph,"4,0").size,
      reachable_mouth_cells:mouths.filter(p=>distances(graph,"4,0").has(p)).length,
      reachable_mouth_pairs:reachablePairs,unreachable_mouth_pairs:unreachablePairs,
      mouth_pairs_with_longer_traversal:changedPairs,
      longest_extra_walk_half_cells:longestDetour};
  }
  if(postures.standing.reachable_mouth_cells!==16||postures.standing.unreachable_mouth_pairs!==0)
    throw Error("Standing scenario strands an exterior wide-mouth connection");
  const examples=[["0,4","19,4"],["4,0","14,0"]].map(([a,b])=>({
    from:a,to:b,crawling_half_cells:distances(reference,a).get(b),
    standing_half_cells:distances(headroomGraph(walking,roof,6),a).get(b)
  }));
  return {tile:tile.id,status:"unreleased geometric headroom hypothesis",
    evidence:"fictional roof-clearance assumptions; plan locations are registered to actual occupied floor",
    baseline_clearance_feet:roof.baseline_feet,modeled_mouth_crown_feet:roof.mouth_crown_feet,low_roof_zones:roof.zones,
    entrance_to_vault_transition:{feet_rise_per_half_cell:roof.throat_transition_feet_per_half_cell,
      modeled_transition_cells:roof.tapered_cells.length,
      clearance_bands_feet:[...new Set(roof.tapered_cells.map(c=>c.clearance_feet))].sort((a,b)=>a-b),
      interpretation:"A bounded fictional throat-to-vault roof transition, not a measurement of physical roof inclination."},
    postures,selected_traversals:examples,
    limitations:"No measured cave roof, geological stability or real-world access classification. Posture thresholds are gameplay scenarios."};
}
function ceilingSvg(owner,scenario,scale=24,terrain){
  if(!scenario)return [];
  const roof=roofModel(owner,scenario,"cave-wide-v1",terrain);
  const out=['<g id="ceiling-clearance" fill="none" stroke="#876d52" stroke-linecap="round">',
    '<title>Hypothetical low-ceiling zones; dashed marks denote overhead clearance, not walls</title>'];
  for(const zone of roof.zones){
    const cells=new Set(zone.cells),edges=[];
    for(const p of zone.cells){
      const [x,y]=xy(p);
      const sides=[
        [key([x,y-1]),[x,y,x+1,y]],
        [key([x+1,y]),[x+1,y,x+1,y+1]],
        [key([x,y+1]),[x,y+1,x+1,y+1]],
        [key([x-1,y]),[x,y,x,y+1]]
      ];
      for(const [adj,[a,b,c,d]] of sides)if(!cells.has(adj))
        edges.push("M"+(a*scale)+","+(b*scale)+"L"+(c*scale)+","+(d*scale));
    }
    out.push('<g data-roof-zone="'+zone.id+'" data-assumed-clearance-feet="'+zone.clearance_feet+'">');
    out.push('<path d="'+edges.join(" ")+'" stroke-width="1.4" stroke-dasharray="2 4" opacity=".85"/>');
    for(const p of zone.cells){
      const [x,y]=xy(p),a=x*scale,b=y*scale;
      out.push('<path data-roof-cell="'+p+'" d="M'+(a+scale*.31)+','+(b+scale*.25)+'l'+(scale*.25)+','+(scale*.5)+
        ' m'+(scale*.14)+','+(-scale*.5)+'l'+(scale*.2)+','+(scale*.4)+'" stroke-width="1.25" opacity=".8"/>');
    }
    out.push('</g>');
  }
  if(roof.absolute_vault_zones){
    out.push('<g id="'+(roof.elevated_bench_cells.length?'absolute-bench-vault':'absolute-cave-vault')+
      '" fill="none" stroke="#728b71" stroke-width="1" stroke-dasharray="4 3">');
    for(const zone of roof.absolute_vault_zones)for(const p of zone.cells){
      const [x,y]=xy(p),z=roof.absolute_roof_elevations_feet.get(p);
      for(const [dx,dy,d] of [[1,0,"M"+((x+1)*scale)+","+(y*scale)+"v"+scale],[-1,0,"M"+(x*scale)+","+(y*scale)+"v"+scale],[0,1,"M"+(x*scale)+"," + ((y+1)*scale)+"h"+scale],[0,-1,"M"+(x*scale)+","+(y*scale)+"h"+scale]]){
        const q=key([x+dx,y+dy]);if(roof.absolute_roof_elevations_feet.get(q)!==z)
          out.push('<path data-absolute-roof-cell="'+p+'" data-roof-elevation-feet="'+z+'" d="'+d+'"/>');
      }
    }
    for(const p of roof.bench_cells_below_standing_clearance){const [x,y]=xy(p);
      out.push('<path data-stooped-bench-cell="'+p+'" d="M'+(x+.25)*scale+','+(y+.4)*scale+'l'+(.5*scale)+',0m-'+(.5*scale)+','+(.2*scale)+'l'+(.5*scale)+',0" stroke="#9d593b" stroke-width="1.5" stroke-dasharray="none"/>');
    }
    out.push('</g>');
  }
  // Distinct from walls and constrictions: subdued dashed contours where the
  // authored ceiling height changes between adjacent, occupied floor cells.
  const pinched=new Set(roof.zones.flatMap(z=>z.cells));
  const authored=new Set((roof.absolute_vault_zones||[]).flatMap(z=>z.cells));
  const heightEdges=[];
  for(const [p,h] of roof.clearances){
    if(pinched.has(p)||authored.has(p))continue;
    const [x,y]=xy(p);
    for(const [dx,dy] of [[1,0],[0,1]]){
      const q=key([x+dx,y+dy]),other=roof.clearances.get(q);
      if(other===undefined||pinched.has(q)||authored.has(q)||other===h)continue;
      const d=dx?('M'+((x+1)*scale)+','+(y*scale)+'v'+scale):
        ('M'+(x*scale)+','+((y+1)*scale)+'h'+scale);
      heightEdges.push('<path data-crown-transition-edge="'+p+'|'+q+
        '" data-local-clearance-feet="'+h+'|'+other+'" d="'+d+'"/>');
    }
  }
  out.push('<g id="roof-entry-transitions" fill="none" stroke="#52776d" stroke-width=".9" stroke-dasharray="3 5">');
  out.push('<title>Hypothetical local ceiling-height contours from modular mouths into cave vaults; not walls or elevation survey</title>');
  out.push(...heightEdges,'</g>','</g>');
  return out;
}
function plate(reports){
  const w=1320,h=480,out=[
    '<svg xmlns="http://www.w3.org/2000/svg" width="16.5in" height="6in" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Plan-registered hypothetical low-ceiling design sections">',
    '<title>Wide cave low-roof envelopes, not survey drawings</title>',
    '<rect width="'+w+'" height="'+h+'" fill="#f1eee5"/>',
    '<text x="32" y="49" font-family="Georgia,serif" font-size="30" fill="#29362f">WIDE CAVE ROOF CONSTRICTIONS</text>',
    '<text x="33" y="73" font-family="sans-serif" font-size="13" fill="#637068">HYPOTHETICAL CLEARANCE ABOVE LOCAL FLOOR  /  HORIZONTAL AND VERTICAL SCALE BOTH 24 PX PER FOOT</text>'
  ];
  for(let idx=0;idx<reports.length;idx++){
    const r=reports[idx],z=r.low_roof_zones[0],left=24+idx*435,top=104;
    const floorY=top+266,cellW=2.5*24,baseline=r.baseline_clearance_feet;
    const roofY=floorY-z.clearance_feet*24;
    out.push('<g id="scenario-'+esc(r.tile)+'" transform="translate('+left+',0)" font-family="sans-serif">');
    out.push('<rect x="0" y="'+top+'" width="422" height="348" fill="#faf8f0" stroke="#c0c2b9"/>');
    out.push('<text x="18" y="'+(top+28)+'" font-size="17" font-family="Georgia,serif" fill="#29362f">'+esc(r.tile.replaceAll("_"," ").toUpperCase())+'</text>');
    out.push('<text x="18" y="'+(top+48)+'" font-size="11" fill="#667268">'+esc(z.id.replaceAll("_"," "))+'</text>');
    const center=211,x0=center-cellW; // Two verified adjacent floor cells = 5 feet.
    out.push('<path d="M'+x0+','+(floorY-baseline*24)+'H'+(x0+2*cellW)+'" stroke="#a0988a" stroke-width="1.3" stroke-dasharray="4 5" fill="none"/>');
    out.push('<path d="M'+x0+','+roofY+'H'+(x0+2*cellW)+'" stroke="#7d654c" stroke-width="2.5" fill="none"/>');
    out.push('<path d="M'+x0+','+floorY+'H'+(x0+2*cellW)+'" stroke="#29362f" stroke-width="3"/>');
    for(let i=0;i<2;i++){
      out.push('<path d="M'+(x0+i*cellW)+','+(floorY+4)+'v8" stroke="#53635a"/>');
      out.push('<text x="'+(x0+(i+.5)*cellW)+'" y="'+(floorY+27)+'" text-anchor="middle" font-size="11" fill="#3c5347">'+
        esc(z.cells[i])+'</text>');
    }
    out.push('<path d="M'+(x0-9)+','+roofY+'h-7v'+(floorY-roofY)+'h7" stroke="#86654b" fill="none"/>');
    out.push('<text x="'+(x0-22)+'" y="'+(roofY+12)+'" text-anchor="end" font-size="12" fill="#795942">'+z.clearance_feet+' ft</text>');
    out.push('<text x="18" y="'+(top+318)+'" font-size="11" fill="#645d51">Two registered plan half-cells; no roof span inferred.</text>');
    out.push('</g>');
  }
  out.push('<text x="31" y="469" font-size="11" font-family="sans-serif" fill="#8a624e">No section is surveyed. Baseline and constrictions are authored gameplay assumptions, not structural or human-safety claims.</text>','</svg>');
  return out.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/wide-roof-clearance.json"),
                  svgPath=path.join(__dirname,"studies/wide_roof_sections.svg")){
  const data=JSON.parse(fs.readFileSync(path.join(__dirname,"wide-blueprints.json"),"utf8"));
  const reports=data.tiles.map(analyze);
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.mkdirSync(path.dirname(svgPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify({stage:"unreleased conceptual headroom studies",
    cave_count:reports.length,half_cell_feet:WIDTH_FEET,posture_minima:POSTURES,
    reports},null,2)+"\n");
  fs.writeFileSync(svgPath,plate(reports));
  return reports;
}
if(require.main===module)console.log(JSON.stringify(generate(),null,2));
module.exports={WIDTH_FEET,POSTURES,roofModel,headroomGraph,analyze,ceilingSvg,plate,generate};
