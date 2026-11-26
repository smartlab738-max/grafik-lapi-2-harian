/* Engineering drilldown: consumption of cumulative-energy meter, 1-hour valid intervals only.
 * Monthly -> Daily -> Hourly; primary values are measured intervals, never interpolated.
 * Uses the existing db, authenticated backend, edit/audit, Excel reader and autosave. */
const drill={level:'month',month:null,date:null,report:null};
const DRILL_HOUR_MS=3600000;
const drillIso=t=>new Date(t).toISOString().slice(0,10);
const drillHour=t=>new Date(t).toISOString().slice(11,16);
const drillHas=n=>typeof n==='number'&&Number.isFinite(n);
function drillExtract(id){
 const panel=getPanel(id);if(!panel)return {events:[],intervals:[],issues:[]};
 const records=[],issues=[];
 for(const [date,ps] of Object.entries(state.db.readings||{})){
  const r=ps[id];if(!r)continue;
  const f=factor(String(r.unit||panel.unit||'').toUpperCase());
  for(const pair of r.r||[]){const hour=Number(pair[0]),value=Number(pair[1]);
   if(!Number.isInteger(hour)||hour<0||hour>24||!Number.isFinite(value))continue;
   const stamp=Date.parse(date+'T00:00:00Z')+hour*DRILL_HOUR_MS;
   if(!Number.isFinite(stamp))continue;
   if(!f){issues.push({date,hour,type:'Satuan tidak dikenal',detail:r.unit||panel.unit||'—'});continue;}
   records.push({stamp,date,hour,raw:value,unit:String(r.unit||panel.unit).toUpperCase(),kwh:value*f,src:r.src||'',originHour:hour});
  }
 }
 records.sort((a,b)=>a.stamp-b.stamp||((a.hour===24)?-1:1));
 const events=[];
 for(const r of records){const prev=events.at(-1);
  if(prev?.stamp===r.stamp){
   if(Math.abs(prev.kwh-r.kwh)>Math.max(.00001,Math.abs(prev.kwh)*1e-9)){
    prev.conflict=true;issues.push({date:r.date,hour:r.hour,type:'Konflik waktu yang sama',detail:'Nilai stand meter berbeda pada timestamp identik'});
   }
   // Prefer prior-day 24:00 when same value; it documents the closing hour.
   if(prev.hour!==24&&r.hour===24){r.conflict=prev.conflict;events[events.length-1]=r;}
   continue;
  }
  events.push(r);
 }
 const intervals=[],positives=[];
 for(let i=1;i<events.length;i++){
  const a=events[i-1],b=events[i],duration=(b.stamp-a.stamp)/DRILL_HOUR_MS;
  if(duration!==1){issues.push({date:drillIso(a.stamp),hour:a.hour,type:'Jam tidak lengkap',detail:`Jeda ${duration} jam, tidak dialokasikan sebagai konsumsi satu jam`});continue;}
  if(a.conflict||b.conflict){issues.push({date:drillIso(a.stamp),hour:a.hour,type:'Konflik pembacaan',detail:'Interval tidak dihitung'});continue;}
  const delta=b.kwh-a.kwh;
  const date=drillIso(a.stamp);
  const o={date,start:a,end:b,hour:Number(drillHour(a.stamp).slice(0,2)),kwh:null,status:'Valid',detail:'',duration:1};
  if(delta< -Math.max(.000001,Math.abs(a.kwh)*1e-9)){
   o.status='Meter turun / reset?';o.detail='Tidak dimasukkan ke total sebelum dikoreksi';issues.push({date,hour:o.hour,type:o.status,detail:o.detail});
  }else{o.kwh=Math.max(0,delta);if(o.kwh>0)positives.push(o.kwh);}
  intervals.push(o);
 }
 const typical=median(positives);
 if(typical>0)for(const r of intervals){if(r.kwh!==null&&r.kwh>typical*15){r.status='Lonjakan · cek';r.detail='Lebih dari 15× median interval positif panel; masih dalam subtotal teramati';issues.push({date:r.date,hour:r.hour,type:r.status,detail:r.detail})}}
 return {events,intervals,issues,median:typical};
}
function drillTotals(year,id){
 const extracted=drillExtract(id),dayMap=new Map(),months=Array.from({length:12},(_,m)=>({m,label:SHORT[m],energy:null,hours:0,days:0,partialDays:0,issues:0,critical:0,overrides:0,coverage:0}));
 const y=String(year);
 // Create day records for dates present in source or user correction. Never invent observations.
 for(const [date,groups] of Object.entries(state.db.readings||{}))if(date.startsWith(y+'-')&&groups[id])dayMap.set(date,{date,energy:null,rawEnergy:0,hours:0,flags:0,critical:0,correction:null,intervals:[],readings:groups[id]?.r?.length||0});
 for(const [date,groups] of Object.entries(state.db.overrides||{}))if(date.startsWith(y+'-')&&drillHas(groups[id])){
  if(!dayMap.has(date))dayMap.set(date,{date,energy:null,rawEnergy:0,hours:0,flags:0,critical:0,correction:null,intervals:[],readings:0});
  dayMap.get(date).correction=Number(groups[id]);
 }
 for(const row of extracted.intervals){if(!row.date.startsWith(y+'-'))continue;
  if(!dayMap.has(row.date))dayMap.set(row.date,{date:row.date,energy:null,rawEnergy:0,hours:0,flags:0,critical:0,correction:null,intervals:[],readings:0});
  const d=dayMap.get(row.date);d.intervals.push(row);
  if(drillHas(row.kwh)){d.rawEnergy+=row.kwh;d.hours++;}
  if(row.status!=='Valid'){d.flags++;d.critical++;}
 }
 for(const item of extracted.issues)if(item.date.startsWith(y+'-')&&dayMap.has(item.date))dayMap.get(item.date).flags++;
 const days=[...dayMap.values()].sort((a,b)=>a.date.localeCompare(b.date));
 for(const d of days){d.energy=d.correction!==null?d.correction:(d.hours?d.rawEnergy:null);d.complete=d.hours===24&&d.flags===0;d.month=Number(d.date.slice(5,7))-1;
  const m=months[d.month];m.days++;m.hours+=d.hours;m.issues+=d.flags;m.critical+=d.critical;if(d.correction!==null)m.overrides++;
  if(!d.complete)m.partialDays++;
  if(drillHas(d.energy))m.energy=(m.energy??0)+d.energy;
 }
 for(const m of months)m.coverage=m.hours/(daysIn(year,m.m)*24);
 return {days,months,extracted};
}
function drillStatus(d){if(!d)return 'Tidak ada data';if(d.flags)return d.correction!==null?'Koreksi · perlu cek':'Perlu diperiksa';if(d.correction!==null)return 'Koreksi manual';return d.complete?'Lengkap':'Parsial';}
function drillSettings(){const p=getPanel(state.panel),lv=drill.level,month=drill.month??state.month;
 const def={title:lv==='month'?`Analisis Pemakaian Bulanan — ${p.name}`:lv==='day'?`Analisis Pemakaian Harian — ${MONTHS[month]} ${state.year}`:`Rincian Pemakaian Per Jam — ${drill.date||'pilih tanggal'}`,
  subtitle:`${p.name} · energi teramati · ${lv==='month'?state.year:lv==='day'?MONTHS[month]+' '+state.year:drill.date||''}`,
  x:lv==='month'?'Bulan (waktu kalender)':lv==='day'?'Tanggal (hari dalam bulan)':'Waktu (interval jam sesuai pencatatan)',
  y:'Konsumsi energi listrik (kWh)'};
 const saved=state.db.drillChartSettings?.[state.panel]?.[lv]||{};return {...def,...saved};
}
function drillChartData(ag){const y=Number(state.year),m=drill.month??state.month;
 if(drill.level==='month')return ag.months.map(v=>({id:String(v.m),label:v.label,value:v.energy,hours:v.hours,flags:v.issues,critical:v.critical,complete:v.coverage>=1,v}));
 if(drill.level==='day'){const byDate=new Map(ag.days.map(d=>[d.date,d]));return Array.from({length:daysIn(y,m)},(_,i)=>{const date=idDate(y,m,i+1),d=byDate.get(date);return{id:date,label:String(i+1),value:d?.energy??null,hours:d?.hours||0,flags:d?.flags||0,critical:d?.critical||0,complete:d?.complete||false,v:d}})}
 const day=ag.days.find(d=>d.date===drill.date),map=new Map((day?.intervals||[]).map(r=>[r.hour,r]));
 return Array.from({length:24},(_,h)=>{const row=map.get(h);return{id:String(h),label:String(h).padStart(2,'0')+':00',value:row?.kwh??null,hours:row?.kwh!==null&&row!==undefined?1:0,flags:row?.status!=='Valid'&&row!==undefined?1:0,critical:row?.status!=='Valid'&&row!==undefined?1:0,complete:!!row&&row.status==='Valid',v:row}});
}
function drillWrap(str,limit){const words=String(str||'').split(/\s+/),lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>limit&&line){lines.push(line);line=word}else line=(line+' '+word).trim()}if(line)lines.push(line);return lines.length?lines:['']}
function drillSvg(points,opts){const W=1140,H=550,L=119,R=38,T=145,B=111,CW=W-L-R,CH=H-T-B,valid=points.filter(p=>drillHas(p.value)),max=Math.max(0,...valid.map(p=>p.value)),mag=max>0?Math.pow(10,Math.floor(Math.log10(max/5))):1,step=max>0?Math.ceil(max/5/mag*2)/2*mag:1,ceil=Math.max(step,step*5),dy=v=>T+CH-(v/ceil)*CH;
 const x=i=>L+(i+.5)*CW/points.length,spacing=CW/points.length,bw=Math.max(5,Math.min(56,spacing*.66));
 const titleLines=drillWrap(opts.title,70),subLines=drillWrap(opts.subtitle,110),xLines=drillWrap(opts.x,72),yLines=drillWrap(opts.y,35),esc=escapeHtml;
 const texts=[`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(opts.title)}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Inter,Arial,sans-serif"><rect width="${W}" height="${H}" rx="15" fill="#ffffff"/>`];
 titleLines.forEach((line,i)=>texts.push(`<text x="${W/2}" y="${27+i*23}" text-anchor="middle" font-size="21" font-weight="800" fill="#17365b">${esc(line)}</text>`));
 subLines.forEach((line,i)=>texts.push(`<text x="${W/2}" y="${102+i*15}" text-anchor="middle" font-size="12" fill="#637b95">${esc(line)}</text>`));
 xLines.forEach((line,i)=>texts.push(`<text x="${L+CW/2}" y="${H-41+i*17}" text-anchor="middle" font-size="13" fill="#355271">${esc(line)}</text>`));
 yLines.forEach((line,i)=>texts.push(`<text transform="translate(${27+i*16} ${T+CH/2}) rotate(-90)" text-anchor="middle" font-size="13" fill="#355271">${esc(line)}</text>`));
 for(let i=0;i<=5;i++){const val=step*i,yy=dy(val);texts.push(`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="${i===0?'#8fa3b9':'#e5edf5'}" stroke-width="${i===0?'1.4':'1'}"/><text x="${L-15}" y="${yy+4}" text-anchor="end" font-size="12" fill="#60748d">${esc(engSafeNum(val,2))}</text>`)}
 texts.push(`<line x1="${L}" y1="${T}" x2="${L}" y2="${T+CH}" stroke="#8fa3b9" stroke-width="1.2"/>`);
 points.forEach((p,i)=>{
  const xx=x(i),labelStep=drill.level==='month'?1:drill.level==='day'?2:2;
  if(i%labelStep===0||i===points.length-1)texts.push(`<text x="${xx}" y="${T+CH+23}" font-size="11" text-anchor="middle" fill="#536c89">${esc(p.label)}</text>`);
  if(!drillHas(p.value))return;
  const yy=dy(p.value),h=T+CH-yy,c=p.critical?'#ea9b35':p.rise?'#d65b51':'#3b75df';
  const detail=`${p.label}: ${engSafeNum(p.value,3)} kWh · ${p.hours} interval valid${p.flags?' · '+p.flags+' peringatan':''}${p.rise?' · meningkat dari periode sebelumnya':''}`;
  texts.push(`<g class="drill-svg-item" data-drill-item="${esc(p.id)}" role="button" tabindex="0" aria-label="${esc(detail)}" style="cursor:pointer"><title>${esc(detail)}. ${drill.level==='month'?'Buka rincian hari':drill.level==='day'?'Buka rincian jam':'Buka editor pembacaan'}</title><rect x="${xx-bw/2}" y="${yy}" width="${bw}" height="${Math.max(0,h)}" rx="${Math.min(5,bw/5)}" fill="${c}"/><rect x="${xx-bw/2}" y="${T}" width="${bw}" height="${CH}" fill="transparent"/></g>`);
 });
 texts.push(`<g transform="translate(${L},${H-60})"><rect width="11" height="11" rx="3" fill="#3b75df"/><text x="18" y="10" fill="#64748b" font-size="11">Interval teramati</text><rect x="169" width="11" height="11" rx="3" fill="#d65b51"/><text x="187" y="10" fill="#64748b" font-size="11">Naik &gt;10%</text><rect x="291" width="11" height="11" rx="3" fill="#ea9b35"/><text x="309" y="10" fill="#64748b" font-size="11">Anomali perlu cek</text><text x="${CW}" y="10" text-anchor="end" font-size="11" fill="#71849b">Data kosong tidak diinterpolasi</text></g></svg>`);
 return texts.join('');
}
function drillRender(){if(!state.db)return;const p=getPanel(state.panel),ag=drillTotals(state.year,state.panel),months=ag.months;
 if(drill.month===null)drill.month=state.month;
 if(drill.level==='hour'&&(!drill.date||!drill.date.startsWith(state.year+'-'+engPad(drill.month+1))))drill.level='day';
 $('drillYear').textContent=state.year;$('drillPanel').textContent=p.name;
 $('drillBreadcrumb').innerHTML=`<button type="button" data-drill-crumb="month" class="${drill.level==='month'?'active':''}">12 Bulan ${state.year}</button><span>›</span><button type="button" data-drill-crumb="day" ${drill.month===null?'disabled':''} class="${drill.level==='day'?'active':''}">${MONTHS[drill.month]} ${state.year}</button><span>›</span><button type="button" data-drill-crumb="hour" ${!drill.date?'disabled':''} class="${drill.level==='hour'?'active':''}">${drill.date||'Pilih hari'}</button>`;
 const pts=drillChartData(ag);for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];b.rise=drillHas(a.value)&&drillHas(b.value)&&a.value>0&&(b.value-a.value)/a.value>.1&&a.hours>0&&b.hours>0&&Math.abs(a.hours-b.hours)/Math.max(a.hours,b.hours)<.3;}const vals=pts.filter(x=>drillHas(x.value)),sum=vals.reduce((acc,v)=>acc+v.value,0),max=vals.reduce((best,r)=>!best||r.value>best.value?r:best,null),coverage=pts.reduce((a,x)=>a+x.hours,0)/(drill.level==='month'?365*24:drill.level==='day'?daysIn(state.year,drill.month)*24:24),alerts=pts.reduce((a,x)=>a+x.flags,0);
 let prevValue=null,delta=null;if(drill.level==='month'){
  const maxRecent=months.filter(r=>drillHas(r.energy)),latest=maxRecent.at(-1);if(latest){const earlier=months[latest.m-1];if(drillHas(earlier?.energy)&&earlier.energy>0)delta=(latest.energy-earlier.energy)/earlier.energy*100;prevValue=latest?.energy;}}
 $('drillStats').innerHTML=[engKpi('Subtotal teramati',vals.length?engSafeNum(sum,2)+' kWh':'—',pts.some(x=>x.critical)?'Termasuk anomali; belum final':'Hanya interval yang tercatat'),engKpi('Interval 1 jam',engSafeNum(pts.reduce((a,x)=>a+x.hours,0),0),'Data terukur, tidak diisi perkiraan'),engKpi('Rata-rata per jam',pts.some(x=>x.hours)&&sum?engSafeNum(sum/pts.reduce((a,x)=>a+x.hours,0),2)+' kWh':'—','Dari interval teramati'),engKpi('Nilai tertinggi',max?engSafeNum(max.value,2)+' kWh':'—',max?max.label:'Belum ada nilai'),engKpi('Peringatan',String(alerts),'Periksa data bertanda')].join('');
 const opts=drillSettings();for(const [key,id] of [['title','drillTitle'],['subtitle','drillSubtitle'],['x','drillX'],['y','drillY']])$(id).value=opts[key];
 $('drillChart').innerHTML=drillSvg(pts,opts);
 $('drillLevelNote').textContent=drill.level==='month'?'Klik batang bulan atau tombol Rincian untuk melihat konsumsi pada setiap tanggal.':drill.level==='day'?'Klik tanggal yang naik untuk memeriksa interval jam penyebab kenaikan.':'Klik batang jam atau Edit Meter pada tabel untuk mengoreksi pembacaan aslinya. Perubahan memperbarui seluruh analisis.';
 const line=drill.level==='month'?`Konsumsi teramati dihitung dari interval 1 jam. Perbandingan antarbulan dapat bias jika cakupan datanya berbeda; jangan menganggap total parsial setara dengan 1 bulan penuh.`:drill.level==='day'?`Konsumsi harian adalah jumlah interval satu jam yang tercatat. Hari dengan kurang dari 24 interval adalah parsial.`:`Interval 08:00–09:00 berasal dari dua stand meter berurutan. Jika data hilang, interval dibiarkan kosong.`;
 $('drillQuality').textContent=line;
 const headers=drill.level==='month'?['Bulan','Konsumsi teramati (kWh)','Interval terhitung / ideal','Status','Perbandingan dengan bulan sebelumnya','Aksi']:drill.level==='day'?['Tanggal','Konsumsi teramati (kWh)','Interval terhitung / ideal','Status','Perbandingan dengan hari sebelumnya','Aksi']:['Interval','Stand awal','Stand akhir','Satuan sumber','Pemakaian (kWh)','Status','Aksi'];
 $('drillTableHead').innerHTML='<tr>'+headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')+'</tr>';
 if(drill.level==='hour'){
  const byHour=new Map((ag.days.find(d=>d.date===drill.date)?.intervals||[]).map(r=>[r.hour,r]));
  $('drillTableBody').innerHTML=Array.from({length:24},(_,h)=>{const i=byHour.get(h),label=engTime(h)+'–'+(h===23?'24:00':engTime(h+1)),value=i?.kwh,status=i?.status||'Belum tercatat',end=i?.end;
   return `<tr class="${i?.status!=='Valid'&&i?'drill-warning':''}"><td><b>${label}</b></td><td>${i?engSafeNum(i.start.raw,4):'—'}</td><td>${i?engSafeNum(i.end.raw,4):'—'}</td><td>${i?escapeHtml(i.end.unit):'—'}</td><td class="num"><b>${drillHas(value)?engSafeNum(value,3):'—'}</b></td><td><span class="tag ${!i?'':i.status==='Valid'?'ok':'warn'}">${escapeHtml(status)}</span></td><td><button type="button" class="btn sm" data-drill-edit="${h}" >${end?'Edit Meter':'Isi Jam'}</button></td></tr>`;
  }).join('');
 }else{
  $('drillTableBody').innerHTML=pts.map((r,i)=>{const prev=pts[i-1],compare=drillHas(prev?.value)&&prev.value>0&&drillHas(r.value)?(r.value-prev.value)/prev.value*100:null;
   const indicator=compare===null?'—':`<span style="color:${compare>0?'#b45309':'#0f766e'}">${compare>0?'+':''}${engSafeNum(compare,1)}%</span>`;
   const notes=drill.level==='month'?(r.hours>=daysIn(state.year,Number(r.id))*24?'Lengkap':'Parsial'):(r.v?.correction!==null&&r.v?.correction!==undefined?'Koreksi manual':r.complete?'Lengkap':'Parsial');
   return `<tr class="${r.flags?'drill-warning':''}"><td><b>${escapeHtml(drill.level==='month'?MONTHS[Number(r.id)]+' '+state.year:r.id)}</b></td><td class="num"><b>${drillHas(r.value)?engSafeNum(r.value,3):'—'}</b></td><td>${r.hours} / ${drill.level==='month'?daysIn(state.year,Number(r.id))*24:24}</td><td><span class="tag ${r.flags?'warn':r.complete?'ok':''}">${escapeHtml(!drillHas(r.value)?'Tidak ada interval':notes)}</span></td><td>${indicator}</td><td><button class="btn sm" type="button" data-drill-next="${escapeHtml(r.id)}" ${!r.v&&drill.level==='day'?'disabled':''}>Lihat rincian →</button></td></tr>`;
  }).join('');
 }
 drill.report={level:drill.level,month:drill.month,date:drill.date,points:pts,ag};
}
function drillOpen(id){if(drill.level==='month'){drill.month=Number(id);state.month=drill.month;$('month').value=String(drill.month);drill.level='day';drill.date=null;}
 else if(drill.level==='day'){drill.date=id;drill.level='hour';}
 else {const h=Number(id),row=drill.report?.ag.days.find(d=>d.date===drill.date)?.intervals.find(v=>v.hour===h);if(row)drillEdit(row.end.date,row.end.hour);return}
 render();$('drillView').scrollIntoView({behavior:'smooth',block:'start'});
}
function drillEdit(date,h){state.view='database';render();$('engDbStart').value=date;$('engDbEnd').value=date;$('engDbPanel').value=state.panel;$('engDbHour').value=String(h);engState.page=0;engRenderDatabase();$('databaseView').scrollIntoView({behavior:'smooth',block:'start'});setStatus('Editor menampilkan pembacaan pada '+date+' '+engTime(h)+'. Koreksi nilai sel, lalu Auto Save akan dijadwalkan.','ok');}
function drillAdd(date,h){drillEdit(date,h);$('engAddPanel').classList.remove('hidden');$('engAddDate').value=date;$('engAddHour').value=String(h);$('engAddPanelSelect').value=state.panel;$('engAddValue').focus();setStatus('Jam '+engTime(h)+' belum memiliki pasangan satu-jam. Masukkan nilai stand meter asli, bukan perkiraan.','warn');}
function drillCustomPreview(){const opts=drillSettings();for(const [key,id] of [['title','drillTitle'],['subtitle','drillSubtitle'],['x','drillX'],['y','drillY']])opts[key]=$(id).value.trim().slice(0,key==='title'?160:120)||opts[key];if(drill.report)$('drillChart').innerHTML=drillSvg(drill.report.points,opts);}
function drillSaveSettings(){const opts={};for(const [key,id] of [['title','drillTitle'],['subtitle','drillSubtitle'],['x','drillX'],['y','drillY']]){const s=$(id).value.trim();if(s)opts[key]=s.slice(0,key==='title'?160:120)};
 (((state.db.drillChartSettings??={})[state.panel]??={}))[drill.level]=opts;markDirty('Judul, subjudul dan label sumbu grafik disimpan sebagai draf; konfigurasi akan di-Auto Save jika editor sudah login.');drillCustomPreview();}
