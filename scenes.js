// generic scene DSL on top of engine2. Episode defines PK (particle keys) and SC (scenes), optional custom fns.
const TT={};
function at(id){if(typeof id==='number')return id;if(id==='END')return DUR;const [k,o]=id.split('+');return S(k)+(o?parseFloat(o):0)}
function setup(){
  KEYS=PK.map(([id,type,...a],i)=>{let fn;
    if(type=='text'){const pts=textPts(a[0],a[1],a[2],a[4]||6);fn=(i,t)=>onText(pts,i,t,a[4]||6,0.92,a[3]||0,i<0?0:(id===0?14*Math.exp(-t*4)+2:3))}
    else if(type=='field')fn=(i,t)=>i>(a[0]||900)?hidden(i):field(i,t,a[1]||0.18,a[2]||0);
    else if(type=='ring')fn=(i,t)=>{const q=P[i];const ang=q.h1*6.283+t*0.15;const r=(a[0]||300)+(q.h2-.5)*(a[3]||40);return [540+Math.cos(ang)*r,(a[1]||760)+Math.sin(ang)*r,4,0.7,q.h3<(a[2]||0)?3:0]};
    else if(type=='disc')fn=(i,t)=>{const q=P[i];const ang=q.h1*6.283+t*0.2*(q.h3-.5);const r=(a[0]||280)*Math.sqrt(q.h2);return [540+Math.cos(ang)*r,(a[1]||760)+Math.sin(ang)*r,3+q.h4*2,0.75,q.h4<(a[2]||0)?3:0]};
    else if(type=='custom')fn=window[a[0]];
    return [id===0?0:at(id),fn,id===0?0:(a.find?1.3:1.3)]});
}
function drawItem(it,t,t0,a){const [ty,...r]=it;
  if(ty=='r'){const [s,y,size,col,d=0,hero=false]=r;if(t>t0+d)rtxt(s,W/2,y,size,col||CREAM,900,t0+d,t,a,hero,20)}
  else if(ty=='b'){const [s,y,size,d=0]=r;bignum(s,W/2,y,size,a*eo((t-t0-d)/0.5))}
  else if(ty=='t'){const [s,y,size,col,d=0,x=W/2]=r;txt(s,x,y,size,col||DIM,700,'center',a*eo((t-t0-d)/0.4))}
  else if(ty=='f'){window[r[0]](t,t0,a,...r.slice(1))}
  else if(ty=='row'){const [ws,y,size,col,d=0,gap=300,hi=-1]=r;ws.forEach((w,k)=>{if(t>t0+d+k*0.4)rtxt(w,W/2+(k-(ws.length-1)/2)*gap,y,size,k==hi?(THEME.accent||'#FFD650'):(col||CREAM),900,t0+d+k*0.4,t,a)})}}
function overlay(t){for(const [s,e,items] of SC){const t0=at(s),t1=at(e);if(t<t0-0.15||t>t1+0.3)continue;const a=win(t,t0-0.15,t1+0.3,0.3);
  for(const it of items){if(it[0]=='@'){const [_,id,...sub]=it;const ti=at(id);if(t>=ti-0.05)for(const x of sub)drawItem(x,t,ti,a)}else drawItem(it,t,t0,a)}}}
