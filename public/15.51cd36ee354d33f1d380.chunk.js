(this.webpackJsonp=this.webpackJsonp||[]).push([[15,19],{101:function(t,e,i){"use strict";i.d(e,"a",(function(){return s}));var n=i(51);class s{constructor(t,e){this.passwordInputField=t,this.size=e,this.needFrame=0,this.container=document.createElement("div"),this.container.classList.add("media-sticker-wrapper")}load(){return this.loadPromise?this.loadPromise:this.loadPromise=n.a.loadAnimationAsAsset({container:this.container,loop:!1,autoplay:!1,width:this.size,height:this.size,noCache:!0},"TwoFactorSetupMonkeyPeek").then(t=>(this.animation=t,this.animation.addEventListener("enterFrame",t=>{(1===this.animation.direction&&t>=this.needFrame||-1===this.animation.direction&&t<=this.needFrame)&&(this.animation.setSpeed(1),this.animation.pause())}),this.passwordInputField.onVisibilityClickAdditional=()=>{this.passwordInputField.passwordVisible?(this.animation.setDirection(1),this.animation.curFrame=0,this.needFrame=16,this.animation.play()):(this.animation.setDirection(-1),this.animation.curFrame=16,this.needFrame=0,this.animation.play())},n.a.waitForFirstFrame(t)))}remove(){this.animation&&this.animation.remove()}}},21:function(t,e,i){"use strict";i.r(e);var n=i(35),s=i(37),a=i(17),r=i(79),o=i(64),l=i(34),c=i(95),u=i(101),d=i(31),h=i(16),p=i(91),m=i(5),g=i(30),b=i(96),f=i(36),v=i(58);let w;const y=new o.a("page-password",!0,()=>{const t=new p.a({className:"page-password",withInputWrapper:!0,titleLangKey:"Login.Password.Title",subtitleLangKey:"Login.Password.Subtitle"}),e=Object(l.a)("btn-primary btn-color-primary"),a=new h.default.IntlElement({key:"Login.Next"});e.append(a.element);const o=new c.a({label:"LoginPassword",name:"password"});let y;w=o.input,t.inputWrapper.append(o.container,e);let L,E=()=>(y||(y=window.setInterval(E,1e4)),r.a.getState().then(t=>{L=t,L.hint?Object(f.a)(o.label,Object(b.a)(d.b.wrapEmojiText(L.hint))):o.setLabel()}));const k=t=>{if(t&&Object(m.a)(t),!w.value.length)return void w.classList.add("error");const s=Object(v.a)([w,e],!0);let l=w.value;a.update({key:"PleaseWait"});const c=Object(n.f)(e);o.setValueSilently(""+Math.random()),o.setValueSilently(l),r.a.check(l,L).then(t=>{switch(t._){case"auth.authorization":clearInterval(y),i.e(4).then(i.bind(null,19)).then(t=>{t.default.mount()}),T&&T.remove();break;default:e.removeAttribute("disabled"),a.update({key:t._}),c.remove()}}).catch(t=>{s(),o.input.classList.add("error"),t.type,a.update({key:"PASSWORD_HASH_INVALID"}),w.select(),c.remove(),E()})};Object(g.b)(e,k),w.addEventListener("keypress",(function(t){if(this.classList.remove("error"),a.update({key:"Login.Next"}),"Enter"===t.key)return k()}));const N=s.b.isMobile?100:166,T=new u.a(o,N);return t.imageDiv.append(T.container),Promise.all([T.load(),E()])},null,()=>{w.focus(),a.default.pushToState("authState",{_:"authStatePassword"})});e.default=y},36:function(t,e,i){"use strict";function n(t,e){if("string"==typeof e)return void(t.innerHTML=e);const i=t.firstChild;i?t.lastChild===i?i.replaceWith(e):(t.textContent="",t.append(e)):t.append(e)}i.d(e,"a",(function(){return n}))},38:function(t,e,i){"use strict";i.d(e,"a",(function(){return d}));var n=i(52),s=i(85),a=i(69),r=i(90);var o=i(16),l=i(31),c=i(57);let u=()=>{document.addEventListener("paste",t=>{if(!Object(s.a)(t.target,'contenteditable="true"'))return;t.preventDefault();let e=(t.originalEvent||t).clipboardData.getData("text/plain"),i=l.b.parseEntities(e);i=i.filter(t=>"messageEntityEmoji"===t._||"messageEntityLinebreak"===t._),e=l.b.wrapRichText(e,{entities:i,noLinks:!0,wrappingDraft:!0}),window.document.execCommand("insertHTML",!1,e)}),u=null};var d;!function(t){t[t.Neutral=0]="Neutral",t[t.Valid=1]="Valid",t[t.Error=2]="Error"}(d||(d={}));e.b=class{constructor(t={}){this.options=t,this.container=document.createElement("div"),this.container.classList.add("input-field"),this.required=t.required,this.validate=t.validate,void 0!==t.maxLength&&void 0===t.showLengthOn&&(t.showLengthOn=Math.min(40,Math.round(t.maxLength/3)));const{placeholder:e,maxLength:i,showLengthOn:n,name:s,plainText:l}=t;let c,d,h=t.label||t.labelText;if(l)this.container.innerHTML=`\n      <input type="text" ${s?`name="${s}"`:""} autocomplete="off" ${h?'required=""':""} class="input-field-input">\n      `,c=this.container.firstElementChild;else{u&&u(),this.container.innerHTML='\n      <div contenteditable="true" class="input-field-input"></div>\n      ',c=this.container.firstElementChild;const e=new MutationObserver(()=>{d&&d()});c.addEventListener("input",()=>{Object(r.a)(c)&&(c.innerHTML=""),this.inputFake&&(this.inputFake.innerHTML=c.innerHTML,this.onFakeInput())}),e.observe(c,{characterData:!0,childList:!0,subtree:!0}),t.animate&&(c.classList.add("scrollable","scrollable-y"),this.inputFake=document.createElement("div"),this.inputFake.setAttribute("contenteditable","true"),this.inputFake.className=c.className+" input-field-input-fake")}if(c.setAttribute("dir","auto"),e&&(Object(o._i18n)(c,e,void 0,"placeholder"),this.inputFake&&Object(o._i18n)(this.inputFake,e,void 0,"placeholder")),h||e){const t=document.createElement("div");t.classList.add("input-field-border"),this.container.append(t)}if(h&&(this.label=document.createElement("label"),this.setLabel(),this.container.append(this.label)),i){const t=this.container.lastElementChild;let e=!1;d=()=>{const s=c.classList.contains("error"),r=l?c.value.length:[...Object(a.a)(c,!1).value].length,o=i-r,u=o<0;c.classList.toggle("error",u),u||o<=n?(this.setLabel(),t.append(` (${i-r})`),e||(e=!0)):(s&&!u||e)&&(this.setLabel(),e=!1)},c.addEventListener("input",d)}this.input=c}select(){this.value&&(this.options.plainText?this.input.select():function(t){const e=document.createRange();e.selectNodeContents(t);const i=window.getSelection();i.removeAllRanges(),i.addRange(e)}(this.input))}setLabel(){this.label.textContent="",this.options.labelText?this.label.innerHTML=this.options.labelText:this.label.append(Object(o.i18n)(this.options.label,this.options.labelOptions))}onFakeInput(t=!0){const{scrollHeight:e}=this.inputFake,i=+this.input.style.height.replace("px","");if(i===e)return;const n=Math.round(50*Math.log(Math.abs(e-i)));this.input.style.transitionDuration=n+"ms",t&&(this.input.style.height=e?e+"px":"");Object(c.a)(this.input,"is-changing-height",!0,n,()=>{this.input.classList.remove("is-changing-height")})}get value(){return this.options.plainText?this.input.value:Object(a.a)(this.input,!1).value}set value(t){this.setValueSilently(t,!1),Object(n.a)(this.input,"input")}setValueSilently(t,e=!0){this.options.plainText?this.input.value=t:(this.input.innerHTML=t,this.inputFake&&(this.inputFake.innerHTML=t,e&&this.onFakeInput()))}isChanged(){return this.value!==this.originalValue}isValid(){return!this.input.classList.contains("error")&&(!this.validate||this.validate())&&(!this.required||!Object(r.a)(this.input))}isValidToChange(){return this.isValid()&&this.isChanged()}setDraftValue(t="",e=!1){this.options.plainText||(t=l.b.wrapDraftText(t)),e?this.setValueSilently(t,!1):this.value=t}setOriginalValue(t="",e=!1){this.originalValue=t,this.setDraftValue(t,e)}setState(t,e){e&&(this.label.textContent="",this.label.append(Object(o.i18n)(e,this.options.labelOptions))),this.input.classList.toggle("error",!!(t&d.Error)),this.input.classList.toggle("valid",!!(t&d.Valid))}setError(t){this.setState(d.Error,t)}}},57:function(t,e,i){"use strict";var n=i(15);const s=(t,e,i,a,r,o)=>{const{timeout:l,raf:c}=t.dataset;if(void 0!==l&&clearTimeout(+l),void 0!==c&&(window.cancelAnimationFrame(+c),o||delete t.dataset.raf),o&&n.default.settings.animationsEnabled&&a)return void(t.dataset.raf=""+window.requestAnimationFrame(()=>{delete t.dataset.raf,s(t,e,i,a,r,o-1)}));i&&e&&t.classList.add(e);const u=()=>{delete t.dataset.timeout,!i&&e&&t.classList.remove("backwards",e),t.classList.remove("animating"),r&&r()};if(!n.default.settings.animationsEnabled||!a)return t.classList.remove("animating","backwards"),void u();t.classList.add("animating"),t.classList.toggle("backwards",!i),t.dataset.timeout=""+setTimeout(u,a)};e.a=s},58:function(t,e,i){"use strict";function n(t,e){return e?t.forEach(t=>t.setAttribute("disabled","true")):t.forEach(t=>t.removeAttribute("disabled")),()=>n(t,!e)}i.d(e,"a",(function(){return n}))},69:function(t,e,i){"use strict";i.d(e,"a",(function(){return r}));var n=i(29),s=i(31),a=i(86);function r(t,e=!0){const i=[],n=[],r=e?[]:void 0;Object(a.a)(t,i,n,void 0,void 0,r),n.length&&i.push(n.join(""));let o=i.join("\n");return o=o.replace(/\u00A0/g," "),r&&s.b.combineSameEntities(r),{value:o,entities:r}}n.a.getRichValue=r},79:function(t,e,i){"use strict";var n=i(29),s=i(33);const a=new class{getState(){return s.a.invokeApi("account.getPassword").then(t=>t)}updateSettings(t={}){return this.getState().then(e=>{let i,n;const a={password:null,new_settings:{_:"account.passwordInputSettings",hint:t.hint,email:t.email}};i=t.currentPassword?s.a.invokeCrypto("computeSRP",t.currentPassword,e,!1):Promise.resolve({_:"inputCheckPasswordEmpty"});const r=e.new_algo,o=new Uint8Array(r.salt1.length+32);return o.randomize(),o.set(r.salt1,0),r.salt1=o,n=t.newPassword?s.a.invokeCrypto("computeSRP",t.newPassword,e,!0):Promise.resolve(new Uint8Array),Promise.all([i,n]).then(t=>(a.password=t[0],a.new_settings.new_algo=r,a.new_settings.new_password_hash=t[1],s.a.invokeApi("account.updatePasswordSettings",a)))})}check(t,e,i={}){return s.a.invokeCrypto("computeSRP",t,e,!1).then(t=>s.a.invokeApi("auth.checkPassword",{password:t},i).then(t=>("auth.authorization"===t._&&s.a.setUser(t.user),t)))}confirmPasswordEmail(t){return s.a.invokeApi("account.confirmPasswordEmail",{code:t})}resendPasswordEmail(){return s.a.invokeApi("account.resendPasswordEmail")}cancelPasswordEmail(){return s.a.invokeApi("account.cancelPasswordEmail")}};n.a.passwordManager=a,e.a=a},85:function(t,e,i){"use strict";function n(t,e){return t.closest(`[${e}]`)}i.d(e,"a",(function(){return n}))},86:function(t,e,i){"use strict";i.d(e,"b",(function(){return n})),i.d(e,"a",(function(){return s}));const n={bold:{match:'[style*="font-weight"], b',entityName:"messageEntityBold"},underline:{match:'[style*="underline"], u',entityName:"messageEntityUnderline"},italic:{match:'[style*="italic"], i',entityName:"messageEntityItalic"},monospace:{match:'[style*="monospace"], [face="monospace"], pre',entityName:"messageEntityPre"},strikethrough:{match:'[style*="line-through"], strike',entityName:"messageEntityStrike"},link:{match:"A:not(.follow)",entityName:"messageEntityTextUrl"},mentionName:{match:"A.follow",entityName:"messageEntityMentionName"}};function s(t,e,i,a,r,o,l={offset:0}){if(3===t.nodeType){const e=t.nodeValue;if(a===t?i.push(e.substr(0,r)+""+e.substr(r)):i.push(e),o&&e.trim()&&t.parentNode){const i=t.parentElement;for(const t in n){const s=n[t],a=i.closest(s.match+", [contenteditable]");a&&null===a.getAttribute("contenteditable")&&("messageEntityTextUrl"===s.entityName?o.push({_:s.entityName,url:i.href,offset:l.offset,length:e.length}):"messageEntityMentionName"===s.entityName?o.push({_:s.entityName,offset:l.offset,length:e.length,user_id:i.dataset.follow.toUserId()}):o.push({_:s.entityName,offset:l.offset,length:e.length}))}}return void(l.offset+=e.length)}if(1!==t.nodeType)return;const c=a===t,u="DIV"===t.tagName||"P"===t.tagName;if(u&&i.length||"BR"===t.tagName)e.push(i.join("")),i.splice(0,i.length);else if(t instanceof HTMLImageElement){const e=t.alt;e&&(i.push(e),l.offset+=e.length)}c&&!r&&i.push("");let d=t.firstChild;for(;d;)s(d,e,i,a,r,o,l),d=d.nextSibling;c&&r&&i.push(""),u&&i.length&&(e.push(i.join("")),i.splice(0,i.length))}},90:function(t,e,i){"use strict";i.d(e,"a",(function(){return s}));var n=i(69);function s(t){return t.hasAttribute("contenteditable")||"INPUT"!==t.tagName?!Object(n.a)(t,!1).value.trim():!t.value.trim()}},91:function(t,e,i){"use strict";i.d(e,"a",(function(){return s}));var n=i(16);class s{constructor(t){this.element=document.body.querySelector("."+t.className),this.container=document.createElement("div"),this.container.className="container center-align",this.imageDiv=document.createElement("div"),this.imageDiv.className="auth-image",this.title=document.createElement("h4"),t.titleLangKey&&this.title.append(Object(n.i18n)(t.titleLangKey)),this.subtitle=document.createElement("p"),this.subtitle.className="subtitle",t.subtitleLangKey&&this.subtitle.append(Object(n.i18n)(t.subtitleLangKey)),this.container.append(this.imageDiv,this.title,this.subtitle),t.withInputWrapper&&(this.inputWrapper=document.createElement("div"),this.inputWrapper.className="input-wrapper",this.container.append(this.inputWrapper)),this.element.append(this.container)}}},95:function(t,e,i){"use strict";i.d(e,"a",(function(){return a}));var n=i(5),s=i(38);class a extends s.b{constructor(t={}){super(Object.assign({plainText:!0},t)),this.passwordVisible=!1,this.onVisibilityClick=t=>{Object(n.a)(t),this.passwordVisible=!this.passwordVisible,this.toggleVisible.classList.toggle("eye-hidden",this.passwordVisible),this.input.type=this.passwordVisible?"text":"password",this.onVisibilityClickAdditional&&this.onVisibilityClickAdditional()};const e=this.input;e.type="password",e.setAttribute("required",""),e.name="notsearch_password",e.autocomplete="off";const i=document.createElement("input");i.classList.add("stealthy"),i.tabIndex=-1,i.type="password",e.parentElement.prepend(i),e.parentElement.insertBefore(i.cloneNode(),e.nextSibling);const s=this.toggleVisible=document.createElement("span");s.classList.add("toggle-visible","tgico"),this.container.classList.add("input-field-password"),this.container.append(s),s.addEventListener("click",this.onVisibilityClick),s.addEventListener("touchend",this.onVisibilityClick)}}},96:function(t,e,i){"use strict";function n(t){const e=document.createElement("span");return e.innerHTML=t,e}i.d(e,"a",(function(){return n}))}}]);
//# sourceMappingURL=15.51cd36ee354d33f1d380.chunk.js.map