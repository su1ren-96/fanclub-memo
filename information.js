/* INFORMATION article layout patch. No database migrations; other sections untouched. */
(function(){
'use strict';
const previousEditor=editor;
const previousDetail=showDetail;
let draft=null;
const tag=i=>`[画像${i+1}]`;
const tagPattern=/\[画像(\d+)\]/g;
const cleanText=s=>String(s||'').replace(tagPattern,'').replace(/\n{3,}/g,'\n\n').trim();
function initialLayout(o){
 if(typeof o?.infoBodyLayout==='string')return o.infoBodyLayout;
 const text=o?.body||'';
 return text+((o?.images||[]).length?'\n\n'+o.images.map((_,i)=>tag(i)).join('\n\n'):'');
}
function appendMissing(layout,count){
 const used=new Set();for(const m of layout.matchAll(/\[画像(\d+)\]/g))used.add(Number(m[1])-1);
 const missing=Array.from({length:count},(_,i)=>i).filter(i=>!used.has(i));
 return layout+(missing.length?'\n\n'+missing.map(tag).join('\n\n'):'');
}
// Convert only escaped plain text to safe clickable HTTP(S) links.
function linkifyPlain(value){
 const escaped=e(value);
 return escaped.replace(/https?:\/\/[^\s<>"']+/gi,found=>{
   const match=found.match(/^(.*?)([、。，．！？!?）)\]」』]+)?$/);
   const link=match?match[1]:found,tail=match?(match[2]||''):'';
   return `<a class="info-body-link" href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>${tail}`;
 });
}
function articleContent(o){
 const images=Array.isArray(o.images)?o.images:[];
 const layout=appendMissing(initialLayout(o),images.length);
 const fragments=[];let index=0;
 for(const m of layout.matchAll(/\[画像(\d+)\]/g)){
  const plain=layout.slice(index,m.index);
  if(plain.trim())fragments.push(`<p class="info-text-block">${linkifyPlain(plain.trim())}</p>`);
  const photoIndex=Number(m[1])-1;
  if(Number.isInteger(photoIndex)&&photoIndex>=0&&photoIndex<images.length){
   fragments.push(`<figure class="info-inline-photo"><img src="${images[photoIndex]}" alt="記事内の画像 ${photoIndex+1}" loading="lazy" onclick="viewer('${o.id}',${photoIndex})"></figure>`);
  } else fragments.push(`<p class="info-text-block">${e(m[0])}</p>`);
  index=m.index+m[0].length;
 }
 const tail=layout.slice(index);if(tail.trim())fragments.push(`<p class="info-text-block">${linkifyPlain(tail.trim())}</p>`);
 return fragments.join('');
}
showDetail=function(o){
 if(o?.type!=='INFORMATION')return previousDetail(o);
 const categoryBadgeHtml=categoryBadge(o.category||'OTHER')+membersOnlyTag(o);
 const actions=`<div class="actions"><button class="button secondary" onclick="editor('${o.id}')">編集</button><button class="button danger" onclick="removeItem('${o.id}')">削除</button></div>`;
 return `<button class="button secondary" onclick="back()">‹ 戻る</button><div class="meta" style="margin-top:12px">INFORMATION</div><article class="notice-article info-article">${categoryBadgeHtml}<h1>${e(o.title||'')}</h1><div class="meta info-article-date">${day(o.when)}</div><div class="line"></div><div class="info-body">${articleContent(o)}</div></article>${actions}`;
};
function keepDraft(){if(!draft)return;const form=document.getElementById('infoForm');if(!form)return;const fields=new FormData(form);draft.title=String(fields.get('title')||'');draft.category=String(fields.get('category')||'NOTICE');draft.membersOnly=fields.get('membersOnly')==='on';draft.when=String(fields.get('when')||'');draft.layout=document.getElementById('infoLayout')?.value??draft.layout;}
function renderImageRows(){const container=document.getElementById('infoImages');if(!container||!draft)return;
 container.innerHTML=draft.images.map((src,i)=>`<div class="info-image-row"><img src="${src}" alt="画像${i+1}"><div><strong>画像${i+1}</strong><small>${tag(i)} を本文に記入するとその位置に表示されます</small></div><button type="button" class="button secondary" onclick="infoInsertImage(${i})">挿入</button><button type="button" class="button danger" onclick="infoDeleteImage(${i})">削除</button></div>`).join('');
}
function openEditor(id){const o=id?data.find(x=>x.id===id):null;
 draft={id:id||null,title:o?.title||'',when:o?.when||today(),category:o?.category||'NOTICE',membersOnly:o?.membersOnly===true,images:[...(o?.images||[])],layout:initialLayout(o)};
 const html=`<div class="overlay"><div class="inner"><div class="heading"><h1>${o?'編集':'新規追加'} · INFORMATION</h1><button class="icon" type="button" onclick="infoCancel()">✕</button></div><form id="infoForm" onsubmit="infoSave(event)"><label class="field">タイトル<input name="title" required value="${e(draft.title)}"></label><label class="field">カテゴリ<select name="category">${INFO_CATEGORIES.map(c=>`<option value="${e(c)}" ${c===draft.category?'selected':''}>${e(c)}</option>`).join('')}</select></label><label class="field info-members-edit"><input type="checkbox" name="membersOnly" ${draft.membersOnly?'checked':''}> MEMBERS ONLYを表示する</label><label class="field">公開日時<input type="datetime-local" name="when" value="${e(draft.when)}"></label><label class="field">本文（画像を入れたい位置にカーソルを置いて「挿入」を押してください）<textarea id="infoLayout" name="layout" rows="12" placeholder="記事本文を入力…">${e(draft.layout)}</textarea></label><p class="muted">［画像1］のような画像タグを文章中に置くことで、その場所に画像が表示されます。移動したい場合はタグを切り取って好きな位置に貼り付けてください。</p><label class="field">画像を追加<input id="infoFiles" type="file" accept="image/*" multiple onchange="infoAddFiles(this)"></label><div id="infoImages"></div><div class="actions"><button class="button" id="infoSaveButton" type="submit">保存する</button><button class="button secondary" type="button" onclick="infoCancel()">キャンセル</button></div></form></div></div>`;
 $('#modal').innerHTML=html;renderImageRows();
}
editor=function(id){const o=id?data.find(x=>x.id===id):null;if((o?.type||page)==='INFORMATION')return openEditor(id);return previousEditor(id)};
window.infoInsertImage=function(i){const textarea=document.getElementById('infoLayout');if(!textarea||!draft)return;const value=tag(i),start=textarea.selectionStart??textarea.value.length,end=textarea.selectionEnd??start;textarea.value=textarea.value.slice(0,start)+(start&&textarea.value[start-1]!=='\n'?'\n':'')+value+'\n'+textarea.value.slice(end);textarea.focus();textarea.setSelectionRange(start+value.length+1,start+value.length+1)};
window.infoAddFiles=async function(input){if(!draft)return;const files=Array.from(input.files||[]);input.disabled=true;const ta=document.getElementById('infoLayout');try{for(const file of files){const source=await readFile(file);const i=draft.images.length;draft.images.push(source);if(ta){ta.value+=(ta.value.trim()?'\n\n':'')+tag(i)};}renderImageRows()}catch(err){alert('画像の読み込みに失敗しました: '+(err.message||err))}finally{input.value='';input.disabled=false}};
window.infoDeleteImage=function(i){if(!draft||!confirm(`画像${i+1}を記事から削除しますか？（保存前ならキャンセルできます）`))return;const ta=document.getElementById('infoLayout');let layout=ta?.value||draft.layout;layout=layout.replace(tagPattern,(match,n)=>{const x=Number(n)-1;return x===i?'':x>i?tag(x-1):match});draft.images.splice(i,1);if(ta)ta.value=layout;draft.layout=layout;renderImageRows()};
window.infoCancel=function(){if(!draft)return; if(!confirm('編集画面を閉じますか？保存していない変更は破棄されます。'))return;draft=null;dismissOverlay()};
window.infoSave=async function(ev){ev.preventDefault();if(!draft)return;keepDraft();if(!draft.title.trim())return alert('タイトルを入力してください');const button=document.getElementById('infoSaveButton');if(button)button.disabled=true;try{const existing=draft.id?data.find(o=>o.id===draft.id):null;const o=existing?{...existing}:{id:uuid(),type:'INFORMATION',images:[],replies:[],fav:false};o.title=draft.title.trim();o.category=draft.category;o.membersOnly=draft.membersOnly;o.when=draft.when;o.infoBodyLayout=appendMissing(draft.layout,draft.images.length);o.body=cleanText(o.infoBodyLayout);o.images=[...draft.images];await put(o);draft=null;dismissOverlay();selected=o.id;page='INFORMATION';await update();window.scrollTo(0,0)}catch(err){alert('保存に失敗しました: '+(err.message||err));if(button)button.disabled=false}};
})();
