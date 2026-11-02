// Vibe知识大赏 particle engine. Episode defines: THEME, N, KEYS(after ready), overlay(t), optional under(t), SERIES, TITLE
const W=1080,H=1920,c=document.getElementById('c'),g=c.getContext('2d');
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const eo=x=>{x=clamp(x);return 1-Math.pow(1-x,3)};
const lerp=(a,b,k)=>a+(b-a)*k;
const win=(t,a,b,f=0.4)=>clamp(Math.min((t-a)/f,(b-t)/f));
const MODE=THEME.mode||'dark',FF=THEME.font||'S',PAPER=['paper','pastel','ink'].includes(MODE);
const CREAM=THEME.fg||'#F3E9D6',DIM=THEME.dim||'rgba(243,233,214,0.62)';
// ---- beats ----
const BT={};(window.BEATS||[]).forEach(b=>BT[b.id]=b);
const S=id=>BT[id].s, E=id=>BT[id].e;
// ---- sprites ----
function sprite(r,stops){const cv=document.createElement('canvas');cv.width=cv.height=r*2;const x=cv.getContext('2d');const gr=x.createRadialGradient(r,r,0,r,r,r);stops.forEach(([o,c])=>gr.addColorStop(o,c));x.fillStyle=gr;x.fillRect(0,0,r*2,r*2);return cv}
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
let SP=[],BOKM,BOKA;
function buildSprites(){const M=THEME.main,A=THEME.alt;
  if(PAPER){const ink=(C,a)=>sprite(32,[[0,rgba(C,a)],[0.42,rgba(C,a*0.95)],[0.55,rgba(C,a*0.25)],[0.62,rgba(C,0)]]);
    SP=[ink(M,1),ink([40,36,32],1),ink([120,112,100],0.7),ink(A,1)];BOKM=sprite(64,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,0)']]);BOKA=BOKM;return}
  const mk=(C,core)=>sprite(32,[[0,core],[0.12,rgba(C.map(v=>Math.min(255,v+40)),0.95)],[0.35,rgba(C,0.35)],[1,rgba(C,0)]]);
  SP=[mk(M,'rgba(255,250,230,1)'),sprite(32,[[0,'rgba(255,255,255,1)'],[0.15,'rgba(235,240,255,0.9)'],[0.4,'rgba(170,190,255,0.3)'],[1,'rgba(120,140,255,0)']]),
      sprite(32,[[0,'rgba(150,160,210,0.7)'],[0.3,'rgba(110,120,180,0.2)'],[1,'rgba(80,90,150,0)']]),mk(A,'rgba(240,250,255,1)')];
  BOKM=sprite(64,[[0,rgba(M,0.22)],[0.75,rgba(M,0.16)],[0.85,rgba(M,0.26)],[1,rgba(M,0)]]);
  BOKA=sprite(64,[[0,rgba(A,0.16)],[0.75,rgba(A,0.11)],[0.85,rgba(A,0.2)],[1,rgba(A,0)]]);}
function spr(img,x,y,s,a){if(a<=0.01||s<=0)return;g.globalAlpha=Math.min(1,a);g.drawImage(img,x-s,y-s,s*2,s*2)}
// ---- random data ----
const R=rng(42);
let P=[];function initP(n){P=[...Array(n)].map(()=>({h1:R(),h2:R(),h3:R(),h4:R(),on:R()<0.9}))}
const stars=[...Array(260)].map(()=>({x:R()*W,y:R()*H,r:R()*1.8+0.3,p:R()*6.28,s:R()*0.6+0.2}));
const bok=[...Array(24)].map(()=>({x:R()*W,y:R()*H,r:R()*90+40,vx:(R()-.5)*20,vy:-(R()*25+5),alt:R()<0.4,p:R()*6.28,d:R()}));
// ---- layouts helpers ----
function textPts(str,size,cy,step=5,wt=900){const hh=Math.ceil(size*1.4);const cv=document.createElement('canvas');cv.width=W;cv.height=hh;const x=cv.getContext('2d');x.fillStyle='#fff';x.font=`${wt} ${size}px ${FF}`;x.textAlign='center';x.textBaseline='middle';x.fillText(str,W/2,hh/2);
  const d=x.getImageData(0,0,W,hh).data;const pts=[];for(let y=0;y<hh;y+=step)for(let xx=0;xx<W;xx+=step){if(d[(y*W+xx)*4+3]>128)pts.push([xx,y+cy-hh/2])}
  const r=rng(9);for(let i=pts.length-1;i>0;i--){const j=(r()*(i+1))|0;[pts[i],pts[j]]=[pts[j],pts[i]]}return pts}
function onText(pts,i,t,size=6,a=0.9,k=0,jit=2){const p=pts[i%pts.length],q=P[i];const extra=i>=pts.length;return [p[0]+Math.sin(t*3+q.h1*20)*jit,p[1]+Math.cos(t*2.6+q.h2*20)*jit,extra?size*0.7:size,extra?a*0.3:a,k]}
function grid(j,cols,cx,cy,sp){const col=j%cols,row=(j/cols)|0;return [cx+(col-(cols-1)/2)*sp,cy+row*sp]}
function field(i,t,a=0.12,k=2){const q=P[i];return [((q.h1*W+t*10*(q.h3-.5))%W+W)%W,((q.h2*H-t*6*q.h4)%H+H)%H,3+q.h4*3,a*(0.6+0.4*Math.sin(t*2+q.h3*30)),k]}
function hidden(i){const q=P[i];return [q.h1*W,q.h2*H,2,0,2]}
// ---- morph ----
let KEYS=[];
function particle(i,t){let k=0;for(let j=0;j<KEYS.length;j++)if(t>=KEYS[j][0])k=j;
  const [t0,fn,dur]=KEYS[k];const cur=fn(i,t);if(k==0||!dur)return cur;
  const st=P[i].h4*dur*0.45;const m=ease((t-t0-st)/(dur*0.55));if(m>=1)return cur;
  const prev=KEYS[k-1][1](i,t);const sw=Math.sin(m*Math.PI);
  return [lerp(prev[0],cur[0],m)+sw*60*(P[i].h1-.5),lerp(prev[1],cur[1],m)-sw*40*P[i].h2,lerp(prev[2],cur[2],m)*(1+0.6*sw),lerp(prev[3],cur[3],m)+0.2*sw*(prev[3]>0.05?1:0),m<0.5?prev[4]:cur[4]]}
// ---- text helpers ----
function txt(s,x,y,size,col,wt=700,al='center',a=1,glow=0,ls=0){if(a<=0.01)return;if(size<=40&&!txt.raw)size=Math.round(size*1.2);g.save();g.globalCompositeOperation='source-over';g.globalAlpha=a;g.font=`${wt} ${size}px ${FF}`;g.textAlign=al;g.textBaseline='middle';if(ls)g.letterSpacing=ls+'px';if(glow&&!PAPER){g.shadowColor=col;g.shadowBlur=glow}g.fillStyle=col;g.fillText(s,x,y);g.restore()}
function grad(y,size){const M=THEME.main;const gr=g.createLinearGradient(0,y-size/2,0,y+size/2);gr.addColorStop(0,rgba(M.map(v=>Math.min(255,v+70)),1));gr.addColorStop(.5,rgba(M,1));gr.addColorStop(1,rgba(M.map(v=>v*0.6|0),1));return gr}
function rtxt(s,x,y,size,col,wt,t0,t,a=1,hero=false,glow=0){if(a<=0.01||t<t0)return;g.save();g.font=`${wt} ${size}px ${FF}`;g.textBaseline='middle';g.textAlign='left';
  const chars=[...s];const ws=chars.map(ch=>g.measureText(ch).width);const tot=ws.reduce((p,v)=>p+v,0);let cx=x-tot/2;const gr=hero?grad(y,size):null;
  chars.forEach((ch,k)=>{const p=eo((t-t0-k*0.04)/0.4);if(p>0){g.globalAlpha=a*p;g.shadowColor=PAPER?'rgba(0,0,0,0.12)':hero?rgba(THEME.main,0.85):'rgba(255,230,190,0.5)';g.shadowBlur=PAPER?6:(hero?40:glow)+(1-p)*30;g.fillStyle=gr||col;g.fillText(ch,cx,y+(1-p)*size*0.5)}cx+=ws[k]});g.restore()}
function bignum(s,x,y,size,a,al='center'){if(a<=0.01)return;g.save();g.globalAlpha=a;g.font=`900 ${size}px ${FF}`;g.textAlign=al;g.textBaseline='middle';g.fillStyle=PAPER?rgba(THEME.main,1):grad(y,size);g.shadowColor=PAPER?'rgba(0,0,0,0.15)':rgba(THEME.main,0.75);g.shadowBlur=PAPER?8:40;g.fillText(s,x,y);g.restore()}
function ring(x,y,t0,t,maxR,w=6){const k=(t-t0)/1.1;if(k<0||k>1)return;g.save();g.globalCompositeOperation='lighter';g.globalAlpha=(1-k)*0.9;const col=rgba(THEME.main.map(v=>Math.min(255,v+50)),1);g.strokeStyle=col;g.lineWidth=w*(1-k)+1;g.shadowColor=col;g.shadowBlur=30;g.beginPath();g.ellipse(x,y,maxR*eo(k),maxR*eo(k)*0.92,0,0,6.283);g.stroke();g.restore()}
function flare(x,y,a,len=700){if(a<=0.01)return;g.save();g.globalCompositeOperation='lighter';g.globalAlpha=a;const gr=g.createLinearGradient(x-len,0,x+len,0);const C=THEME.main.map(v=>Math.min(255,v+60));gr.addColorStop(0,rgba(C,0));gr.addColorStop(.5,'rgba(255,245,225,0.9)');gr.addColorStop(1,rgba(C,0));g.fillStyle=gr;g.fillRect(x-len,y-3,len*2,6);spr(SP[0],x,y,140,a);g.restore()}
function rays(x,y,t,a,n=14,len=1500,C){C=C||THEME.main;if(a<=0.01)return;g.save();g.globalCompositeOperation='lighter';for(let k=0;k<n;k++){const r=rng(k+5);const ang=k/n*6.283+t*0.05+r()*0.3;const w=0.03+r()*0.06;
  const gr=g.createRadialGradient(x,y,0,x,y,len);gr.addColorStop(0,rgba(C,0.2*a));gr.addColorStop(1,rgba(C,0));g.fillStyle=gr;g.globalAlpha=0.5+0.5*Math.sin(t*0.7+k);
  g.beginPath();g.moveTo(x,y);g.arc(x,y,len,ang-w,ang+w);g.closePath();g.fill()}g.restore()}
function glowLine(pts,a,w=5,C){if(a<=0.01||pts.length<2)return;C=C||THEME.main;g.save();g.globalCompositeOperation='lighter';g.globalAlpha=a;g.strokeStyle=rgba(C,1);g.lineWidth=w;g.lineJoin='round';g.shadowColor=rgba(C,1);g.shadowBlur=25;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts)g.lineTo(p[0],p[1]);g.stroke();g.restore()}
// subtitles from beats, split into chunks <=15 chars at punctuation
const SUBY=1420;
function subChunks(b){const parts=b.text.split(/(?<=[，。？！、；：])/).filter(s=>s.trim());let chunks=[],cur='';for(const p of parts){if((cur+p).length>16&&cur){chunks.push(cur);cur=p}else cur+=p}if(cur)chunks.push(cur);chunks=chunks.flatMap(c=>{const n=c.replace(/[，。、；：]$/,'').length;if(n<=15)return [c];const k=Math.ceil(n/Math.ceil(n/14));const out=[];for(let i=0;i<c.length;i+=k)out.push(c.slice(i,i+k));if(out.length>1&&out[out.length-1].replace(/[，。、；：？！]/g,'').length<3){const l=out.pop();out[out.length-1]+=l}return out});
  const tot=chunks.reduce((s,c)=>s+c.length,0);let t=b.s;return chunks.map(c=>{const d=(b.e-b.s)*c.length/tot;const r=[t,t+d,c.replace(/[，。、；：]$/,'')];t+=d;return r})}
