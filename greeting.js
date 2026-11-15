/* Fanclub Memo 6.6 - GREETING CARD. Additive feature; no storage migrations. */
(function(){
'use strict';
SPECIAL_NAMES.greeting='デジタルグリーティングカード';
const oldSpecialEditor=specialEditor;
const oldSpecialArticle=specialArticle;
const oldTemplateChange=specialTemplateChange;
let draft=null;
let editingId=null;
const defaultGreeting=()=>({mode:'envelope',background:'#f5eaf7',envelopeColor:'#e8c9e6',envelopeDesign:'simple',front:'',back:'',message:'',signature:''});
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
 ${envelope?`<label class="field">封筒の色<input id="gcEnvelopeColor" type="color" value="${e(s.envelopeColor)}"></label>
 <label class="field">封筒のデザイン<select id="gcEnvelopeDesign"><option value="simple" ${s.envelopeDesign==='simple'?'selected':''}>シンプル</option><option value="floral" ${s.envelopeDesign==='floral'?'selected':''}>フラワー</option><option value="elegant" ${s.envelopeDesign==='elegant'?'selected':''}>エレガント</option></select></label>`:''}
 <div class="actions"><button type="button" class="button secondary" onclick="greetingPreview()">プレビュー</button><button type="button" class="button" onclick="greetingSave()">保存する</button><button type="button" class="button secondary" onclick="greetingCancel()">キャンセル</button></div>
 <p class="muted">プレビューでは未保存の変更を確認できます。再生用の動画ファイルや追加ライブラリは使用しません。</p></div></div>`;
}
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
  o.greeting={mode:s.mode,background:s.background,envelopeColor:s.envelopeColor,envelopeDesign:s.envelopeDesign,front:s.front,back:s.back,message:s.message,signature:s.signature};
  o.images=[s.front];
  await put(o);
  draft=null;editingId=null;specialDraft=null;specialEditing=null;
  dismissOverlay();page='SPECIAL';selected=o.id;await update();window.scrollTo(0,0);
 }catch(err){alert('カードの保存に失敗しました: '+err.message)}
};
function greetingContent(o,preview=false){
 const g={...defaultGreeting(),...(o.greeting||{})};
 const flip=g.mode==='flip';
 let card=flip?`<button type="button" class="gc-flip" onclick="greetingFlip(this)" aria-label="カードの表裏を切り替える"><span class="gc-flip-inner"><span class="gc-face gc-front"><img src="${g.front}" alt="表面"></span><span class="gc-face gc-back">${g.back?`<img src="${g.back}" alt="裏面">`:`<span class="gc-back-message">${e(g.message||'MESSAGE')}<br><small>${e(g.signature)}</small></span>`}</span></span></button><p class="gc-hint">カードをタップすると裏返ります</p>`:
 `<div class="gc-envelope-stage"><button type="button" class="gc-envelope gc-${g.envelopeDesign}" style="--env-color:${e(g.envelopeColor)}" onclick="greetingOpen(this)" aria-label="封筒を開く"><span class="gc-flap"></span><span class="gc-pocket"></span><span class="gc-card"><img src="${g.front}" alt="グリーティングカード"></span><span class="gc-seal">✉</span></button><p class="gc-hint">封筒をタップして開く・閉じる</p></div>`;
 return `<section class="gc-detail" style="--gc-bg:${e(g.background)}"><div class="gc-title"><small>GREETING CARD</small><h1>${e(o.title)}</h1><div class="meta">${day(o.when)}</div></div>${card}${g.message?`<div class="gc-message">${e(g.message)}</div>`:''}${g.signature?`<div class="gc-signature">${e(g.signature)}</div>`:''}</section>`;
}
window.greetingOpen=function(btn){btn.classList.toggle('gc-open')};
window.greetingFlip=function(btn){btn.classList.toggle('gc-flipped')};
window.specialArticle=specialArticle=function(o){
 if(o.template!=='greeting')return oldSpecialArticle(o);
 return `<button class="button secondary" onclick="back()">‹ 戻る</button>${greetingContent(o)}<div class="actions"><button class="button secondary" onclick="editor('${o.id}')">編集</button><button class="button danger" onclick="removeItem('${o.id}')">削除</button></div>`;
};
})();
