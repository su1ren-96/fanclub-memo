/* Fanclub Memo 6.9 - GREETING CARD display adjustments. Additive; no storage migrations. */
(function(){
'use strict';
SPECIAL_NAMES.greeting='デジタルグリーティングカード';
const oldSpecialEditor=specialEditor;
const oldSpecialArticle=specialArticle;
const oldTemplateChange=specialTemplateChange;
let draft=null;
let editingId=null;
const defaultGreeting=()=>({mode:'envelope',background:'#f5eaf7',envelopeColor:'#e8c9e6',envelopeDesign:'simple',front:'',back:'',message:'',signature:'',headingColor:'',titleColor:'',dateColor:'',messageColor:''});
// Existing cards have no color preferences: select a legible color from the background.
function gcValidColor(v){return typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)}
function gcAutoTextColor(bg){
 if(!gcValidColor(bg))return '#4e4057';
 const rgb=[1,3,5].map(i=>parseInt(bg.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
 return luminance<.20?'#ffffff':'#4e4057';
}
function gcColor(value,background){return gcValidColor(value)?value:gcAutoTextColor(background)}
const getRecord=id=>id?data.find(x=>x.id===id):null;
window.specialEditor=specialEditor=function(id){
 const o=getRecord(id);
 if(o?.template==='greeting')return openGreetingEditor(id);
 return oldSpecialEditor(id);
};
window.specialTemplateChange=specialTemplateChange=function(value){
 if(value!=='greeting')return oldTemplateChange(value);
 specialCapture();
 const old=specialDraft;
 editingId=specialEditing;
 draft={title:old.title||'',when:old.when||today(),...defaultGreeting(),front:old.hero||''};
 drawGreetingEditor();
};
function greetingCapture(){
 if(!draft)return;
 const val=(id,fallback)=>document.getElementById(id)?.value??fallback;
 draft.title=val('gcTitle',draft.title);
 draft.when=val('gcWhen',draft.when);
 draft.mode=val('gcMode',draft.mode);
 draft.background=val('gcBackground',draft.background);
 draft.envelopeColor=val('gcEnvelopeColor',draft.envelopeColor);
 draft.envelopeDesign=val('gcEnvelopeDesign',draft.envelopeDesign);
 draft.message=val('gcMessage',draft.message);
 draft.signature=val('gcSignature',draft.signature);
 for(const [key,id] of [['headingColor','gcHeadingColor'],['titleColor','gcTitleColor'],['dateColor','gcDateColor'],['messageColor','gcMessageColor']]){
  const picker=document.getElementById(id);if(picker)draft[key]=picker.value;
 }
}
function openGreetingEditor(id){
 const o=getRecord(id);editingId=id||null;
 draft={title:o?.title||'',when:o?.when||today(),...defaultGreeting(),...(o?.greeting||{})};
 if(!draft.front)draft.front=o?.images?.[0]||'';
 drawGreetingEditor();
}
window.greetingModeChange=function(mode){greetingCapture();draft.mode=mode;drawGreetingEditor()};
window.greetingToArticle=function(template){
 greetingCapture();
 if(template==='greeting')return;
 if(!confirm('記事テンプレートに切り替えますか？カードの未保存設定は引き継がれません。')){
   document.getElementById('gcTemplate').value='greeting';return;
 }
 const keep=draft;
 specialEditing=editingId;
 specialDraft={title:keep.title,when:keep.when,body:keep.message,template,hero:keep.front,sections:initialSpecialSections(template)};
 draft=null;drawSpecialEditor();
};
function drawGreetingEditor(){
 const s=draft; if(!s)return;
 const envelope=s.mode==='envelope';
 const fileLabel=(label,field,url)=>`<label class="field">${label}${url?`<img class="gc-editor-img" src="${url}" alt="登録済み画像">`:''}<input type="file" id="${field}" accept="image/*"></label>`;
 document.getElementById('modal').innerHTML=`<div class="overlay"><div class="inner"><div class="heading"><h1>${editingId?'編集':'新規追加'} · SPECIAL</h1><button type="button" class="icon" onclick="greetingCancel()">✕</button></div>
 <p class="muted">画像を登録して、カードの表示形式を選択します。既存の特集記事には影響しません。</p>
 <label class="field">特集テンプレート<select id="gcTemplate" onchange="greetingToArticle(this.value)">${Object.entries(SPECIAL_NAMES).map(([key,name])=>`<option value="${key}" ${key==='greeting'?'selected':''}>${name}</option>`).join('')}</select></label>
 <label class="field">カードの表示形式<select id="gcMode" onchange="greetingModeChange(this.value)"><option value="envelope" ${envelope?'selected':''}>封筒を開くタイプ</option><option value="flip" ${!envelope?'selected':''}>表・裏の2面タイプ</option></select></label>
 <label class="field">タイトル<input id="gcTitle" value="${e(s.title)}" placeholder="例：HAPPY NEW YEAR"></label>
 <label class="field">公開日時<input id="gcWhen" type="datetime-local" value="${e(s.when)}"></label>
 ${fileLabel(envelope?'カード画像':'表面画像','gcFront',s.front)}
 ${s.front?'<label class="gc-check"><input id="gcClearFront" type="checkbox"> 登録済み画像を削除</label>':''}
 ${!envelope?fileLabel('裏面画像（任意）','gcBack',s.back):''}
 ${!envelope&&s.back?'<label class="gc-check"><input id="gcClearBack" type="checkbox"> 登録済み裏面画像を削除</label>':''}
 <label class="field">メッセージ（任意）<textarea id="gcMessage" placeholder="カードに添えるメッセージ">${e(s.message)}</textarea></label>
 <label class="field">署名・差出人名（任意）<input id="gcSignature" value="${e(s.signature)}"></label>
 <label class="field">背景色<input id="gcBackground" type="color" value="${e(s.background)}"></label>
 <div class="gc-color-controls"><p class="muted">文字色（背景が濃い場合は白など、自由に変更できます）</p>
 <label class="field">「GREETING CARD」の見出し色<input id="gcHeadingColor" type="color" value="${gcColor(s.headingColor,s.background)}"></label>
 <label class="field">タイトルの文字色<input id="gcTitleColor" type="color" value="${gcColor(s.titleColor,s.background)}"></label>
 <label class="field">日付の文字色<input id="gcDateColor" type="color" value="${gcColor(s.dateColor,s.background)}"></label>
 <label class="field">メッセージ・署名の文字色<input id="gcMessageColor" type="color" value="${gcColor(s.messageColor,s.background)}"></label>
 <button type="button" class="button secondary" onclick="greetingAutoTextColors()">背景に合わせて文字色を自動設定</button></div>
 ${envelope?`<label class="field">封筒の色<input id="gcEnvelopeColor" type="color" value="${e(s.envelopeColor)}"></label>
 <label class="field">封筒のデザイン<select id="gcEnvelopeDesign"><option value="simple" ${s.envelopeDesign==='simple'?'selected':''}>シンプル</option><option value="floral" ${s.envelopeDesign==='floral'?'selected':''}>フラワー</option><option value="elegant" ${s.envelopeDesign==='elegant'?'selected':''}>エレガント</option></select></label>`:''}
 <div class="actions"><button type="button" class="button secondary" onclick="greetingPreview()">プレビュー</button><button type="button" class="button" onclick="greetingSave()">保存する</button><button type="button" class="button secondary" onclick="greetingCancel()">キャンセル</button></div>
 <p class="muted">プレビューでは未保存の変更を確認できます。再生用の動画ファイルや追加ライブラリは使用しません。</p></div></div>`;
}
window.greetingAutoTextColors=function(){
 const bg=document.getElementById('gcBackground')?.value||draft?.background;const color=gcAutoTextColor(bg);
 for(const id of ['gcHeadingColor','gcTitleColor','gcDateColor','gcMessageColor']){const el=document.getElementById(id);if(el)el.value=color;}
};
window.greetingCancel=function(){greetingCapture();if(!confirm('保存せずに編集画面を閉じますか？'))return;draft=null;editingId=null;dismissOverlay()};
const readImageInput=async id=>{const f=document.getElementById(id)?.files?.[0];return f?await readFile(f):null};
async function collectGreetingImages(){
 greetingCapture();
 if(document.getElementById('gcClearFront')?.checked)draft.front='';
 if(document.getElementById('gcClearBack')?.checked)draft.back='';
 const front=await readImageInput('gcFront');if(front)draft.front=front;
 const back=await readImageInput('gcBack');if(back)draft.back=back;
}
window.greetingPreview=async function(){
 try{await collectGreetingImages();const preview={id:'preview',type:'SPECIAL',template:'greeting',title:draft.title||'GREETING CARD',when:draft.when,greeting:{...draft},images:draft.front?[draft.front]:[]};
  document.getElementById('modal').innerHTML=`<div class="overlay gc-preview"><div class="inner"><button type="button" class="button secondary" onclick="drawGreetingEditorAgain()">‹ 編集に戻る</button>${greetingContent(preview,true)}</div></div>`;
 }catch(err){alert('画像を読み込めませんでした: '+err.message)}
};
window.drawGreetingEditorAgain=drawGreetingEditor;
window.greetingSave=async function(){
 try{
  await collectGreetingImages();const s=draft;
  if(!s.title.trim())return alert('タイトルを入力してください');
  if(!s.front)return alert('カード画像を登録してください');
  const original=getRecord(editingId);
  const o=original?{...original}:{id:uuid(),type:'SPECIAL',images:[],fav:false,replies:[]};
  o.title=s.title.trim();o.when=s.when;o.template='greeting';o.body=s.message;
  o.greeting={mode:s.mode,background:s.background,envelopeColor:s.envelopeColor,envelopeDesign:s.envelopeDesign,front:s.front,back:s.back,message:s.message,signature:s.signature,headingColor:s.headingColor,titleColor:s.titleColor,dateColor:s.dateColor,messageColor:s.messageColor};
  o.images=[s.front];
  await put(o);
  draft=null;editingId=null;specialDraft=null;specialEditing=null;
  dismissOverlay();page='SPECIAL';selected=o.id;await update();window.scrollTo(0,0);
 }catch(err){alert('カードの保存に失敗しました: '+err.message)}
};
function greetingContent(o,preview=false){
 const g={...defaultGreeting(),...(o.greeting||{})};
 const flip=g.mode==='flip';
 let card=flip?`<button type="button" class="gc-flip" ${g.back?`onclick="greetingFlip(this)" aria-label="カードの表裏を切り替える"`:`aria-label="カードの表面" style="cursor:default"`}><span class="gc-flip-inner"><span class="gc-face gc-front"><img src="${g.front}" alt="表面" onload="greetingImageSized(this,'flip')"></span>${g.back?`<span class="gc-face gc-back"><img src="${g.back}" alt="裏面" onload="greetingImageSized(this,'flipBack')"></span>`:''}</span></button>`:
 `<div class="gc-envelope-stage"><button type="button" class="gc-envelope gc-${g.envelopeDesign}" style="--env-color:${e(g.envelopeColor)}" onclick="greetingOpen(this)" aria-label="封筒を開く"><span class="gc-flap"></span><span class="gc-pocket"></span><span class="gc-card"><img src="${g.front}" alt="グリーティングカード" onload="greetingImageSized(this,'envelope')"></span><span class="gc-seal">✉</span></button><p class="gc-hint">封筒をタップして開く・閉じる</p></div>`;
 return `<section class="gc-detail" style="--gc-bg:${e(g.background)};--gc-heading-color:${gcColor(g.headingColor,g.background)};--gc-title-color:${gcColor(g.titleColor,g.background)};--gc-date-color:${gcColor(g.dateColor,g.background)};--gc-message-color:${gcColor(g.messageColor,g.background)}"><div class="gc-title"><small>GREETING CARD</small><h1>${e(o.title)}</h1></div>${card}<div class="meta gc-date">${day(o.when)}</div>${g.message?`<div class="gc-message">${e(g.message)}</div>`:''}${g.signature?`<div class="gc-signature">${e(g.signature)}</div>`:''}</section>`;
}
// Size only the viewing frame. Never change stored images or existing records.
function fitCard(img, envelope){
 const w=img.naturalWidth||1,h=img.naturalHeight||1,ratio=w/h;
 const maxW=Math.min(envelope?320:440, Math.max(200,window.innerWidth-90));
 const maxH=Math.min(envelope?370:Math.round(window.innerHeight*.58),envelope?370:560);
 const width=Math.max(1,Math.round(Math.min(maxW,maxH*ratio)));
 return {width,height:Math.max(1,Math.round(width/ratio))};
}
window.greetingImageSized=function(img,kind){
 if(!img.naturalWidth||!img.naturalHeight)return;
 if(kind==='envelope'){
   const box=img.closest('.gc-envelope'); if(!box)return;
   const v=fitCard(img,true);
   box.style.setProperty('--gc-card-w',v.width+'px');
   box.style.setProperty('--gc-card-h',v.height+'px');
 }else{
   const box=img.closest('.gc-flip');if(!box)return;
   const v=fitCard(img,false);
   const isBack=kind==='flipBack';
   box.dataset[isBack?'backRatio':'frontRatio']=String(img.naturalWidth/img.naturalHeight);
   // Only the visible face determines dimensions; no blank padding for landscape cards.
   if(!isBack||box.classList.contains('gc-flipped')){
      box.style.width=v.width+'px';box.style.height=v.height+'px';
   }
 }
};
window.greetingOpen=function(btn){btn.classList.toggle('gc-open');btn.setAttribute('aria-expanded',String(btn.classList.contains('gc-open')))};
window.greetingFlip=function(btn){
 btn.classList.toggle('gc-flipped');
 const image=btn.querySelector(btn.classList.contains('gc-flipped')?'.gc-back img':'.gc-front img');
 if(image?.naturalWidth)greetingImageSized(image,btn.classList.contains('gc-flipped')?'flipBack':'flip');
 else if(!btn.classList.contains('gc-flipped')){
   const front=btn.querySelector('.gc-front img');if(front?.naturalWidth)greetingImageSized(front,'flip');
 }
};
window.specialArticle=specialArticle=function(o){
 if(o.template!=='greeting')return oldSpecialArticle(o);
 return `<button class="button secondary" onclick="back()">‹ 戻る</button>${greetingContent(o)}<div class="actions"><button class="button secondary" onclick="editor('${o.id}')">編集</button><button class="button danger" onclick="removeItem('${o.id}')">削除</button></div>`;
};
})();