let SUBS=[];
function drawSubs(t){if(window.NOSUB)return;for(const [a0,b0,s] of SUBS){if(t>=a0-0.05&&t<b0+0.25){const a=clamp(Math.min((t-a0+0.05)/0.12,(b0+0.25-t)/0.15));g.save();g.globalAlpha=a;g.font='700 62px '+FF;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=12;g.strokeStyle=PAPER?'rgba(255,252,244,0.95)':'rgba(5,6,14,0.85)';g.strokeText(s,W/2,SUBY);g.fillStyle=PAPER?'#1A1714':'#FFFFFF';g.shadowColor='rgba(0,0,0,0.6)';g.shadowBlur=12;g.fillText(s,W/2,SUBY);g.restore()}}}
// ---- main draw ----
function bgLayer(t){
  if(MODE=='blueprint'){g.globalCompositeOperation='source-over';g.save();for(let x=0;x<=W;x+=40){g.strokeStyle=x%200==0?'rgba(170,215,255,0.22)':'rgba(170,215,255,0.08)';g.lineWidth=x%200==0?2:1;g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}
    for(let y=0;y<=H;y+=40){g.strokeStyle=y%200==0?'rgba(170,215,255,0.22)':'rgba(170,215,255,0.08)';g.lineWidth=y%200==0?2:1;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
    g.strokeStyle='rgba(200,230,255,0.35)';g.lineWidth=3;g.strokeRect(30,30,W-60,H-60);g.font='22px M';g.fillStyle='rgba(200,230,255,0.45)';g.fillText('SHEET 08 / SCALE 1:2^n',60,H-60);g.restore();g.globalCompositeOperation='lighter';
    for(const st of stars){if(st.r<1.4)continue;g.globalAlpha=0.25+0.3*Math.sin(t*st.s*2+st.p);g.fillStyle='#cfe8ff';g.fillRect(st.x,st.y,2,2)}return}
  if(MODE=='terminal'){g.globalCompositeOperation='source-over';g.save();g.font='24px M';const r=rng(5);
    for(let col=0;col<27;col++){const sp=40+r()*80,off=r()*2000;for(let k=0;k<30;k++){const y=((k*64+t*sp+off)%(H+200))-100;const ch=String((((k*7+col*13+Math.floor(t*3+r()*9))%10)+10)%10);
      g.fillStyle=`rgba(80,255,140,${0.04+0.10*(k%5==0)})`;g.fillText(ch,col*40+12,y)}}g.restore();
    g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(540,800,50,540,800,1100);gr.addColorStop(0,'rgba(40,255,120,0.10)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);return}
  if(MODE=='pixel'){g.globalCompositeOperation='source-over';g.save();const r=rng(3);
    for(let k=0;k<40;k++){const x=r()*W,y=((r()*H+t*(20+r()*40))%H);g.fillStyle=k%3?'rgba(255,220,90,0.25)':'rgba(90,220,255,0.25)';const s=r()<0.5?6:12;g.fillRect(Math.round(x/6)*6,Math.round(y/6)*6,s,s)}
    g.fillStyle='#1a1240';g.fillRect(0,1560,W,360);for(let x=0;x<W;x+=48){g.fillStyle=(x/48)%2?'#2a1f66':'#33267a';g.fillRect(x,1560,48,24)}g.restore();g.globalCompositeOperation='lighter';return}
  if(MODE=='pastel'){g.globalCompositeOperation='source-over';for(let k=0;k<4;k++){const x=540+Math.sin(t*0.2+k*1.7)*460,y=[300,800,1300,1700][k]+Math.cos(t*0.23+k)*120;const C=[[255,170,200],[255,210,170],[200,180,255],[170,225,255]][k];
      const gr=g.createRadialGradient(x,y,0,x,y,620);gr.addColorStop(0,rgba(C,0.45));gr.addColorStop(1,rgba(C,0));g.fillStyle=gr;g.fillRect(0,0,W,H)}
    for(const b of bok){const x=((b.x+b.vx*t)%W+W)%W,y=((b.y+b.vy*0.8*t)%H+H)%H;g.globalAlpha=0.25;g.fillStyle='#fff';g.beginPath();const r=b.r*0.18;g.moveTo(x,y+r*0.9);g.bezierCurveTo(x-r*1.6,y-r*0.2,x-r*0.6,y-r*1.3,x,y-r*0.4);g.bezierCurveTo(x+r*0.6,y-r*1.3,x+r*1.6,y-r*0.2,x,y+r*0.9);g.fill()}g.globalAlpha=1;return}
  if(MODE=='ink'){g.globalCompositeOperation='source-over';g.save();
    const mt=(yb,amp,col,ph)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=12){const y=yb-Math.abs(Math.sin(x*0.004+ph))*amp-Math.sin(x*0.013+ph*2)*amp*0.25;g.lineTo(x,y)}g.lineTo(W,H);g.fill()};
    mt(1500+Math.sin(t*0.1)*10,260,'rgba(60,60,60,0.10)',1.1);mt(1650,200,'rgba(40,40,40,0.16)',2.7);mt(1800,140,'rgba(25,25,25,0.22)',4.2);
    for(let k=0;k<5;k++){const y=380+k*90,x=((k*300+t*(14+k*4))%(W+600))-300;const gr=g.createRadialGradient(x,y,0,x,y,260);gr.addColorStop(0,'rgba(255,255,255,0.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-300,y-120,600,240)}
    g.fillStyle='rgba(176,40,30,0.85)';g.fillRect(940,1720,70,70);g.fillStyle='#F4EEE2';g.font='700 26px S';g.textAlign='center';g.fillText('知识',975,1745);g.fillText('大赏',975,1775);g.restore();return}
  if(PAPER){g.globalCompositeOperation='source-over';const r=rng(77);g.fillStyle='rgba(120,90,50,0.05)';for(let i=0;i<400;i++){g.fillRect(r()*W,r()*H,r()*40+4,1)}
    const gr=g.createRadialGradient(540,800,100,540,800,1100);gr.addColorStop(0,'rgba(255,255,255,0.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);return}
  g.globalCompositeOperation='lighter';
  if(MODE=='film'){for(let k=0;k<3;k++){const x=540+Math.sin(t*0.13+k*2.1)*520,y=[400,1000,1600][k]+Math.cos(t*0.17+k)*180;const C=[[255,140,60],[255,90,110],[255,190,120]][k];
      const gr=g.createRadialGradient(x,y,0,x,y,700);gr.addColorStop(0,rgba(C,0.22+0.06*Math.sin(t*0.9+k)));gr.addColorStop(1,rgba(C,0));g.fillStyle=gr;g.fillRect(0,0,W,H)}}
  if(MODE=='neon'){g.globalCompositeOperation='source-over';const hz=1260;g.save();g.strokeStyle=rgba(THEME.alt,0.35);g.lineWidth=2;g.shadowColor=rgba(THEME.alt,1);g.shadowBlur=12;
      for(let k=-12;k<=12;k++){g.beginPath();g.moveTo(540+k*20,hz);g.lineTo(540+k*260,H);g.stroke()}
      for(let k=0;k<14;k++){const u=((k+t*0.9)%14)/14;const y=hz+(H-hz)*u*u;g.globalAlpha=u;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}g.restore();
      const gr=g.createLinearGradient(0,hz-260,0,hz+20);gr.addColorStop(0,rgba(THEME.alt,0));gr.addColorStop(1,rgba(THEME.alt,0.25));g.fillStyle=gr;g.fillRect(0,hz-260,W,280);g.globalCompositeOperation='lighter'}
  if(MODE!='neon'){spr(BOKA,250,500,700,0.35);spr(BOKM,820,1350,800,0.3);spr(BOKA,900,300,500,0.22);}
  for(const s of stars){g.globalAlpha=0.3+0.4*Math.sin(t*s.s*2+s.p);g.fillStyle=MODE=='film'?'#ffe6c8':'#dfe4ff';g.fillRect(s.x,s.y,s.r,s.r)}
  if(MODE=='dark'||MODE=='film')for(const b of bok){if(b.d>0.5)continue;const x=((b.x+b.vx*t)%W+W)%W,y=((b.y+b.vy*t)%H+H)%H;spr(b.alt?BOKA:BOKM,x,y,b.r*0.6,0.5+0.3*Math.sin(t+b.p))}
}
function fgLayer(t){if(MODE=='dark'||MODE=='film'){g.globalCompositeOperation='lighter';for(const b of bok){if(b.d<=0.5)continue;const x=((b.x+b.vx*1.8*t)%W+W)%W,y=((b.y+b.vy*1.8*t)%H+H)%H;spr(b.alt?BOKA:BOKM,x,y,b.r*1.3,0.3+0.2*Math.sin(t+b.p))}}}
function postLayer(t){
  if(MODE=='terminal'||MODE=='pixel'||MODE=='blueprint'){g.fillStyle=MODE=='blueprint'?'rgba(0,0,0,0.0)':'rgba(0,0,0,0.18)';if(MODE!='blueprint')for(let y=0;y<H;y+=4)g.fillRect(0,y,W,1.5)}
  let gr=g.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.78);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,PAPER?'rgba(90,60,30,0.22)':'rgba(0,0,0,0.7)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  const r=rng(Math.floor(t*30)+1);g.fillStyle=PAPER?'rgba(60,40,20,0.05)':MODE=='film'?'rgba(255,235,210,0.06)':'rgba(255,255,255,0.035)';for(let i=0;i<(MODE=='film'?1600:900);i++)g.fillRect(r()*W,r()*H,1.6,1.6);
  if(MODE=='film'){const r2=rng(Math.floor(t*8)+3);for(let i=0;i<6;i++){g.fillStyle=r2()<0.5?'rgba(20,10,5,0.35)':'rgba(255,240,220,0.25)';g.beginPath();g.arc(r2()*W,r2()*H,r2()*3+1,0,6.3);g.fill()}
    if(r2()<0.3){g.fillStyle='rgba(255,240,220,0.12)';g.fillRect(r2()*W,0,1.5,H)}
    g.fillStyle=`rgba(255,200,150,${0.025+0.02*Math.sin(t*23)})`;g.fillRect(0,0,W,H)}
  if(MODE=='neon'){let hk=0;for(const b of window.BEATS){if(b.hit&&t>=b.s&&t<b.s+0.35)hk=Math.max(hk,1-(t-b.s)/0.35)}
    if(hk>0){const r3=rng(Math.floor(t*30)+9);for(let i=0;i<4;i++){const y=r3()*H,h=20+r3()*90,dx=(r3()-.5)*80*hk;g.drawImage(c,0,y,W,h,dx,y,W,h)}
      g.save();g.globalCompositeOperation='screen';g.globalAlpha=0.35*hk;g.drawImage(c,10*hk,0);g.globalAlpha=0.35*hk;g.drawImage(c,-10*hk,0);g.restore()}
    g.fillStyle='rgba(0,0,0,0.16)';for(let y=0;y<H;y+=4)g.fillRect(0,y,W,1.5)}
}
window.draw=function(t){
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.shadowBlur=0;
  let sh=0;for(const b of window.BEATS){if(b.hit&&t>=b.s&&t<b.s+0.5)sh+=(1-(t-b.s)/0.5)*9}if(t<0.5)sh+=(1-t/0.5)*9;
  const zr=1+0.025*Math.sin(t*0.35);const sx=Math.sin(t*53)*sh,sy=Math.cos(t*47)*sh;
  const BG=THEME.bg;let gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,BG[0]);gr.addColorStop(.5,BG[1]);gr.addColorStop(1,BG[2]);g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.setTransform(zr,0,0,zr,W/2*(1-zr)+sx,H/2*(1-zr)+sy);
  bgLayer(t);
  if(window.under)under(t);
  g.globalCompositeOperation=PAPER?'source-over':'lighter';
  for(let i=0;i<P.length;i++){const [x,y,s,a,k]=particle(i,t);if(a<=0.02)continue;spr(SP[k],x,y,s,a)}
  g.globalCompositeOperation='source-over';
  txt.raw=1;txt('Vibe知识大赏',W/2,110,34,rgba(THEME.main,1),700,'center',0.9,0,10);
  txt(TITLE,W/2,162,30,DIM,400,'center',0.85,0,4);txt.raw=0;
  overlay(t);
  fgLayer(t);
  g.globalCompositeOperation='source-over';g.setTransform(1,0,0,1,0,0);
  drawSubs(t);
  if(window.footnote)txt(footnote,W/2,1500,24,'rgba(243,233,214,0.42)',400,'center',1);
  postLayer(t);
  if(t>DUR-0.9){g.fillStyle=`rgba(0,0,0,${clamp((t-(DUR-0.9))/0.9)})`;g.fillRect(0,0,W,H)}
};
window.ready=document.fonts.load('900 40px S').then(()=>document.fonts.load('900 40px '+FF)).then(()=>document.fonts.load('700 40px '+FF)).then(()=>document.fonts.load('400 40px '+FF)).then(()=>{buildSprites();SUBS=window.BEATS.flatMap(b=>b.subs||subChunks(b));for(let i=0;i<SUBS.length-1;i++){const gap=SUBS[i+1][0]-SUBS[i][1];if(gap<0.5)SUBS[i][1]=SUBS[i+1][0]-0.26};initP(N);setup();return true});
