(function(){const f=document.createElement("link").relList;if(f&&f.supports&&f.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const t of i)if(t.type==="childList")for(const p of t.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&r(p)}).observe(document,{childList:!0,subtree:!0});function s(i){const t={};return i.integrity&&(t.integrity=i.integrity),i.referrerPolicy&&(t.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?t.credentials="include":i.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(i){if(i.ep)return;i.ep=!0;const t=s(i);fetch(i.href,t)}})();const w={apiKey:"voycebx:apiKey",voiceId:"voycebx:voiceId",voiceName:"voycebx:voiceName",favorites:"voycebx:favorites",transcript:"voycebx:transcript"},ee=["Yes","No","Thank you","I need water","I am in pain","Please call the nurse","I need a moment","Can you repeat that?","I love you","I am okay","Please call my family","I need to rest"];function R(){return localStorage.getItem(w.apiKey)||""}function te(n){n?localStorage.setItem(w.apiKey,n):localStorage.removeItem(w.apiKey)}function Y(){return localStorage.getItem(w.voiceId)||""}function ne(n){n?localStorage.setItem(w.voiceId,n):localStorage.removeItem(w.voiceId)}function j(){return localStorage.getItem(w.voiceName)||"My Voice"}function ie(n){localStorage.setItem(w.voiceName,n)}function ae(){try{const n=localStorage.getItem(w.favorites);if(n)return JSON.parse(n)}catch{}return[...ee]}function oe(n){localStorage.setItem(w.favorites,JSON.stringify(n))}function se(){try{return JSON.parse(localStorage.getItem(w.transcript))||[]}catch{return[]}}function re(n){const f=n.slice(-500);localStorage.setItem(w.transcript,JSON.stringify(f))}function ce(){localStorage.removeItem(w.transcript)}const J="https://api.elevenlabs.io/v1";async function le(n){return(await fetch(`${J}/user`,{headers:{"xi-api-key":n}})).ok}async function de(n,f,s="My Voice"){var E;const r=new FormData;r.append("name",s),r.append("description","Voice clone created with VoyceBx");const i=f.type||"",t=i.includes("webm")?"webm":i.includes("mp4")||i.includes("m4a")?"m4a":i.includes("ogg")?"ogg":"wav";r.append("files",f,`sample.${t}`);const p=await fetch(`${J}/voices/add`,{method:"POST",headers:{"xi-api-key":n},body:r});if(!p.ok){let u=`Could not clone voice (${p.status})`;try{const m=await p.json();(E=m.detail)!=null&&E.message?u=m.detail.message:typeof m.detail=="string"&&(u=m.detail)}catch{}throw new Error(u)}return(await p.json()).voice_id}async function W(n,f,s){var i;const r=await fetch(`${J}/text-to-speech/${f}`,{method:"POST",headers:{"xi-api-key":n,"Content-Type":"application/json"},body:JSON.stringify({text:s,model_id:"eleven_multilingual_v2",voice_settings:{stability:.5,similarity_boost:.75,style:0,use_speaker_boost:!0}})});if(!r.ok){let t=`Speech generation failed (${r.status})`;try{const p=await r.json();(i=p.detail)!=null&&i.message?t=p.detail.message:typeof p.detail=="string"&&(t=p.detail)}catch{}throw new Error(t)}return r.arrayBuffer()}const ue="When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.";function H(n){return String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function G(n){const f=Math.floor(n/60),s=n%60;return`${f}:${String(s).padStart(2,"0")}`}function pe(n,f){let s=1,r=R(),i=j(),t=null,p=null,g=0,E=null,u=null,m=[];const I=document.createElement("div");I.className="app-view";const A=document.createElement("div");A.className="setup-outer";const L=document.createElement("div");L.className="setup-inner",A.appendChild(L),I.appendChild(A),n.appendChild(I);function M(){L.innerHTML="";const o=document.createElement("div");o.className="setup-logo",o.innerHTML="<h1>VoyceBx</h1><p>Vocal continuity for life's most important moments</p>",L.appendChild(o);const l=document.createElement("div");l.className="progress-dots";for(let v=1;v<=3;v++){const y=document.createElement("div");y.className=`dot${v===s?" active":""}`,l.appendChild(y)}L.appendChild(l);const c=document.createElement("div");c.className="setup-step",L.appendChild(c),s===1?K(c):s===2?O(c):s===3?F(c):s===4&&V(c)}function K(o){o.innerHTML=`
      <div class="step-label">Step 1 of 3</div>
      <div class="step-title">Connect ElevenLabs</div>
      <p class="step-body">
        VoyceBx uses ElevenLabs to generate speech in your cloned voice.
        Enter your API key below — it stays on this device only.
      </p>
      <input
        type="password"
        class="input"
        id="api-key-input"
        placeholder="xi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        value="${H(r)}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="none"
        spellcheck="false"
      />
      <div id="step1-status"></div>
      <button class="btn btn-primary" id="btn-verify">Verify &amp; Continue</button>
      <div class="text-center">
        <a href="https://elevenlabs.io" target="_blank" class="step-link">
          Create an ElevenLabs account →
        </a>
      </div>
    `;const l=o.querySelector("#api-key-input"),c=o.querySelector("#btn-verify"),v=o.querySelector("#step1-status");l.focus(),l.addEventListener("keydown",y=>{y.key==="Enter"&&c.click()}),c.addEventListener("click",async()=>{const y=l.value.trim();if(!y){C(v,"error","Please enter your API key.");return}c.disabled=!0,c.textContent="Verifying…",q(v);try{if(!await le(y))throw new Error('Key not recognized. Check that it starts with "xi-".');r=y,te(y),s=2,M()}catch(x){C(v,"error",x.message),c.disabled=!1,c.textContent="Verify & Continue"}})}function O(o){let l=!1;o.innerHTML=`
      <div class="step-label">Step 2 of 3</div>
      <div class="step-title">Record your voice</div>
      <p class="step-body">
        Find a quiet space. Read the passage below aloud — clearly and naturally.
        Aim for at least <strong>30 seconds</strong>.
      </p>

      <div class="sample-passage">${H(ue)}</div>

      <div class="record-area">
        <button class="record-btn" id="rec-btn" aria-label="Start recording">
          ${Q}
        </button>
        <div class="record-timer" id="rec-timer">0:00</div>
        <p class="record-hint" id="rec-hint">Tap the button to begin</p>
      </div>

      <div id="step2-status"></div>
    `;const c=o.querySelector("#rec-btn"),v=o.querySelector("#rec-timer"),y=o.querySelector("#rec-hint"),x=o.querySelector("#step2-status");c.addEventListener("click",async()=>{if(l)clearInterval(E),u&&u.state!=="inactive"&&u.stop(),l=!1,g<5&&(C(x,"error","Recording was too short. Please record at least 30 seconds for best results."),c.className="record-btn",c.innerHTML=Q,y.textContent="Tap the button to begin",v.textContent="0:00");else{q(x);try{const h=await navigator.mediaDevices.getUserMedia({audio:!0});m=[],u=new MediaRecorder(h),u.ondataavailable=S=>{S.data.size>0&&m.push(S.data)},u.onstop=()=>{h.getTracks().forEach(S=>S.stop()),t=new Blob(m,{type:u.mimeType}),p=URL.createObjectURL(t),clearInterval(E),l=!1,s=3,M()},u.start(100),l=!0,g=0,c.className="record-btn recording",c.innerHTML=ve,y.textContent="Recording… tap to stop",E=setInterval(()=>{g++,v.textContent=G(g)},1e3)}catch{C(x,"error","Microphone access denied. Please allow microphone permission and try again.")}}})}function F(o){o.innerHTML=`
      <div class="step-label">Step 3 of 3</div>
      <div class="step-title">Create your voice clone</div>
      <p class="step-body">
        Listen back to confirm the recording sounds clear, then give your voice a name and create your clone.
      </p>

      <div class="audio-preview">
        <span class="audio-preview-label">Your recording — ${G(g)}</span>
        <button class="btn-icon" id="btn-play-preview" title="Play recording">
          ${fe}
        </button>
      </div>

      <div class="gap-stack">
        <label style="font-size:14px;color:var(--muted)">Name this voice</label>
        <input
          type="text"
          class="input"
          id="voice-name-input"
          placeholder="e.g. My Voice"
          value="${H(i)}"
          maxlength="50"
        />
      </div>

      <div id="step3-status"></div>

      <button class="btn btn-primary" id="btn-clone">Create Voice Clone</button>
      <button class="btn btn-ghost" id="btn-rerecord">Re-record</button>
    `;const l=o.querySelector("#btn-play-preview"),c=o.querySelector("#voice-name-input"),v=o.querySelector("#btn-clone"),y=o.querySelector("#btn-rerecord"),x=o.querySelector("#step3-status");let h=null;l.addEventListener("click",()=>{if(p){if(h){h.pause(),h=null;return}h=new Audio(p),h.onended=()=>{h=null},h.play().catch(()=>{})}}),y.addEventListener("click",()=>{h&&(h.pause(),h=null),t=null,p=null,g=0,s=2,M()}),v.addEventListener("click",async()=>{const S=c.value.trim()||"My Voice";i=S,v.disabled=!0,y.disabled=!0,v.textContent="Creating clone…",q(x);try{const e=await de(r,t,S);ne(e),ie(S),s=4,M()}catch(e){C(x,"error",e.message),v.disabled=!1,y.disabled=!1,v.textContent="Create Voice Clone"}})}function V(o){const l=j();o.innerHTML=`
      <div class="step-label">All set</div>
      <div class="step-title">Your voice is ready</div>
      <p class="step-body">
        <strong>${H(l)}</strong> has been saved. You can now type anything and hear it
        spoken in your voice.
      </p>
      <div class="status status-success">
        Voice clone created successfully. You can re-record anytime from Settings.
      </div>
      <button class="btn btn-primary" id="btn-start">Start Speaking</button>
    `,o.querySelector("#btn-start").addEventListener("click",f)}function C(o,l,c){o.innerHTML=`<div class="status status-${l}">${H(c)}</div>`}function q(o){o.innerHTML=""}M()}const Q=`<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
  <rect x="9" y="2" width="6" height="12" rx="3"/>
  <path d="M5 10a7 7 0 0 0 14 0"/>
  <line x1="12" y1="19" x2="12" y2="22"/>
  <line x1="8" y1="22" x2="16" y2="22"/>
</svg>`,ve=`<svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
  <rect x="4" y="4" width="16" height="16" rx="3"/>
</svg>`,fe=`<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <polygon points="5 3 19 12 5 21 5 3"/>
</svg>`;function P(n){return String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ye(n){return new Date(n).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}function he(){return/Mobi|Android|iPhone|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&window.innerWidth<1024}const U=new Map;let $=null;function D(){return(!$||$.state==="closed")&&($=new(window.AudioContext||window.webkitAudioContext)),$.state==="suspended"&&$.resume(),$}async function X(n){const f=new Blob([n],{type:"audio/mpeg"}),s=URL.createObjectURL(f),r=new Audio(s);r.preload="auto";try{await r.play(),await new Promise((i,t)=>{r.onended=i,r.onerror=t})}finally{URL.revokeObjectURL(s)}}function me(n,f){let s=se(),r=ae(),i=!1;const t=document.createElement("div");t.className="app-view",t.innerHTML=`
    <header class="app-header">
      <span class="app-title">
        VoyceBx
        <span class="voice-label" id="voice-label">${P(j())}</span>
      </span>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="btn-icon" id="btn-clear" title="Clear transcript">${ke}</button>
        <button class="btn-icon" id="btn-settings" title="Settings">${we}</button>
      </div>
    </header>

    <div class="favorites-bar">
      <div class="favorites-scroll" id="fav-scroll"></div>
      <button class="btn-icon" id="btn-edit-favs" title="Edit favorites">${xe}</button>
    </div>

    <div class="speaking-bar hidden" id="speaking-bar">
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
    </div>

    <div class="transcript" id="transcript"></div>

    <div id="error-banner" class="hidden" style="padding:8px 16px;flex-shrink:0">
      <div class="status status-error" id="error-text"></div>
    </div>

    <div class="input-area">
      <textarea
        class="speak-textarea"
        id="speak-input"
        placeholder="Type to speak…"
        rows="1"
        enterkeyhint="send"
      ></textarea>
      <button class="btn-send" id="btn-send" disabled>${ge}</button>
    </div>
  `,n.appendChild(t);const p=t.querySelector("#fav-scroll"),g=t.querySelector("#transcript"),E=t.querySelector("#speaking-bar"),u=t.querySelector("#speak-input"),m=t.querySelector("#btn-send"),I=t.querySelector("#error-banner"),A=t.querySelector("#error-text"),L=t.querySelector("#btn-edit-favs"),M=t.querySelector("#btn-settings"),K=t.querySelector("#btn-clear");V(),C(),M.addEventListener("click",f),K.addEventListener("click",()=>{confirm("Clear all spoken text from the screen?")&&(s=[],ce(),C())}),L.addEventListener("click",()=>S()),u.addEventListener("input",()=>{m.disabled=!u.value.trim()||i,h(u)}),u.addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&!he()&&(e.preventDefault(),m.disabled||O())}),m.addEventListener("click",()=>{D(),O()});async function O(e){const a=(e||u.value).trim();!a||i||(x(),u.value="",h(u),m.disabled=!0,await F(a),m.disabled=!u.value.trim())}async function F(e){const a={id:crypto.randomUUID(),text:e,timestamp:Date.now()};s.push(a),re(s),q(a),c(),i=!0,a.id,v(!0),l(a.id,!0);try{const d=R(),b=Y(),N=await W(d,b,e);U.set(a.id,N.slice(0)),await X(N)}catch(d){y(d.message)}finally{i=!1,v(!1),l(a.id,!1)}}function V(){p.innerHTML="",r.forEach(e=>{const a=document.createElement("button");a.className="chip",a.textContent=e,a.addEventListener("click",()=>{D(),i||O(e)}),p.appendChild(a)})}function C(){if(g.innerHTML="",s.length===0){const e=document.createElement("div");e.className="transcript-empty",e.innerHTML=`
        <div class="transcript-empty-icon">◎</div>
        <div>
          Your voice is ready.<br>
          Type below or tap a phrase above to speak.
        </div>
      `,g.appendChild(e);return}s.forEach(e=>q(e,!1))}function q(e,a=!0){const d=g.querySelector(".transcript-empty");d&&d.remove();const b=document.createElement("div");b.className="transcript-entry",b.dataset.id=e.id,a||(b.style.animation="none"),b.innerHTML=`
      <div class="entry-text">${P(e.text)}</div>
      <div class="entry-actions">
        <div class="entry-time">${P(ye(e.timestamp))}</div>
        <button class="btn-replay" title="Replay" data-id="${P(e.id)}">${be}</button>
      </div>
    `,b.querySelector(".btn-replay").addEventListener("click",async N=>{const k=N.currentTarget.dataset.id;i||(D(),await o(k))}),g.appendChild(b)}async function o(e){const a=s.find(d=>d.id===e);if(a){i=!0,v(!0),l(e,!0);try{let d=U.get(e);d||(d=await W(R(),Y(),a.text),U.set(e,d.slice(0))),await X(d)}catch(d){y(d.message)}finally{i=!1,v(!1),l(e,!1),m.disabled=!u.value.trim()}}}function l(e,a){const d=g.querySelector(`[data-id="${e}"]`);if(!d)return;d.classList.toggle("playing",a);const b=d.querySelector(".btn-replay");b&&b.classList.toggle("playing-now",a)}function c(){requestAnimationFrame(()=>{g.scrollTop=g.scrollHeight})}function v(e){E.classList.toggle("hidden",!e),m.style.background=e?"var(--muted)":""}function y(e){A.textContent=e,I.classList.remove("hidden"),setTimeout(()=>I.classList.add("hidden"),6e3)}function x(){I.classList.add("hidden")}function h(e){e.style.height="auto",e.style.height=Math.min(e.scrollHeight,160)+"px"}function S(){let e=[...r];const a=document.createElement("div");a.className="modal-overlay",a.innerHTML=`
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Edit Favorites</span>
          <button class="btn-icon" id="modal-close">${Se}</button>
        </div>
        <div class="modal-body" id="fav-list"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-add-fav">+ Add phrase</button>
        </div>
      </div>
    `,document.body.appendChild(a);const d=a.querySelector("#fav-list");function b(){d.innerHTML="",e.forEach((k,T)=>{const B=document.createElement("div");B.className="fav-item",B.innerHTML=`
          <input class="fav-input" type="text" value="${P(k)}" maxlength="100" />
          <button class="btn-remove" data-idx="${T}" title="Remove">&times;</button>
        `,B.querySelector(".fav-input").addEventListener("input",Z=>{e[T]=Z.target.value}),B.querySelector(".btn-remove").addEventListener("click",()=>{e.splice(T,1),b()}),d.appendChild(B)})}b(),a.querySelector("#btn-add-fav").addEventListener("click",()=>{var T;e.push(""),b();const k=d.querySelectorAll(".fav-input");(T=k[k.length-1])==null||T.focus()});function N(k){r=e.map(T=>T.trim()).filter(Boolean),oe(r),V(),a.remove()}a.querySelector("#modal-close").addEventListener("click",()=>N()),a.addEventListener("click",k=>{k.target===a&&N()})}}const ge=`<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
  <line x1="12" y1="20" x2="12" y2="4"/>
  <polyline points="5 11 12 4 19 11"/>
</svg>`,be=`<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <polygon points="5 3 19 12 5 21 5 3"/>
</svg>`,we=`<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>`,xe=`<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`,Se=`<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`,ke=`<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6"/>
  <path d="M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`,z=document.getElementById("app");function _(){z.innerHTML="",!(R()&&Y())||location.hash==="#setup"?pe(z,()=>{location.hash="",_()}):me(z,()=>{location.hash="#setup",_()})}window.addEventListener("hashchange",_);_();