function drillReportMatrix(){const r=drill.report;if(!r)return {h:[],rows:[]};if(r.level==='hour'){
  const byHour=new Map((r.ag.days.find(d=>d.date===r.date)?.intervals||[]).map(v=>[v.hour,v]));return{h:['Tanggal','Interval','Meter awal','Meter akhir','Satuan awal','Satuan akhir','Pemakaian kWh','Status','Sumber Excel'],rows:Array.from({length:24},(_,h)=>{const v=byHour.get(h);return[r.date,engTime(h)+'–'+(h===23?'24:00':engTime(h+1)),v?.start.raw??'',v?.end.raw??'',v?.start.unit||'',v?.end.unit||'',v?.kwh??'',v?.status||'Tidak ada pasangan 1 jam',v?.end.src||'']})};
 }
 return{h:r.level==='month'?['Bulan','Panel','Total teramati kWh','Interval valid','Cakupan interval %','Peringatan']:['Tanggal','Panel','Total teramati kWh','Interval valid','Koreksi manual','Peringatan'],rows:r.points.map(p=>r.level==='month'?[MONTHS[Number(p.id)]+' '+state.year,getPanel(state.panel).name,p.value??'',p.hours,Math.round(p.hours/daysIn(state.year,Number(p.id))/24*10000)/100,p.flags]:[p.id,getPanel(state.panel).name,p.value??'',p.hours,p.v?.correction??'',p.flags])};
}
async function drillExport(){const format=$('drillFormat').value,base='analisis-listrik-'+state.panel+'-'+drill.level+'-'+(drill.date||`${state.year}-${engPad((drill.month??0)+1)}`);try{
 if(format==='csv'||format==='xlsx'){const r=drillReportMatrix();engDownload(format==='xlsx'?engXlsx(r.rows,r.h,'Rekap Monitoring'):new Blob([engCsv(r.rows,r.h)],{type:'text/csv;charset=utf-8'}),base+'.'+format);return}
 const svg=$('drillChart').querySelector('svg');if(!svg)throw Error('Grafik belum siap.');let raw=new XMLSerializer().serializeToString(svg);if(!raw.includes('xmlns='))raw=raw.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
 if(format==='svg'){engDownload(new Blob([raw],{type:'image/svg+xml;charset=utf-8'}),base+'.svg');return}
 const canvas=await engToCanvas(raw,3);if(format==='pdf'){const jpg=await engBlobCanvas(canvas,'image/jpeg');engDownload(await engPdfFromJpg(jpg,canvas),base+'.pdf');return}
 engDownload(await engBlobCanvas(canvas,format==='jpg'?'image/jpeg':'image/png'),base+'.'+format);setStatus('Unduhan grafik berhasil dibuat beserta judul, subjudul, label sumbu dan satuan.','ok');
 }catch(err){setStatus('Unduhan grafik gagal: '+err.message,'error')}
}
function drillListeners(){
 $('drillChart').addEventListener('click',e=>{const el=e.target.closest('[data-drill-item]');if(el)drillOpen(el.dataset.drillItem)});
 $('drillChart').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('[data-drill-item]');if(el){e.preventDefault();drillOpen(el.dataset.drillItem)}});
 $('drillTableBody').addEventListener('click',e=>{const next=e.target.closest('[data-drill-next]'),edit=e.target.closest('[data-drill-edit]');if(next)drillOpen(next.dataset.drillNext);if(edit){const h=Number(edit.dataset.drillEdit),row=drill.report?.ag.days.find(d=>d.date===drill.date)?.intervals.find(v=>v.hour===h);if(row)drillEdit(row.end.date,row.end.hour);else drillAdd(drill.date,h+1)}});
 $('drillBreadcrumb').addEventListener('click',e=>{const b=e.target.closest('[data-drill-crumb]');if(!b||b.disabled)return;if(b.dataset.drillCrumb==='hour'&&!drill.date)return;drill.level=b.dataset.drillCrumb;render()});
 for(const id of ['drillTitle','drillSubtitle','drillX','drillY']){ $(id).addEventListener('input',drillCustomPreview);$(id).addEventListener('change',drillSaveSettings);}
 $('drillExport').addEventListener('click',drillExport);
 $('drillReset').addEventListener('click',()=>{if(!confirm('Kembalikan judul dan sumbu grafik ke bawaan?'))return;delete state.db.drillChartSettings?.[state.panel]?.[drill.level];markDirty('Pengaturan grafik dikembalikan ke default.');drillRender()});
 $('drillImport').addEventListener('click',()=>$('importBtn').click());$('drillSave').addEventListener('click',saveGitHub);
}
