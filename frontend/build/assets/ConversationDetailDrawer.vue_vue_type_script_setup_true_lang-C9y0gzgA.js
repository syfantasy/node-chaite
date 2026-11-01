import{bQ as O,bq as q,cC as Q,ae as i,af as v,ad as z,aH as l,d as k,ag as V,ai as I,aW as U,o as a,c as p,a5 as h,a4 as d,aB as G,a as x,b2 as T,R as $,b5 as B,aF as J,aC as X,ak as Y,N as _,al as y,ac as Z,b,w as C,e as w,u as f,bk as ee,V as te,O as ie,P as ne,W as oe,l as re,bj as le}from"./index-zHM7VAxf.js";import{S as ae}from"./Spin-3EQ615sg.js";import se from"./MessageContentCard-_kiVVmdd.js";let P=!1;function ce(){if(O&&window.CSS&&!P&&(P=!0,"registerProperty"in window?.CSS))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function me(e){const{textColor3:n,infoColor:o,errorColor:r,successColor:t,warningColor:s,textColor1:c,textColor2:u,railColor:m,fontWeightStrong:g,fontSize:S}=e;return{...Q,contentFontSize:S,titleFontWeight:g,circleBorder:`2px solid ${n}`,circleBorderInfo:`2px solid ${o}`,circleBorderError:`2px solid ${r}`,circleBorderSuccess:`2px solid ${t}`,circleBorderWarning:`2px solid ${s}`,iconColor:n,iconColorInfo:o,iconColorError:r,iconColorSuccess:t,iconColorWarning:s,titleTextColor:c,contentTextColor:u,metaTextColor:n,lineColor:m}}const de={common:q,self:me},R=1.25;var ue=i("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${R};
`,[v("horizontal",`
 flex-direction: row;
 `,[z(">",[i("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[v("dashed-line-type",[z(">",[i("timeline-item-timeline",[l("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),z(">",[i("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[z(">",[l("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),i("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[l("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),v("right-placement",[i("timeline-item",[i("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),i("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),v("left-placement",[i("timeline-item",[i("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),i("timeline-item-timeline",`
 left: 0;
 `)])]),i("timeline-item",`
 position: relative;
 `,[z("&:last-child",[i("timeline-item-timeline",[l("line",`
 display: none;
 `)]),i("timeline-item-content",[l("meta",`
 margin-bottom: 0;
 `)])]),i("timeline-item-content",[l("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),l("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),l("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),v("dashed-line-type",[i("timeline-item-timeline",[l("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),i("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${R} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[l("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),l("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),l("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]);const fe={...V.props,horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number},D=G("n-timeline");var he=k({name:"Timeline",props:fe,setup(e,{slots:n}){const{mergedClsPrefixRef:o}=I(e),r=V("Timeline","-timeline",ue,de,e,o);return U(D,{props:e,mergedThemeRef:r,mergedClsPrefixRef:o}),()=>{const{value:t}=o;return a(),p("div",{class:d([`${t}-timeline`,e.horizontal&&`${t}-timeline--horizontal`,`${t}-timeline--${e.size}-size`,!e.horizontal&&`${t}-timeline--${e.itemPlacement}-placement`])},[h(()=>n.default?.())],2)}}});const pe={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}};var ge=k({name:"TimelineItem",props:pe,slots:Object,setup(e){const n=J(D);n||X("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),ce();const{inlineThemeDisabled:o}=I(),r=_(()=>{const{props:{size:s,iconSize:c},mergedThemeRef:u}=n,{type:m}=e,{self:{titleTextColor:g,contentTextColor:S,metaTextColor:F,lineColor:N,titleFontWeight:W,contentFontSize:j,[y("iconSize",s)]:E,[y("titleMargin",s)]:H,[y("titleFontSize",s)]:A,[y("circleBorder",m)]:M,[y("iconColor",m)]:K},common:{cubicBezierEaseInOut:L}}=u.value;return{"--n-bezier":L,"--n-circle-border":M,"--n-icon-color":K,"--n-content-font-size":j,"--n-content-text-color":S,"--n-line-color":N,"--n-meta-text-color":F,"--n-title-font-size":A,"--n-title-font-weight":W,"--n-title-margin":H,"--n-title-text-color":g,"--n-icon-size":Z(c)||E}}),t=o?Y("timeline-item",_(()=>{const{props:{size:s,iconSize:c}}=n,{type:u}=e;return`${s[0]}${c||"a"}${u[0]}`}),r,n.props):void 0;return{mergedClsPrefix:n.mergedClsPrefixRef,cssVars:o?void 0:r,themeClass:t?.themeClass,onRender:t?.onRender}},render(){const{mergedClsPrefix:e,color:n,onRender:o,$slots:r}=this;return o?.(),a(),p("div",{class:d([`${e}-timeline-item`,this.themeClass,`${e}-timeline-item--${this.type}-type`,`${e}-timeline-item--${this.lineType}-line-type`]),style:$(this.cssVars)},[x("div",{class:d(`${e}-timeline-item-timeline`)},[x("div",{class:d(`${e}-timeline-item-timeline__line`)},null,2),h(()=>T(r.icon,t=>t?(a(),p("div",{key:1,class:d(`${e}-timeline-item-timeline__icon`),style:$({color:n})},[h(()=>t)],6)):(a(),p("div",{key:2,class:d(`${e}-timeline-item-timeline__circle`),style:$({borderColor:n})},null,6))))],2),x("div",{class:d(`${e}-timeline-item-content`)},[h(()=>T(r.header,t=>t||this.title?(a(),p("div",{key:3,class:d(`${e}-timeline-item-content__title`)},[h(()=>t||this.title)],2)):null)),x("div",{class:d(`${e}-timeline-item-content__content`)},[h(()=>B(r.default,()=>[this.content]))],2),x("div",{class:d(`${e}-timeline-item-content__meta`)},[h(()=>B(r.footer,()=>[this.time]))],2)],2)],6)}});const ve={key:0,class:"flex justify-center items-center py-8"},Ce=k({__name:"ConversationDetailDrawer",props:{show:{type:Boolean},conversation:{},history:{},loading:{type:Boolean}},emits:["update:show"],setup(e,{emit:n}){const o=e,r=n;function t(c){r("update:show",c)}const s=_(()=>[...o.history].sort((c,u)=>new Date(c.createdAt||"").getTime()-new Date(u.createdAt||"").getTime()));return(c,u)=>(a(),b(f(le),{show:o.show,width:800,"onUpdate:show":t},{default:C(()=>[w(f(ee),{title:e.conversation?`对话详情: ${e.conversation.name}`:"对话详情",closable:""},{default:C(()=>[w(f(ae),{show:e.loading},{default:C(()=>[!e.conversation||e.history.length===0?(a(),p("div",ve,[w(f(te),{description:"无对话记录"})])):(a(),b(f(he),{key:1},{default:C(()=>[(a(!0),p(ie,null,ne(s.value,(m,g)=>(a(),b(f(ge),{key:m.id,type:m.role==="user"?"info":"success",title:m.role==="user"?"用户":"AI",time:m.createdAt},{default:C(()=>[w(se,{message:m},null,8,["message"]),g<e.history.length-1?(a(),b(f(oe),{key:0})):re("",!0)]),_:2},1032,["type","title","time"]))),128))]),_:1}))]),_:1},8,["show"])]),_:1},8,["title"])]),_:1},8,["show"]))}});export{Ce as _};
