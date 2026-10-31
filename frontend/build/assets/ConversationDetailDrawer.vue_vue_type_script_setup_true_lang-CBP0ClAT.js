import{bQ as q,ac as y,ad as o,cd as Q,ae as z,d as T,cA as U,af as _,o as c,c as h,a4 as f,a3 as a,a as x,R as b,b as $,bZ as X,e as k,T as Y,ah as V,cB as Z,aj as D,N as S,b7 as G,bN as J,ak as C,bi as ee,h as te,bq as ie,cC as ne,aH as p,aW as oe,aB as re,b2 as I,b5 as N,aF as se,aC as ae,ab as le,w,u as v,bk as ce,V as me,O as de,P as ue,W as pe,l as fe,bj as he}from"./index-C1d8iO7w.js";import ge from"./MessageContentCard-CGz64HZV.js";let W=!1;function ve(){if(q&&window.CSS&&!W&&(W=!0,"registerProperty"in window?.CSS))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}var ye=y([y("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),o("spin-container",`
 position: relative;
 `,[o("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[Q()])]),o("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),o("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[z("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),o("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),o("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[z("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]);const ze={small:20,medium:18,large:16},xe={..._.props,contentClass:String,contentStyle:[Object,String],description:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number,...U,strokeWidth:Number};var be=T({name:"Spin",props:xe,slots:Object,setup(e){const{mergedClsPrefixRef:t,inlineThemeDisabled:r}=V(e),s=_("Spin","-spin",ye,Z,e,t),i=S(()=>{const{size:n}=e,{common:{cubicBezierEaseInOut:d},self:g}=s.value,{opacitySpinning:B,color:P,textColor:R}=g;return{"--n-bezier":d,"--n-opacity-spinning":B,"--n-size":typeof n=="number"?J(n):g[C("size",n)],"--n-color":P,"--n-text-color":R}}),l=r?D("spin",S(()=>{const{size:n}=e;return typeof n=="number"?String(n):n[0]}),i,e):void 0,m=ee(e,["spinning","show"]),u=te(!1);return G(n=>{let d;if(m.value){const{delay:g}=e;if(g){d=window.setTimeout(()=>{u.value=!0},g),n(()=>{clearTimeout(d)});return}}u.value=m.value}),{mergedClsPrefix:t,active:u,mergedStrokeWidth:S(()=>{const{strokeWidth:n}=e;if(n!==void 0)return n;const{size:d}=e;return ze[typeof d=="number"?"medium":d]}),cssVars:r?void 0:i,themeClass:l?.themeClass,onRender:l?.onRender}},render(){const{$slots:e,mergedClsPrefix:t,description:r}=this,s=e.icon&&this.rotate,i=(r||e.description)&&(c(),h("div",{class:a(`${t}-spin-description`)},[f(()=>r||e.description?.())],2)),l=e.icon?(c(),h("div",{key:1,class:a([`${t}-spin-body`,this.themeClass])},[x("div",{class:a([`${t}-spin`,s&&`${t}-spin--rotate`]),style:b(e.default?"":this.cssVars)},[f(()=>e.icon())],6),f(()=>i)],2)):(c(),h("div",{key:2,class:a([`${t}-spin-body`,this.themeClass])},[(c(),$(X,{clsPrefix:t,style:b(e.default?"":this.cssVars),stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,radius:this.radius,scale:this.scale,class:a(`${t}-spin`)},null,8,["clsPrefix","style","stroke","stroke-width","radius","scale","class"])),f(()=>i)],2));return this.onRender?.(),e.default?(c(),h("div",{key:3,class:a([`${t}-spin-container`,this.themeClass]),style:b(this.cssVars)},[x("div",{class:a([`${t}-spin-content`,this.active&&`${t}-spin-content--spinning`,this.contentClass]),style:b(this.contentStyle)},[f(()=>e.default?.())],6),k(Y,{name:"fade-in-transition"},{default:()=>this.active?l:null},1024)],6)):l}});function Ce(e){const{textColor3:t,infoColor:r,errorColor:s,successColor:i,warningColor:l,textColor1:m,textColor2:u,railColor:n,fontWeightStrong:d,fontSize:g}=e;return{...ne,contentFontSize:g,titleFontWeight:d,circleBorder:`2px solid ${t}`,circleBorderInfo:`2px solid ${r}`,circleBorderError:`2px solid ${s}`,circleBorderSuccess:`2px solid ${i}`,circleBorderWarning:`2px solid ${l}`,iconColor:t,iconColorInfo:r,iconColorError:s,iconColorSuccess:i,iconColorWarning:l,titleTextColor:m,contentTextColor:u,metaTextColor:t,lineColor:n}}const Se={common:ie,self:Ce},j=1.25;var we=o("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${j};
`,[z("horizontal",`
 flex-direction: row;
 `,[y(">",[o("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[z("dashed-line-type",[y(">",[o("timeline-item-timeline",[p("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),y(">",[o("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[y(">",[p("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),o("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[p("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),z("right-placement",[o("timeline-item",[o("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),o("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),z("left-placement",[o("timeline-item",[o("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),o("timeline-item-timeline",`
 left: 0;
 `)])]),o("timeline-item",`
 position: relative;
 `,[y("&:last-child",[o("timeline-item-timeline",[p("line",`
 display: none;
 `)]),o("timeline-item-content",[p("meta",`
 margin-bottom: 0;
 `)])]),o("timeline-item-content",[p("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),p("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),p("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),z("dashed-line-type",[o("timeline-item-timeline",[p("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),o("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${j} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[p("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),p("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),p("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]);const $e={..._.props,horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number},E=re("n-timeline");var ke=T({name:"Timeline",props:$e,setup(e,{slots:t}){const{mergedClsPrefixRef:r}=V(e),s=_("Timeline","-timeline",we,Se,e,r);return oe(E,{props:e,mergedThemeRef:s,mergedClsPrefixRef:r}),()=>{const{value:i}=r;return c(),h("div",{class:a([`${i}-timeline`,e.horizontal&&`${i}-timeline--horizontal`,`${i}-timeline--${e.size}-size`,!e.horizontal&&`${i}-timeline--${e.itemPlacement}-placement`])},[f(()=>t.default?.())],2)}}});const Te={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}};var _e=T({name:"TimelineItem",props:Te,slots:Object,setup(e){const t=se(E);t||ae("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),ve();const{inlineThemeDisabled:r}=V(),s=S(()=>{const{props:{size:l,iconSize:m},mergedThemeRef:u}=t,{type:n}=e,{self:{titleTextColor:d,contentTextColor:g,metaTextColor:B,lineColor:P,titleFontWeight:R,contentFontSize:F,[C("iconSize",l)]:H,[C("titleMargin",l)]:O,[C("titleFontSize",l)]:L,[C("circleBorder",n)]:A,[C("iconColor",n)]:K},common:{cubicBezierEaseInOut:M}}=u.value;return{"--n-bezier":M,"--n-circle-border":A,"--n-icon-color":K,"--n-content-font-size":F,"--n-content-text-color":g,"--n-line-color":P,"--n-meta-text-color":B,"--n-title-font-size":L,"--n-title-font-weight":R,"--n-title-margin":O,"--n-title-text-color":d,"--n-icon-size":le(m)||H}}),i=r?D("timeline-item",S(()=>{const{props:{size:l,iconSize:m}}=t,{type:u}=e;return`${l[0]}${m||"a"}${u[0]}`}),s,t.props):void 0;return{mergedClsPrefix:t.mergedClsPrefixRef,cssVars:r?void 0:s,themeClass:i?.themeClass,onRender:i?.onRender}},render(){const{mergedClsPrefix:e,color:t,onRender:r,$slots:s}=this;return r?.(),c(),h("div",{class:a([`${e}-timeline-item`,this.themeClass,`${e}-timeline-item--${this.type}-type`,`${e}-timeline-item--${this.lineType}-line-type`]),style:b(this.cssVars)},[x("div",{class:a(`${e}-timeline-item-timeline`)},[x("div",{class:a(`${e}-timeline-item-timeline__line`)},null,2),f(()=>I(s.icon,i=>i?(c(),h("div",{key:1,class:a(`${e}-timeline-item-timeline__icon`),style:b({color:t})},[f(()=>i)],6)):(c(),h("div",{key:2,class:a(`${e}-timeline-item-timeline__circle`),style:b({borderColor:t})},null,6))))],2),x("div",{class:a(`${e}-timeline-item-content`)},[f(()=>I(s.header,i=>i||this.title?(c(),h("div",{key:3,class:a(`${e}-timeline-item-content__title`)},[f(()=>i||this.title)],2)):null)),x("div",{class:a(`${e}-timeline-item-content__content`)},[f(()=>N(s.default,()=>[this.content]))],2),x("div",{class:a(`${e}-timeline-item-content__meta`)},[f(()=>N(s.footer,()=>[this.time]))],2)],2)],6)}});const Be={key:0,class:"flex justify-center items-center py-8"},Ve=T({__name:"ConversationDetailDrawer",props:{show:{type:Boolean},conversation:{},history:{},loading:{type:Boolean}},emits:["update:show"],setup(e,{emit:t}){const r=e,s=t;function i(m){s("update:show",m)}const l=S(()=>[...r.history].sort((m,u)=>new Date(m.createdAt||"").getTime()-new Date(u.createdAt||"").getTime()));return(m,u)=>(c(),$(v(he),{show:r.show,width:800,"onUpdate:show":i},{default:w(()=>[k(v(ce),{title:e.conversation?`对话详情: ${e.conversation.name}`:"对话详情",closable:""},{default:w(()=>[k(v(be),{show:e.loading},{default:w(()=>[!e.conversation||e.history.length===0?(c(),h("div",Be,[k(v(me),{description:"无对话记录"})])):(c(),$(v(ke),{key:1},{default:w(()=>[(c(!0),h(de,null,ue(l.value,(n,d)=>(c(),$(v(_e),{key:n.id,type:n.role==="user"?"info":"success",title:n.role==="user"?"用户":"AI",time:n.createdAt},{default:w(()=>[k(ge,{message:n},null,8,["message"]),d<e.history.length-1?(c(),$(v(pe),{key:0})):fe("",!0)]),_:2},1032,["type","title","time"]))),128))]),_:1}))]),_:1},8,["show"])]),_:1},8,["title"])]),_:1},8,["show"]))}});export{be as S,Ve as _};
