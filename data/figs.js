/* Figure helpers (inline SVG and HTML) */
const SV=(w,h,body)=>`<svg class="dg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Archivo, Arial, sans-serif" font-size="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const TX=(x,y,t,a,ex)=>`<text x="${x}" y="${y}" text-anchor="${a||"middle"}" fill="currentColor" stroke="none"${ex?" "+ex:""}>${t}</text>`;
function ARW(x1,y1,x2,y2,w){const a=Math.atan2(y2-y1,x2-x1),s=w||8,p=(d)=>[x2-s*Math.cos(a+d),y2-s*Math.sin(a+d)];const[l,r]=[p(.45),p(-.45)];return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><polygon points="${x2},${y2} ${l[0].toFixed(1)},${l[1].toFixed(1)} ${r[0].toFixed(1)},${r[1].toFixed(1)}" fill="currentColor"/>`}
// figure wrapper; alt = text description used for AI marking
function FIG(cap,svg,alt){const t=alt&&!alt.startsWith(cap)?cap+". "+alt:(alt||cap);return`<figure class="fig" data-alt="${String(t).replace(/"/g,"&quot;")}">${svg}<figcaption>${cap}</figcaption></figure>`}
// horizontal bar chart from divs
function HBAR(title,rows,unit,max){max=max||Math.max(...rows.map(r=>r[1]));return`<figure class="fig chart" data-alt="${title}: ${rows.map(r=>r[0]+" "+r[1]+(unit||"")).join("; ")}"><figcaption style="margin:0 0 6px">${title}</figcaption>${rows.map(r=>`<div class="bar"><span class="bl">${r[0]}</span><span class="bt"><span class="bf" style="width:${Math.max(2,r[1]/max*100).toFixed(1)}%"></span></span><span class="bv">${r[1]}${unit||""}</span></div>`).join("")}</figure>`}

