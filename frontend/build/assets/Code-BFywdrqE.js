import{aF as q,b$ as F,N as h,bq as I,ac as f,ad as V,ae as x,aH as K,d as O,af as R,o as _,c as y,a3 as z,a4 as $,R as D,ah as U,q as Y,K as g,aY as N,aj as A,h as G}from"./index-9sTjWrks.js";function J(n,e){const s=q(F,null);return h(()=>n.hljs||s?.mergedHljsRef.value)}function Q(n){const{textColor2:e,fontSize:s,fontWeightStrong:i,textColor3:u}=n;return{textColor:e,fontSize:s,fontWeightStrong:i,"mono-3":"#a0a1a7","hue-1":"#0184bb","hue-2":"#4078f2","hue-3":"#a626a4","hue-4":"#50a14f","hue-5":"#e45649","hue-5-2":"#c91243","hue-6":"#986801","hue-6-2":"#c18401",lineNumberTextColor:u}}const X={common:I,self:Q};var Z=f([V("code",`
 font-size: var(--n-font-size);
 font-family: var(--n-font-family);
 `,[x("show-line-numbers",`
 display: flex;
 `),K("line-numbers",`
 user-select: none;
 padding-right: 12px;
 text-align: right;
 transition: color .3s var(--n-bezier);
 color: var(--n-line-number-text-color);
 `),x("word-wrap",[f("pre",`
 white-space: pre-wrap;
 word-break: break-all;
 `)]),f("pre",`
 margin: 0;
 line-height: inherit;
 font-size: inherit;
 font-family: inherit;
 `),f("[class^=hljs]",`
 color: var(--n-text-color);
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),({props:n})=>{const e=`${n.bPrefix}code`;return[`${e} .hljs-comment,
 ${e} .hljs-quote {
 color: var(--n-mono-3);
 font-style: italic;
 }`,`${e} .hljs-doctag,
 ${e} .hljs-keyword,
 ${e} .hljs-formula {
 color: var(--n-hue-3);
 }`,`${e} .hljs-section,
 ${e} .hljs-name,
 ${e} .hljs-selector-tag,
 ${e} .hljs-deletion,
 ${e} .hljs-subst {
 color: var(--n-hue-5);
 }`,`${e} .hljs-literal {
 color: var(--n-hue-1);
 }`,`${e} .hljs-string,
 ${e} .hljs-regexp,
 ${e} .hljs-addition,
 ${e} .hljs-attribute,
 ${e} .hljs-meta-string {
 color: var(--n-hue-4);
 }`,`${e} .hljs-built_in,
 ${e} .hljs-class .hljs-title {
 color: var(--n-hue-6-2);
 }`,`${e} .hljs-attr,
 ${e} .hljs-variable,
 ${e} .hljs-template-variable,
 ${e} .hljs-type,
 ${e} .hljs-selector-class,
 ${e} .hljs-selector-attr,
 ${e} .hljs-selector-pseudo,
 ${e} .hljs-number {
 color: var(--n-hue-6);
 }`,`${e} .hljs-symbol,
 ${e} .hljs-bullet,
 ${e} .hljs-link,
 ${e} .hljs-meta,
 ${e} .hljs-selector-id,
 ${e} .hljs-title {
 color: var(--n-hue-2);
 }`,`${e} .hljs-emphasis {
 font-style: italic;
 }`,`${e} .hljs-strong {
 font-weight: var(--n-font-weight-strong);
 }`,`${e} .hljs-link {
 text-decoration: underline;
 }`]}]);const ee={...R.props,language:String,code:{type:String,default:""},trim:{type:Boolean,default:!0},hljs:Object,uri:Boolean,inline:Boolean,wordWrap:Boolean,showLineNumbers:Boolean,internalFontSize:Number,internalNoHighlight:Boolean};var te=O({name:"Code",props:ee,setup(n,{slots:e}){const{internalNoHighlight:s}=n,{mergedClsPrefixRef:i,inlineThemeDisabled:u}=U(),j=G(null),b=s?{value:void 0}:J(n),S=(t,l,o)=>{const{value:r}=b;return!r||!(t&&r.getLanguage(t))?null:r.highlight(o?l.trim():l,{language:t}).value},H=h(()=>n.inline||n.wordWrap?!1:n.showLineNumbers),d=()=>{if(e.default)return;const{value:t}=j;if(!t)return;const{language:l}=n,o=n.uri?window.decodeURIComponent(n.code):n.code;if(l){const a=S(l,o,n.trim);if(a!==null){if(n.inline)t.innerHTML=a;else{const m=t.querySelector(".__code__");m&&t.removeChild(m);const c=document.createElement("pre");c.className="__code__",c.innerHTML=a,t.appendChild(c)}return}}if(n.inline){t.textContent=o;return}const r=t.querySelector(".__code__");if(r)r.textContent=o;else{const a=document.createElement("pre");a.className="__code__",a.textContent=o,t.innerHTML="",t.appendChild(a)}};Y(d),g(N(n,"language"),d),g(N(n,"code"),d),s||g(b,d);const L=R("Code","-code",Z,X,n,i),v=h(()=>{const{common:{cubicBezierEaseInOut:t,fontFamilyMono:l},self:{textColor:o,fontSize:r,fontWeightStrong:a,lineNumberTextColor:m,"mono-3":c,"hue-1":p,"hue-2":B,"hue-3":k,"hue-4":E,"hue-5":P,"hue-5-2":T,"hue-6":M,"hue-6-2":W}}=L.value,{internalFontSize:w}=n;return{"--n-font-size":w?`${w}px`:r,"--n-font-family":l,"--n-font-weight-strong":a,"--n-bezier":t,"--n-text-color":o,"--n-mono-3":c,"--n-hue-1":p,"--n-hue-2":B,"--n-hue-3":k,"--n-hue-4":E,"--n-hue-5":P,"--n-hue-5-2":T,"--n-hue-6":M,"--n-hue-6-2":W,"--n-line-number-text-color":m}}),C=u?A("code",h(()=>`${n.internalFontSize||"a"}`),v,n):void 0;return{mergedClsPrefix:i,codeRef:j,mergedShowLineNumbers:H,lineNumbers:h(()=>{let t=1;const l=[];let o=!1;for(const r of n.code)r===`
`?(o=!0,l.push(t++)):o=!1;return o||l.push(t++),l.join(`
`)}),cssVars:u?void 0:v,themeClass:C?.themeClass,onRender:C?.onRender}},render(){const{mergedClsPrefix:n,wordWrap:e,mergedShowLineNumbers:s,onRender:i}=this;return i?.(),_(),y("code",{class:z([`${n}-code`,this.themeClass,e&&`${n}-code--word-wrap`,s&&`${n}-code--show-line-numbers`]),style:D(this.cssVars),ref:"codeRef"},[s?(_(),y("pre",{key:0,class:z(`${n}-code__line-numbers`)},[$(()=>this.lineNumbers)],2)):$(()=>null),$(()=>this.$slots.default?.())],6)}});export{te as C};
