/* INFORMATION membership marker and MUSIC presentation patch, 2026-11-23. */
(function(){
'use strict';
window.membersOnlyTag=function(o){return o?.membersOnly===true?'<span class="info-members-text">MEMBERS ONLY</span>':''};
const previousListing=listing;
listing=function(arr){
 if(page!=='MUSIC')return previousListing(arr);
 if(!arr.length)return '<div class="empty">まだ登録がありません</div>';
 return `<div class="music-glass-grid">${arr.map(o=>`<article class="music-glass-card" role="button" tabindex="0" onclick="detail('${e(o.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();detail('${e(o.id)}')}">
  ${o.images?.[0]?`<img class="music-glass-cover" src="${o.images[0]}" alt="${e(o.title||'MUSIC')}のジャケット" loading="lazy">`:'<div class="music-glass-cover music-glass-empty" aria-hidden="true">♫</div>'}
  <div class="music-glass-info"><h3>${e(o.title||'無題')}</h3><time>${day(o.when)}</time></div>
 </article>`).join('')}</div>`;
};
const previousDetail=showDetail;
showDetail=function(o){
 if(o?.type!=='MUSIC')return previousDetail(o);
 const art=o.images?.[0]?`<img class="music-story-cover" src="${o.images[0]}" alt="${e(o.title||'MUSIC')}のジャケット" onclick="viewer('${e(o.id)}',0)">`:'<div class="music-story-cover music-story-empty" aria-label="ジャケット未登録">♫</div>';
 const text=o.body?`<div class="music-story-text">${e(o.body)}</div>`:'';
 return `<button class="button secondary" onclick="back()">‹ 戻る</button><div class="meta music-story-label">MUSIC</div><article class="music-story"><h1>${e(o.title||'無題')}</h1>${art}${text}<time class="music-story-date">${day(o.when)}</time></article><div class="actions"><button class="button secondary" onclick="favorite('${e(o.id)}')">${o.fav?'♥ 登録済み':'♡ お気に入り'}</button><button class="button secondary" onclick="editor('${e(o.id)}')">編集</button><button class="button danger" onclick="removeItem('${e(o.id)}')">削除</button></div>`;
};
const previousEditor=editor;
editor=function(id){
 const o=id?data.find(x=>x.id===id):null;
 if((o?.type||page)!=='MUSIC')return previousEditor(id);
 const result=previousEditor(id);
 const form=document.getElementById('editform');
 if(!form)return result;
 const tracks=form.querySelector('[name="tracks"]');
 if(tracks)tracks.closest('label')?.remove(); // Existing tracks stay in the stored record.
 const body=form.querySelector('[name="body"]');
 if(body){const label=body.closest('label');if(label&&label.firstChild&&label.firstChild.nodeType===3)label.firstChild.textContent='本文（説明・歌詞など）';body.placeholder='楽曲の紹介文や歌詞を自由に入力（改行対応）';}
 editorSnapshot=new URLSearchParams(new FormData(form)).toString();
 return result;
};
})();