function BLOCKS(items,cap,fb,alt){
  const w=Math.min(150,Math.floor(620/items.length)-20);let b="";items.forEach((t,i)=>{const x=10+i*(w+26);b+=`<rect x="${x}" y="22" width="${w}" height="46" rx="6"/>`+t.split("|").map((s,k,arr)=>TX(x+w/2,46+(k-(arr.length-1)/2)*15,s,"middle",'font-size="12"')).join("");if(i<items.length-1)b+=ARW(x+w+2,45,x+w+24,45,7)});
  const W=10+items.length*(w+26);if(fb){const xe=10+(items.length-1)*(w+26)+w/2,xs=10+w/2;b+=`<path d="M${xe},68 V96 H${xs} V72"/>`+ARW(xs,80,xs,70,7)+TX((xs+xe)/2,90,fb,"middle",'font-size="12"')}
  return FIG(cap,SV(W,fb?104:80,b),alt||cap+": "+items.map(s=>s.replace(/\|/g," ")).join(" → ")+(fb?" (feedback: "+fb+")":""));
}
function T2(rows,cap){return`<figure class="fig">${TBL(rows)}<figcaption>${cap}</figcaption></figure>`}
function TBL(rows){return`<table class="dt"><tr>${rows[0].map(c=>`<th>${c}</th>`).join("")}</tr>${rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table>`}
// line chart: xs = labels, series = [{n:name, v:[...], dash:bool}], y = {min,max,step,label}, xl = x-axis label
function LINE(cap,xs,series,y,xl,alt){
  const L=56,R=16,Tp=series.length>1?34:14,B=46,W=520,H=260+(series.length>1?20:0),pw=W-L-R,ph=H-Tp-B;const X=i=>L+(xs.length===1?pw/2:i*pw/(xs.length-1)),Y=v=>Tp+ph-(v-y.min)/(y.max-y.min)*ph;
  let b=`<line x1="${L}" y1="${Tp}" x2="${L}" y2="${Tp+ph}"/><line x1="${L}" y1="${Tp+ph}" x2="${L+pw}" y2="${Tp+ph}"/>`;
  for(let v=y.min;v<=y.max+1e-9;v+=y.step){b+=`<line x1="${L}" y1="${Y(v)}" x2="${L+pw}" y2="${Y(v)}" stroke-width=".5" stroke-dasharray="2 4"/>`+TX(L-6,Y(v)+4,+v.toFixed(3),"end",'font-size="11"')}
  const every=xs.length<=13?1:Math.ceil(xs.length/10);xs.forEach((x,i)=>{if(i%every===0||i===xs.length-1)b+=TX(X(i),Tp+ph+16,x,"middle",'font-size="11"')});
  b+=TX(L+pw/2,H-8,xl||"","middle",'font-size="12"')+TX(14,Tp+ph/2,y.label||"","middle",`font-size="12" transform="rotate(-90 14 ${Tp+ph/2})"`);
  series.forEach((s,k)=>{b+=`<polyline points="${s.v.map((v,i)=>v==null?"":X(i).toFixed(1)+","+Y(v).toFixed(1)).filter(Boolean).join(" ")}" stroke-width="2.2"${s.dash?' stroke-dasharray="6 4"':""}/>`+s.v.map((v,i)=>v==null?"":`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.6" fill="currentColor"/>`).join("")});
  if(series.length>1)series.forEach((s,k)=>{const lx=L+12+k*170;b+=`<line x1="${lx}" y1="12" x2="${lx+24}" y2="12" stroke-width="2.2"${s.dash?' stroke-dasharray="6 4"':""}/>`+TX(lx+30,16,s.n,"start",'font-size="11"')});
  return FIG(cap,SV(W,H,b),alt||`${cap}. ${series.map(s=>s.n+": "+xs.map((x,i)=>x+" = "+s.v[i]).join(", ")).join(". ")}`);
}
// vertical bar chart with optional line (e.g. climate graph): bars = [...], line = [...]
function CLIM(cap,months,rain,temp,alt){
  const L=50,R=50,Tp=14,B=40,W=520,H=250,pw=W-L-R,ph=H-Tp-B,rmax=Math.ceil(Math.max(...rain)/50)*50,tmin=Math.min(0,Math.floor(Math.min(...temp)/5)*5),tmax=Math.ceil(Math.max(...temp)/5)*5+5;
  const bw=pw/months.length;let b=`<line x1="${L}" y1="${Tp}" x2="${L}" y2="${Tp+ph}"/><line x1="${L+pw}" y1="${Tp}" x2="${L+pw}" y2="${Tp+ph}"/><line x1="${L}" y1="${Tp+ph}" x2="${L+pw}" y2="${Tp+ph}"/>`;
  rain.forEach((r,i)=>{const h=r/rmax*ph;b+=`<rect x="${(L+i*bw+3).toFixed(1)}" y="${(Tp+ph-h).toFixed(1)}" width="${(bw-6).toFixed(1)}" height="${h.toFixed(1)}" fill="currentColor" fill-opacity=".25" stroke-width="1"/>`+TX(L+i*bw+bw/2,Tp+ph+14,months[i],"middle",'font-size="11"')});
  for(let v=0;v<=rmax;v+=rmax/5)b+=TX(L-6,Tp+ph-v/rmax*ph+4,v,"end",'font-size="11"');
  const TY=t=>Tp+ph-(t-tmin)/(tmax-tmin)*ph;for(let v=tmin;v<=tmax;v+=5)b+=TX(L+pw+6,TY(v)+4,v,"start",'font-size="11"');
  b+=`<polyline points="${temp.map((t,i)=>(L+i*bw+bw/2).toFixed(1)+","+TY(t).toFixed(1)).join(" ")}" stroke-width="2.4"/>`+temp.map((t,i)=>`<circle cx="${(L+i*bw+bw/2).toFixed(1)}" cy="${TY(t).toFixed(1)}" r="3" fill="currentColor"/>`).join("");
  b+=TX(14,Tp+ph/2,"Rainfall / mm (bars)","middle",`font-size="11" transform="rotate(-90 14 ${Tp+ph/2})"`)+TX(W-10,Tp+ph/2,"Temperature / °C (line)","middle",`font-size="11" transform="rotate(90 ${W-10} ${Tp+ph/2})"`);
  return FIG(cap,SV(W,H,b),alt||`${cap}. Monthly rainfall (mm): ${months.map((m,i)=>m+" "+rain[i]).join(", ")}. Mean temperature (°C): ${months.map((m,i)=>m+" "+temp[i]).join(", ")}`);
}
// population pyramid: groups top→bottom oldest first; m/f = % of population
function PYR(cap,groups,m,f,alt){
  const W=520,rowh=16,H=groups.length*rowh+50,mid=W/2,max=Math.ceil(Math.max(...m,...f)),sc=(W/2-60)/max;let b="";
  groups.forEach((g,i)=>{const y=14+i*rowh;b+=`<rect x="${(mid-24-m[i]*sc).toFixed(1)}" y="${y}" width="${(m[i]*sc).toFixed(1)}" height="${rowh-3}" fill="currentColor" fill-opacity=".35" stroke-width=".8"/><rect x="${mid+24}" y="${y}" width="${(f[i]*sc).toFixed(1)}" height="${rowh-3}" fill="currentColor" fill-opacity=".15" stroke-width=".8"/>`+TX(mid,y+11,g,"middle",'font-size="10"')});
  const yb=14+groups.length*rowh+4;b+=`<line x1="${mid-24-max*sc}" y1="${yb}" x2="${mid-24}" y2="${yb}"/><line x1="${mid+24}" y1="${yb}" x2="${mid+24+max*sc}" y2="${yb}"/>`;
  for(let v=0;v<=max;v+=Math.max(1,Math.round(max/4))){b+=TX(mid-24-v*sc,yb+14,v,"middle",'font-size="10"')+TX(mid+24+v*sc,yb+14,v,"middle",'font-size="10"')}
  b+=TX(mid-24-max*sc/2,yb+30,"Males / % of population","middle",'font-size="11"')+TX(mid+24+max*sc/2,yb+30,"Females / % of population","middle",'font-size="11"');
  return FIG(cap,SV(W,H,b),alt||`${cap}. ${groups.map((g,i)=>`${g}: males ${m[i]}%, females ${f[i]}%`).join("; ")}`);
}
// fact file box
function FACT(cap,items){return`<figure class="fig fact"><ul>${items.map(x=>`<li>${x}</li>`).join("")}</ul><figcaption>${cap}</figcaption></figure>`}
// simple sketch map made of labelled zones: zones = [[x,y,w,h,label,shade]]
function MAP(cap,w,h,zones,extra,alt){
  let b=`<rect x="2" y="2" width="${w-4}" height="${h-4}" stroke-width="1"/>`;zones.forEach(z=>{b+=`<rect x="${z[0]}" y="${z[1]}" width="${z[2]}" height="${z[3]}" rx="10" fill="currentColor" fill-opacity="${z[5]||0.08}" stroke-width="1"/>`+z[4].split("|").map((s,k,a)=>TX(z[0]+z[2]/2,z[1]+z[3]/2+4+(k-(a.length-1)/2)*14,s,"middle",'font-size="11"')).join("")});
  b+=(extra||"")+`<path d="M${w-30},40 L${w-30},16" />`+ARW(w-30,40,w-30,14,7)+TX(w-30,52,"N","middle",'font-size="11" font-weight="700"');
  return FIG(cap,SV(w,h,b),alt||cap);
}
