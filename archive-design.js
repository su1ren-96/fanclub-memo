/* ARCHIVE folder collection UI — non-destructive metadata extension. */
(function(){
'use strict';
const safe=e;
// Image labels and optional years are stored alongside the existing images.
// Older ARCHIVE records have no archiveItems: keep their photos readable.
function metaFor(folder,index){
 const items=Array.isArray(folder?.archiveItems)?folder.archiveItems:[];
 const item=items[index];
 return {
  name:typeof item?.name==='string'?item.name:'',
  year:typeof item?.year==='string'?item.year:(typeof item?.year==='number'?String(item.year):'')
 };
}
// Give every folder a stable, distinct pastel shade.  Golden-angle distribution
// avoids repeating a three-color palette.  Newly edited/created folders store
// their hue with their archive record; legacy folders derive it deterministically
// from their original creation order (never from current listing order).
const legacyHueMap=()=>{
 const folders=data.filter(o=>o.type==='ARCHIVE').slice().sort((a,b)=>
  (new Date(a.when||0).getTime()||0)-(new Date(b.when||0).getTime()||0)||String(a.id).localeCompare(String(b.id)));
 const map=new Map();
 folders.forEach((o,i)=>map.set(String(o.id),Number.isFinite(Number(o.archiveFolderHue))&&o.archiveFolderHue!==undefined&&o.archiveFolderHue!==null
  ?Number(o.archiveFolderHue):((335+i*137.50776405)%360)));
 return map;
};
const hueFor=o=>legacyHueMap().get(String(o.id))??335;
const folderSvg=o=>{
 const hue=hueFor(o),light=`hsl(${hue.toFixed(3)},64%,89%)`,dark=`hsl(${hue.toFixed(3)},63%,79%)`;
 const gid='ar-folder-'+String(o.id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
 return `<svg class="archive-folder-svg" viewBox="0 0 110 108" aria-hidden="true" focusable="false"><defs><linearGradient id="${gid}" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="${dark}"></stop><stop offset="100%" stop-color="${light}"></stop></linearGradient></defs><path d="M7 25 Q7 17 16 17 H39 Q45 17 51 23 L58 29 H94 Q103 29 103 39 V88 Q103 97 94 97 H16 Q7 97 7 88 Z" fill="url(#${gid})"></path><path d="M14 40 H96" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".78"></path></svg>`;
};
window.archiveFolderSvg=folderSvg;
window.archiveHomeFolders=function(items){
 if(!items.length)return '<div class="home-empty">資料はまだ登録されていません</div>';
 return `<div class="archive-home-grid">${items.slice(0,3).map((o,i)=>`<div class="archive-folder-item archive-home-item" role="button" tabindex="0" aria-label="${safe(o.title||'無題')}を開く" onclick="detail('${safe(o.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();detail('${safe(o.id)}')}">${folderSvg(o)}<span class="archive-folder-title">${safe(o.title||'無題')}</span></div>`).join('')}</div>`;
};
const oldListing=listing;
listing=function(arr){
 if(page!=='ARCHIVE')return oldListing(arr);
 if(!arr.length)return '<div class="empty">資料はまだ登録されていません。「＋ 追加」から登録できます。</div>';
 return `<div class="archive-folder-grid">${arr.map((o,i)=>`<article class="archive-folder-item" role="button" tabindex="0" onclick="detail('${safe(o.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();detail('${safe(o.id)}')}">${folderSvg(o)}<span class="archive-folder-title">${safe(o.title||'無題')}</span></article>`).join('')}</div>`;
};
const oldFilter=filterbar;
filterbar=function(){
 if(page!=='ARCHIVE')return oldFilter();
 return `<div class="row archive-list-controls"><select class="search" aria-label="並び順" onchange="order=this.value;render()"><option value="new" ${order==='new'?'selected':''}>新しい順</option><option value="old" ${order==='old'?'selected':''}>古い順</option></select></div>`;
};
const oldDetail=showDetail;
showDetail=function(o){
 if(o?.type!=='ARCHIVE')return oldDetail(o);
 const files=(o.images||[]).map((src,i)=>{
  const m=metaFor(o,i),name=m.name||`画像 ${i+1}`;
  return `<div class="archive-file-item" role="button" tabindex="0" onclick="archivePreview('${safe(o.id)}',${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();archivePreview('${safe(o.id)}',${i})}"><img src="${src}" alt="${safe(name)}" loading="lazy"><div class="archive-file-name">${safe(name)}</div>${m.year?`<div class="archive-file-year">${safe(m.year)}</div>`:''}</div>`;
 }).join('');
 return `<button class="button secondary" type="button" onclick="back()">‹ 戻る</button><div class="archive-open-window"><div class="archive-open-heading"><span class="archive-mini-folder">▱</span><h1>${safe(o.title||'無題のフォルダ')}</h1></div><div class="archive-file-count">${(o.images||[]).length} items</div>${files?`<div class="archive-files-grid">${files}</div>`:'<div class="archive-no-files">画像はまだ登録されていません</div>'}${o.body?`<div class="archive-folder-description">${safe(o.body)}</div>`:''}</div><div class="actions"><button class="button secondary" onclick="favorite('${safe(o.id)}')">${o.fav?'♥ 登録済み':'♡ お気に入り'}</button><button class="button secondary" onclick="editor('${safe(o.id)}')">編集</button><button class="button danger" onclick="removeItem('${safe(o.id)}')">削除</button></div>`;
};
let editId=null,draft=[];
function drawRows(){
 const target=document.getElementById('archiveImageRows');if(!target)return;
 target.innerHTML=draft.map((item,i)=>`<div class="archive-edit-row"><img src="${item.src}" alt="画像 ${i+1}"><div class="archive-edit-fields"><label class="field">アイテム名<input type="text" class="archive-item-name" data-index="${i}" value="${safe(item.name||'')}" placeholder="画像 ${i+1}" maxlength="120"></label><label class="field">年（任意）<input type="text" class="archive-item-year" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" data-index="${i}" value="${safe(item.year||'')}" placeholder="例：2024"></label></div><button class="button danger archive-remove-image" type="button" onclick="archiveRemoveDraft(${i})">削除</button></div>`).join('')||'<p class="muted">画像はまだありません。</p>';
}
function syncRows(){
 document.querySelectorAll('.archive-edit-row').forEach(row=>{
  const name=row.querySelector('.archive-item-name'),year=row.querySelector('.archive-item-year');if(!name)return;
  const i=Number(name.dataset.index);if(draft[i]){draft[i].name=name.value;draft[i].year=year.value}
 });
}
window.archiveRemoveDraft=function(i){syncRows();draft.splice(i,1);drawRows()};
window.archiveAddFiles=async function(input){
 syncRows();const files=[...(input.files||[])];input.disabled=true;
 try{for(const file of files){const src=await readFile(file);draft.push({src,name:file.name.replace(/\.[^.]+$/,'').slice(0,120),year:''})}drawRows()}
 catch(err){alert('画像を読み込めませんでした: '+(err?.message||err))}
 finally{input.value='';input.disabled=false}
};
window.archiveEditor=function(id){
 const o=id?data.find(x=>x.id===id):null;editId=id||null;
 draft=(o?.images||[]).map((src,i)=>({src,name:metaFor(o,i).name||'',year:metaFor(o,i).year||''}));
 $('#modal').innerHTML=`<div class="overlay archive-edit-overlay"><div class="inner"><div class="heading"><h1>${o?'編集':'新規追加'} · ARCHIVE</h1><button type="button" class="icon" onclick="archiveCancelEditor()">✕</button></div><form id="archiveEditForm" onsubmit="archiveSave(event)"><label class="field">フォルダ名<input name="title" required maxlength="200" value="${safe(o?.title||'')}"></label><label class="field">説明文（任意）<textarea name="body">${safe(o?.body||'')}</textarea></label><label class="field">画像を追加（複数選択可）<input id="archiveFiles" type="file" accept="image/*" multiple onchange="archiveAddFiles(this)"></label><p class="muted">各画像に名前と年を設定できます。年は西暦4桁・未入力も可能です。</p><div id="archiveImageRows"></div><div class="actions"><button id="archiveSaveButton" class="button" type="submit">保存する</button><button class="button secondary" type="button" onclick="archiveCancelEditor()">キャンセル</button></div></form></div></div>`;
 drawRows();
};
window.archiveCancelEditor=function(){if(confirm('編集を終了しますか？ 未保存の変更は破棄されます。'))dismissOverlay()};
window.archiveSave=async function(ev){
 ev.preventDefault();syncRows();const form=ev.currentTarget;if(!form.reportValidity())return;
 const yearInvalid=draft.some(item=>item.year&&!/^\d{4}$/.test(item.year));if(yearInvalid){alert('年は西暦4桁で入力してください。');return}
 const button=document.getElementById('archiveSaveButton');if(button)button.disabled=true;
 const old=editId?data.find(x=>x.id===editId):null;
 const o=old?{...old}:{id:uuid(),type:'ARCHIVE',images:[],replies:[],fav:false,when:today()};
 o.title=form.elements.title.value.trim();o.body=form.elements.body.value;
 o.images=draft.map(item=>item.src);
 o.archiveItems=draft.map(item=>({name:String(item.name||'').trim(),year:String(item.year||'').trim()}));
 if(!Number.isFinite(Number(o.archiveFolderHue))||o.archiveFolderHue==null){o.archiveFolderHue=hueFor(o);if(!old){const others=data.filter(x=>x.type==='ARCHIVE').length;o.archiveFolderHue=(335+others*137.50776405)%360;}}
 if(!o.title){alert('フォルダ名を入力してください');if(button)button.disabled=false;return}
 try{await put(o);dismissOverlay();selected=o.id;await update();window.scrollTo(0,0)}
 catch(err){alert('保存できませんでした: '+(err?.message||err));if(button)button.disabled=false}
};
const oldEditor=editor;
editor=function(id){const o=id?data.find(x=>x.id===id):null;if((o?.type||page)==='ARCHIVE')return archiveEditor(id);return oldEditor(id)};
let preview=null,gesture=null;
window.archivePreview=function(id,i){const o=data.find(x=>x.id===id);if(!o?.images?.[i])return;preview={id,i};drawPreview()};
window.archivePreviewClose=function(){preview=null;dismissOverlay()};
window.archivePreviewNext=function(step){if(!preview)return;const o=data.find(x=>x.id===preview.id);if(!o?.images?.length)return;preview.i=(preview.i+step+o.images.length)%o.images.length;drawPreview()};
function drawPreview(){
 if(!preview)return;const o=data.find(x=>x.id===preview.id);if(!o)return;const i=preview.i,m=metaFor(o,i);
 $('#modal').innerHTML=`<div class="archive-preview-overlay" role="presentation" onclick="if(event.target===this)archivePreviewClose()"><div class="archive-preview-dialog" role="dialog" aria-modal="true" aria-label="画像プレビュー"><div class="archive-preview-top"><div class="archive-preview-meta"><strong>${safe(m.name||`画像 ${i+1}`)}</strong>${m.year?`<span>${safe(m.year)}</span>`:''}</div><button type="button" class="archive-preview-close" aria-label="閉じる" onclick="archivePreviewClose()">×</button></div><div class="archive-preview-media" ontouchstart="archivePreviewTouchStart(event)" ontouchmove="archivePreviewTouchMove(event)" ontouchend="archivePreviewTouchEnd(event)" ontouchcancel="archivePreviewTouchCancel()"><img src="${o.images[i]}" alt="${safe(m.name||'画像')}" draggable="false"></div><div class="archive-preview-controls"><button type="button" onclick="archivePreviewNext(-1)" aria-label="前の画像" ${o.images.length===1?'disabled':''}>‹</button><span>${i+1} / ${o.images.length}</span><button type="button" onclick="archivePreviewNext(1)" aria-label="次の画像" ${o.images.length===1?'disabled':''}>›</button></div></div></div>`;
}
window.archivePreviewTouchStart=function(ev){if(ev.touches.length!==1)return;gesture={x:ev.touches[0].clientX,y:ev.touches[0].clientY}};
window.archivePreviewTouchMove=function(ev){if(!gesture||ev.touches.length!==1)return;const dx=ev.touches[0].clientX-gesture.x,dy=ev.touches[0].clientY-gesture.y;if(Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy)*1.3&&ev.cancelable)ev.preventDefault()};
window.archivePreviewTouchEnd=function(ev){if(!gesture||ev.changedTouches.length!==1)return;const dx=ev.changedTouches[0].clientX-gesture.x,dy=ev.changedTouches[0].clientY-gesture.y;gesture=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.35)archivePreviewNext(dx<0?1:-1)};
window.archivePreviewTouchCancel=function(){gesture=null};
// Prevent ordinary outside keyboard actions from lingering when the preview closes.
document.addEventListener('keydown',ev=>{if(!preview)return;if(ev.key==='Escape'){ev.preventDefault();archivePreviewClose()}else if(ev.key==='ArrowLeft'){ev.preventDefault();archivePreviewNext(-1)}else if(ev.key==='ArrowRight'){ev.preventDefault();archivePreviewNext(1)}});
})();
