import{d as B,o as i,c as l,a as e,R as S,a4 as g,a5 as x,O as j,b as C,a6 as J,a7 as K,a8 as Z,a9 as Q,aa as U,N as _,ab as re,ac as L,ad as T,ae as h,af as D,ag as ee,ah as E,ai as oe,aj as ie,ak as ne,al as X,k as le,q as se,g as M,t as I,e as R,w as q,u as m,a2 as H,B as G,P as F,l as ae,h as W,G as ce,j as de}from"./index-CGMrCcJI.js";import{a as ue}from"./system-C-aRXlqQ.js";import{f as ge}from"./channels-sLbdGV1h.js";import{f as pe}from"./presets-A-i9uCwC.js";import{f as he,a as fe}from"./logs-BjCUhCjg.js";import"./pagination-DH5ltoJM.js";const ve=["id"],me=["stop-color"],ye=["stop-color"],ke=["viewBox"],xe=["d","stroke-width"],we=["d","stroke-width"],be={success:(i(),C(U)),error:(i(),C(Q)),warning:(i(),C(Z)),info:(i(),C(K))};var $e=B({name:"ProgressCircle",props:{clsPrefix:{type:String,required:!0},status:{type:String,required:!0},strokeWidth:{type:Number,required:!0},fillColor:[String,Object],railColor:String,railStyle:[String,Object],percentage:{type:Number,default:0},offsetDegree:{type:Number,default:0},showIndicator:{type:Boolean,required:!0},indicatorTextColor:String,unit:String,viewBoxWidth:{type:Number,required:!0},gapDegree:{type:Number,required:!0},gapOffsetDegree:{type:Number,default:0}},setup(t,{slots:c}){const n=_(()=>{const s="gradient",{fillColor:a}=t;return typeof a=="object"?`${s}-${re(JSON.stringify(a))}`:s});function w(s,a,d,f){const{gapDegree:v,viewBoxWidth:y,strokeWidth:b}=t,u=50,k=0,r=u,o=0,P=100,z=50+b/2,$=`M ${z},${z} m ${k},${r}
      a ${u},${u} 0 1 1 ${o},-100
      a ${u},${u} 0 1 1 0,${P}`,N=Math.PI*2*u;return{pathString:$,pathStyle:{stroke:f==="rail"?d:typeof t.fillColor=="object"?`url(#${n.value})`:d,strokeDasharray:`${Math.min(s,100)/100*(N-v)}px ${y*8}px`,strokeDashoffset:`-${v/2}px`,transformOrigin:a?"center":void 0,transform:a?`rotate(${a}deg)`:void 0}}}const p=()=>{const s=typeof t.fillColor=="object",a=s?t.fillColor.stops[0]:"",d=s?t.fillColor.stops[1]:"";return s&&(i(),l("defs",null,[e("linearGradient",{id:n.value,x1:"0%",y1:"100%",x2:"100%",y2:"0%"},[e("stop",{offset:"0%","stop-color":a},null,8,me),e("stop",{offset:"100%","stop-color":d},null,8,ye)],8,ve)]))};return()=>{const{fillColor:s,railColor:a,strokeWidth:d,offsetDegree:f,status:v,percentage:y,showIndicator:b,indicatorTextColor:u,unit:k,gapOffsetDegree:r,clsPrefix:o}=t,{pathString:P,pathStyle:z}=w(100,0,a,"rail"),{pathString:$,pathStyle:N}=w(y,f,s,"fill"),O=100+d;return i(),l("div",{class:g(`${o}-progress-content`),role:"none"},[e("div",{class:g(`${o}-progress-graph`),"aria-hidden":!0},[e("div",{class:g(`${o}-progress-graph-circle`),style:S({transform:r?`rotate(${r}deg)`:void 0})},[(i(),l("svg",{viewBox:`0 0 ${O} ${O}`},[x(()=>p()),e("g",null,[e("path",{class:g(`${o}-progress-graph-circle-rail`),d:P,"stroke-width":d,"stroke-linecap":"round",fill:"none",style:S(z)},null,14,xe)]),e("g",null,[e("path",{class:g([`${o}-progress-graph-circle-fill`,y===0&&`${o}-progress-graph-circle-fill--empty`]),d:$,"stroke-width":d,"stroke-linecap":"round",fill:"none",style:S(N)},null,14,we)])],8,ke))],6)],2),b?(i(),l("div",{key:0},[c.default?(i(),l("div",{key:0,class:g(`${o}-progress-custom-content`),role:"none"},[x(()=>c.default())],2)):(i(),l(j,{key:1},[v!=="default"?(i(),l("div",{key:0,class:g(`${o}-progress-icon`),"aria-hidden":!0},[(i(),C(J,{clsPrefix:o},{default:()=>be[v]},1032,["clsPrefix"]))],2)):(i(),l("div",{key:1,class:g(`${o}-progress-text`),style:S({color:u}),role:"none"},[e("span",{class:g(`${o}-progress-text__percentage`)},[x(()=>y)],2),e("span",{class:g(`${o}-progress-text__unit`)},[x(()=>k)],2)],6))],64))])):x(()=>null)],2)}}});const Ce={success:(i(),C(U)),error:(i(),C(Q)),warning:(i(),C(Z)),info:(i(),C(K))};var Se=B({name:"ProgressLine",props:{clsPrefix:{type:String,required:!0},percentage:{type:Number,default:0},railColor:String,railStyle:[String,Object],fillColor:[String,Object],status:{type:String,required:!0},indicatorPlacement:{type:String,required:!0},indicatorTextColor:String,unit:{type:String,default:"%"},processing:{type:Boolean,required:!0},showIndicator:{type:Boolean,required:!0},height:[String,Number],railBorderRadius:[String,Number],fillBorderRadius:[String,Number]},setup(t,{slots:c}){const n=_(()=>L(t.height)),w=_(()=>typeof t.fillColor=="object"?`linear-gradient(to right, ${t.fillColor?.stops[0]} , ${t.fillColor?.stops[1]})`:t.fillColor),p=_(()=>t.railBorderRadius!==void 0?L(t.railBorderRadius):t.height!==void 0?L(t.height,{c:.5}):""),s=_(()=>t.fillBorderRadius!==void 0?L(t.fillBorderRadius):t.railBorderRadius!==void 0?L(t.railBorderRadius):t.height!==void 0?L(t.height,{c:.5}):"");return()=>{const{indicatorPlacement:a,railColor:d,railStyle:f,percentage:v,unit:y,indicatorTextColor:b,status:u,showIndicator:k,processing:r,clsPrefix:o}=t;return i(),l("div",{class:g(`${o}-progress-content`),role:"none"},[e("div",{class:g(`${o}-progress-graph`),"aria-hidden":!0},[e("div",{class:g([`${o}-progress-graph-line`,{[`${o}-progress-graph-line--indicator-${a}`]:!0}])},[e("div",{class:g(`${o}-progress-graph-line-rail`),style:S([{backgroundColor:d,height:n.value,borderRadius:p.value},f])},[e("div",{class:g([`${o}-progress-graph-line-fill`,r&&`${o}-progress-graph-line-fill--processing`]),style:S({maxWidth:`${t.percentage}%`,background:w.value,height:n.value,lineHeight:n.value,borderRadius:s.value})},[a==="inside"?(i(),l("div",{key:0,class:g(`${o}-progress-graph-line-indicator`),style:S({color:b})},[c.default?(i(),l(j,{key:0},[x(()=>c.default())],64)):(i(),l(j,{key:1},[x(()=>`${v}${y}`)],64))],6)):x(()=>null)],6)],6)],2)],2),k&&a==="outside"?(i(),l("div",{key:0},[c.default?(i(),l("div",{key:0,class:g(`${o}-progress-custom-content`),style:S({color:b}),role:"none"},[x(()=>c.default())],6)):(i(),l(j,{key:1},[u==="default"?(i(),l("div",{key:0,role:"none",class:g(`${o}-progress-icon ${o}-progress-icon--as-text`),style:S({color:b})},[x(()=>v),x(()=>y)],6)):(i(),l("div",{key:1,class:g(`${o}-progress-icon`),"aria-hidden":!0},[(i(),C(J,{clsPrefix:o},{default:()=>Ce[u]},1032,["clsPrefix"]))],2))],64))])):x(()=>null)],2)}}});const _e=["id"],Pe=["stop-color"],ze=["stop-color"],Be=["d","stroke-width"],Ne=["d","stroke-width"],Re=["viewBox"];function Y(t,c,n=100){return`m ${n/2} ${n/2-t} a ${t} ${t} 0 1 1 0 ${2*t} a ${t} ${t} 0 1 1 0 -${2*t}`}var Oe=B({name:"ProgressMultipleCircle",props:{clsPrefix:{type:String,required:!0},viewBoxWidth:{type:Number,required:!0},percentage:{type:Array,default:[0]},strokeWidth:{type:Number,required:!0},circleGap:{type:Number,required:!0},showIndicator:{type:Boolean,required:!0},fillColor:{type:Array,default:()=>[]},railColor:{type:Array,default:()=>[]},railStyle:{type:Array,default:()=>[]}},setup(t,{slots:c}){const n=_(()=>t.percentage.map((p,s)=>`${Math.PI*p/100*(t.viewBoxWidth/2-t.strokeWidth/2*(1+2*s)-t.circleGap*s)*2}, ${t.viewBoxWidth*8}`)),w=(p,s)=>{const a=t.fillColor[s],d=typeof a=="object"?a.stops[0]:"",f=typeof a=="object"?a.stops[1]:"";return typeof t.fillColor[s]=="object"&&(i(),l("linearGradient",{id:`gradient-${s}`,x1:"100%",y1:"0%",x2:"0%",y2:"100%"},[e("stop",{offset:"0%","stop-color":d},null,8,Pe),e("stop",{offset:"100%","stop-color":f},null,8,ze)],8,_e))};return()=>{const{viewBoxWidth:p,strokeWidth:s,circleGap:a,showIndicator:d,fillColor:f,railColor:v,railStyle:y,percentage:b,clsPrefix:u}=t;return i(),l("div",{class:g(`${u}-progress-content`),role:"none"},[e("div",{class:g(`${u}-progress-graph`),"aria-hidden":!0},[e("div",{class:g(`${u}-progress-graph-circle`)},[(i(),l("svg",{viewBox:`0 0 ${p} ${p}`},[e("defs",null,[x(()=>b.map((k,r)=>w(k,r)))]),x(()=>b.map((k,r)=>(i(),l("g",{key:r},[e("path",{class:g(`${u}-progress-graph-circle-rail`),d:Y(p/2-s/2*(1+2*r)-a*r,s,p),"stroke-width":s,"stroke-linecap":"round",fill:"none",style:S([{strokeDashoffset:0,stroke:v[r]},y[r]])},null,14,Be),e("path",{class:g([`${u}-progress-graph-circle-fill`,k===0&&`${u}-progress-graph-circle-fill--empty`]),d:Y(p/2-s/2*(1+2*r)-a*r,s,p),"stroke-width":s,"stroke-linecap":"round",fill:"none",style:S({strokeDasharray:n.value[r],strokeDashoffset:0,stroke:typeof f[r]=="object"?`url(#gradient-${r})`:f[r]})},null,14,Ne)]))))],8,Re))],2)],2),d&&c.default?(i(),l("div",{key:0},[e("div",{class:g(`${u}-progress-text`)},[x(()=>c.default())],2)])):x(()=>null)],2)}}}),De=T([h("progress",{display:"inline-block"},[h("progress-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 `),D("line",`
 width: 100%;
 display: block;
 `,[h("progress-content",`
 display: flex;
 align-items: center;
 `,[h("progress-graph",{flex:1})]),h("progress-custom-content",{marginLeft:"14px"}),h("progress-icon",`
 width: 30px;
 padding-left: 14px;
 height: var(--n-icon-size-line);
 line-height: var(--n-icon-size-line);
 font-size: var(--n-icon-size-line);
 `,[D("as-text",`
 color: var(--n-text-color-line-outer);
 text-align: center;
 width: 40px;
 font-size: var(--n-font-size);
 padding-left: 4px;
 transition: color .3s var(--n-bezier);
 `)])]),D("circle, dashboard",{width:"120px"},[h("progress-custom-content",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `),h("progress-text",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: inherit;
 font-size: var(--n-font-size-circle);
 color: var(--n-text-color-circle);
 font-weight: var(--n-font-weight-circle);
 transition: color .3s var(--n-bezier);
 white-space: nowrap;
 `),h("progress-icon",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: var(--n-icon-color);
 font-size: var(--n-icon-size-circle);
 `)]),D("multiple-circle",`
 width: 200px;
 color: inherit;
 `,[h("progress-text",`
 font-weight: var(--n-font-weight-circle);
 color: var(--n-text-color-circle);
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 transition: color .3s var(--n-bezier);
 `)]),h("progress-content",{position:"relative"}),h("progress-graph",{position:"relative"},[h("progress-graph-circle",[T("svg",{verticalAlign:"bottom"}),h("progress-graph-circle-fill",`
 stroke: var(--n-fill-color);
 transition:
 opacity .3s var(--n-bezier),
 stroke .3s var(--n-bezier),
 stroke-dasharray .3s var(--n-bezier);
 `,[D("empty",{opacity:0})]),h("progress-graph-circle-rail",`
 transition: stroke .3s var(--n-bezier);
 overflow: hidden;
 stroke: var(--n-rail-color);
 `)]),h("progress-graph-line",[D("indicator-inside",[h("progress-graph-line-rail",`
 height: 16px;
 line-height: 16px;
 border-radius: 10px;
 `,[h("progress-graph-line-fill",`
 height: inherit;
 border-radius: 10px;
 `),h("progress-graph-line-indicator",`
 background: #0000;
 white-space: nowrap;
 text-align: right;
 margin-left: 14px;
 margin-right: 14px;
 height: inherit;
 font-size: 12px;
 color: var(--n-text-color-line-inner);
 transition: color .3s var(--n-bezier);
 `)])]),D("indicator-inside-label",`
 height: 16px;
 display: flex;
 align-items: center;
 `,[h("progress-graph-line-rail",`
 flex: 1;
 transition: background-color .3s var(--n-bezier);
 `),h("progress-graph-line-indicator",`
 background: var(--n-fill-color);
 font-size: 12px;
 transform: translateZ(0);
 display: flex;
 vertical-align: middle;
 height: 16px;
 line-height: 16px;
 padding: 0 10px;
 border-radius: 10px;
 position: absolute;
 white-space: nowrap;
 color: var(--n-text-color-line-inner);
 transition:
 right .2s var(--n-bezier),
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),h("progress-graph-line-rail",`
 position: relative;
 overflow: hidden;
 height: var(--n-rail-height);
 border-radius: 5px;
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 `,[h("progress-graph-line-fill",`
 background: var(--n-fill-color);
 position: relative;
 border-radius: 5px;
 height: inherit;
 width: 100%;
 max-width: 0%;
 transition:
 background-color .3s var(--n-bezier),
 max-width .2s var(--n-bezier);
 `,[D("processing",[T("&::after",`
 content: "";
 background-image: var(--n-line-bg-processing);
 animation: progress-processing-animation 2s var(--n-bezier) infinite;
 `)])])])])])]),T("@keyframes progress-processing-animation",`
 0% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 100%;
 opacity: 1;
 }
 66% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 100% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 `)]);const Ie=["aria-valuenow","role"],je={...ee.props,processing:Boolean,type:{type:String,default:"line"},gapDegree:Number,gapOffsetDegree:Number,status:{type:String,default:"default"},railColor:[String,Array],railStyle:[String,Array],color:[String,Array,Object],viewBoxWidth:{type:Number,default:100},strokeWidth:{type:Number,default:7},percentage:[Number,Array],unit:{type:String,default:"%"},showIndicator:{type:Boolean,default:!0},indicatorPosition:{type:String,default:"outside"},indicatorPlacement:{type:String,default:"outside"},indicatorTextColor:String,circleGap:{type:Number,default:1},height:Number,borderRadius:[String,Number],fillBorderRadius:[String,Number],offsetDegree:Number};var We=B({name:"Progress",props:je,setup(t){const c=_(()=>t.indicatorPlacement||t.indicatorPosition),n=_(()=>{if(t.gapDegree||t.gapDegree===0)return t.gapDegree;if(t.type==="dashboard")return 75}),{mergedClsPrefixRef:w,inlineThemeDisabled:p}=oe(t),s=ee("Progress","-progress",De,ie,t,w),a=_(()=>{const{status:f}=t,{common:{cubicBezierEaseInOut:v},self:{fontSize:y,fontSizeCircle:b,railColor:u,railHeight:k,iconSizeCircle:r,iconSizeLine:o,textColorCircle:P,textColorLineInner:z,textColorLineOuter:$,lineBgProcessing:N,fontWeightCircle:O,[X("iconColor",f)]:V,[X("fillColor",f)]:A}}=s.value;return{"--n-bezier":v,"--n-fill-color":A,"--n-font-size":y,"--n-font-size-circle":b,"--n-font-weight-circle":O,"--n-icon-color":V,"--n-icon-size-circle":r,"--n-icon-size-line":o,"--n-line-bg-processing":N,"--n-rail-color":u,"--n-rail-height":k,"--n-text-color-circle":P,"--n-text-color-line-inner":z,"--n-text-color-line-outer":$}}),d=p?ne("progress",_(()=>t.status[0]),a,t):void 0;return{mergedClsPrefix:w,mergedIndicatorPlacement:c,gapDeg:n,cssVars:p?void 0:a,themeClass:d?.themeClass,onRender:d?.onRender}},render(){const{type:t,cssVars:c,indicatorTextColor:n,showIndicator:w,status:p,railColor:s,railStyle:a,color:d,percentage:f,viewBoxWidth:v,strokeWidth:y,mergedIndicatorPlacement:b,unit:u,borderRadius:k,fillBorderRadius:r,height:o,processing:P,circleGap:z,mergedClsPrefix:$,gapDeg:N,gapOffsetDegree:O,themeClass:V,$slots:A,onRender:te}=this;return te?.(),i(),l("div",{class:g([V,`${$}-progress`,`${$}-progress--${t}`,`${$}-progress--${p}`]),style:S(c),"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":f,role:t==="circle"||t==="line"||t==="dashboard"?"progressbar":"none"},[t==="circle"||t==="dashboard"?(i(),C($e,{key:0,clsPrefix:$,status:p,showIndicator:w,indicatorTextColor:n,railColor:s,fillColor:d,railStyle:a,offsetDegree:this.offsetDegree,percentage:f,viewBoxWidth:v,strokeWidth:y,gapDegree:N===void 0?t==="dashboard"?75:0:N,gapOffsetDegree:O,unit:u},E(A),1032,["clsPrefix","status","showIndicator","indicatorTextColor","railColor","fillColor","railStyle","offsetDegree","percentage","viewBoxWidth","strokeWidth","gapDegree","gapOffsetDegree","unit"])):(i(),l(j,{key:1},[t==="line"?(i(),C(Se,{key:0,clsPrefix:$,status:p,showIndicator:w,indicatorTextColor:n,railColor:s,fillColor:d,railStyle:a,percentage:f,processing:P,indicatorPlacement:b,unit:u,fillBorderRadius:r,railBorderRadius:k,height:o},E(A),1032,["clsPrefix","status","showIndicator","indicatorTextColor","railColor","fillColor","railStyle","percentage","processing","indicatorPlacement","unit","fillBorderRadius","railBorderRadius","height"])):(i(),l(j,{key:1},[t==="multiple-circle"?(i(),C(Oe,{key:0,clsPrefix:$,strokeWidth:y,railColor:s,fillColor:d,railStyle:a,viewBoxWidth:v,percentage:f,showIndicator:w,circleGap:z},E(A),1032,["clsPrefix","strokeWidth","railColor","fillColor","railStyle","viewBoxWidth","percentage","showIndicator","circleGap"])):x(()=>null)],64))],64))],14,Ie)}});const Le={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Me=B({name:"AddOutline",render:function(c,n){return i(),l("svg",Le,n[0]||(n[0]=[e("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32",d:"M256 112v288"},null,-1),e("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32",d:"M400 256H112"},null,-1)]))}}),qe={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Ae=B({name:"ChatbubblesOutline",render:function(c,n){return i(),l("svg",qe,n[0]||(n[0]=[e("path",{d:"M431 320.6c-1-3.6 1.2-8.6 3.3-12.2a33.68 33.68 0 0 1 2.1-3.1A162 162 0 0 0 464 215c.3-92.2-77.5-167-173.7-167c-83.9 0-153.9 57.1-170.3 132.9a160.7 160.7 0 0 0-3.7 34.2c0 92.3 74.8 169.1 171 169.1c15.3 0 35.9-4.6 47.2-7.7s22.5-7.2 25.4-8.3a26.44 26.44 0 0 1 9.3-1.7a26 26 0 0 1 10.1 2l56.7 20.1a13.52 13.52 0 0 0 3.9 1a8 8 0 0 0 8-8a12.85 12.85 0 0 0-.5-2.7z",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32"},null,-1),e("path",{d:"M66.46 232a146.23 146.23 0 0 0 6.39 152.67c2.31 3.49 3.61 6.19 3.21 8s-11.93 61.87-11.93 61.87a8 8 0 0 0 2.71 7.68A8.17 8.17 0 0 0 72 464a7.26 7.26 0 0 0 2.91-.6l56.21-22a15.7 15.7 0 0 1 12 .2c18.94 7.38 39.88 12 60.83 12A159.21 159.21 0 0 0 284 432.11",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32"},null,-1)]))}}),Te={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Ge=B({name:"FlashOutline",render:function(c,n){return i(),l("svg",Te,n[0]||(n[0]=[e("path",{d:"M315.27 33L96 304h128l-31.51 173.23a2.36 2.36 0 0 0 2.33 2.77h0a2.36 2.36 0 0 0 1.89-.95L416 208H288l31.66-173.25a2.45 2.45 0 0 0-2.44-2.75h0a2.42 2.42 0 0 0-1.95 1z",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1)]))}}),Ve={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Ee=B({name:"PulseOutline",render:function(c,n){return i(),l("svg",Ve,n[0]||(n[0]=[e("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32",d:"M48 320h64l64-256l64 384l64-224l32 96h64"},null,-1),e("circle",{cx:"432",cy:"320",r:"32",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1)]))}}),He={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Xe=B({name:"ServerOutline",render:function(c,n){return i(),l("svg",He,n[0]||(n[0]=[e("ellipse",{cx:"256",cy:"128",rx:"192",ry:"80",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32"},null,-1),e("path",{d:"M448 214c0 44.18-86 80-192 80S64 258.18 64 214",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32"},null,-1),e("path",{d:"M448 300c0 44.18-86 80-192 80S64 344.18 64 300",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32"},null,-1),e("path",{d:"M64 127.24v257.52C64 428.52 150 464 256 464s192-35.48 192-79.24V127.24",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32"},null,-1)]))}}),Fe={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Ye=B({name:"StatsChartOutline",render:function(c,n){return i(),l("svg",Fe,n[0]||(n[0]=[e("rect",{x:"64",y:"320",width:"48",height:"160",rx:"8",ry:"8",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1),e("rect",{x:"288",y:"224",width:"48",height:"256",rx:"8",ry:"8",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1),e("rect",{x:"400",y:"112",width:"48",height:"368",rx:"8",ry:"8",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1),e("rect",{x:"176",y:"32",width:"48",height:"448",rx:"8",ry:"8",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1)]))}}),Je={class:"chaite-page cockpit"},Ke={class:"hero chaite-panel","data-tour":"dashboard"},Ze={class:"eyebrow"},Qe={class:"hero-actions"},Ue={class:"health-ring"},et={class:"metric-grid"},tt=["onClick"],rt={class:"chaite-metric-label"},ot={class:"main-grid"},it={class:"chaite-panel activity"},nt={class:"section-title"},lt={key:0,class:"empty"},st={class:"activity-icon"},at={class:"activity-copy"},ct={class:"chaite-panel quick"},dt=B({__name:"index",setup(t){const c=le(),n=W(!0),w=W(),p=W(0),s=W(0),a=W(0),d=W(),f=W([]),v=_(()=>p.value?Math.round(s.value/p.value*100):0),y=_(()=>[{label:"渠道",value:p.value,hint:`${s.value} 个正在服务`,icon:Xe,route:"/channels"},{label:"预设",value:a.value,hint:"角色与群聊配置",icon:Ae,route:"/chat-preset"},{label:"24h 调用",value:d.value?.byType?.["llm.call"]??0,hint:`${(d.value?.totalTokens??0).toLocaleString()} tokens`,icon:Ge,route:"/logs"},{label:"平均延迟",value:`${d.value?.avgLlmDurationMs??0}ms`,hint:`错误率 ${((d.value?.errorRate??0)*100).toFixed(1)}%`,icon:Ee,route:"/logs"}]);async function b(){n.value=!0;try{const[k,r,o,P,z]=await Promise.all([ue(),ge(),pe(),he(),fe({pageSize:8})]);k.isSuccess&&(w.value=k.data);const $=r;p.value=$.length,s.value=$.filter(O=>O.status==="enabled").length;const N=o;a.value=N.length,P.code===0&&(d.value=P.data),z.code===0&&(f.value=z.data.items)}finally{n.value=!1}}se(b);function u(){window.dispatchEvent(new Event("chaite:start-tour"))}return(k,r)=>(i(),l("div",Je,[e("section",Ke,[e("div",null,[e("div",Ze,[r[7]||(r[7]=e("span",{class:"live-dot"},null,-1)),M(" CHAITE CONSOLE · "+I(w.value?.version||"LOCAL"),1)]),r[11]||(r[11]=e("h1",null,"群聊 AI，一切就绪。",-1)),r[12]||(r[12]=e("p",null,"从这里掌握渠道健康、模型用量与最近异常，快速进入最常用的配置。",-1)),e("div",Qe,[R(m(G),{type:"primary",size:"large",onClick:r[0]||(r[0]=o=>m(c).push("/quick-setup"))},{icon:q(()=>[R(m(H),{component:m(Me)},null,8,["component"])]),default:q(()=>[r[8]||(r[8]=M("快速接入模型",-1))]),_:1}),R(m(G),{size:"large",secondary:"",onClick:r[1]||(r[1]=o=>m(c).push("/chat-preset"))},{default:q(()=>[...r[9]||(r[9]=[M("创建预设",-1)])]),_:1}),R(m(G),{text:"",onClick:u},{default:q(()=>[...r[10]||(r[10]=[M("查看新手引导",-1)])]),_:1})])]),e("div",Ue,[R(m(We),{type:"circle",percentage:v.value,"stroke-width":7,status:v.value>70?"success":v.value?"warning":"error"},null,8,["percentage","status"]),r[13]||(r[13]=e("span",null,"渠道可用率",-1))])]),e("section",et,[(i(!0),l(j,null,F(y.value,o=>(i(),l("button",{key:o.label,class:"metric chaite-panel",onClick:P=>m(c).push(o.route)},[R(m(H),{component:o.icon,size:"24",class:"metric-icon"},null,8,["component"]),e("div",rt,I(o.label),1),e("strong",null,I(o.value),1),e("small",null,I(o.hint),1)],8,tt))),128))]),e("section",ot,[e("div",it,[e("div",nt,[r[15]||(r[15]=e("div",null,[e("h2",null,"最近活动"),e("p",null,"模型、工具和群聊能力的真实调用记录")],-1)),R(m(G),{text:"",type:"primary",onClick:r[2]||(r[2]=o=>m(c).push("/logs"))},{default:q(()=>[...r[14]||(r[14]=[M("查看全部",-1)])]),_:1})]),f.value.length?ae("",!0):(i(),l("div",lt,"还没有使用记录。完成一次对话后，这里会出现详细数据。")),(i(!0),l(j,null,F(f.value,o=>(i(),l("div",{key:o.id,class:"activity-row"},[e("div",st,[R(m(H),{component:m(Ye)},null,8,["component"])]),e("div",at,[e("strong",null,I(o.summary),1),e("span",null,I(o.channelName||o.model||o.presetName||"系统")+" · "+I(new Date(o.timestamp).toLocaleString()),1)]),R(m(ce),{size:"small",type:o.level==="error"?"error":"default",bordered:!1},{default:q(()=>[M(I(o.level==="error"?"异常":`${o.durationMs??0} ms`),1)]),_:2},1032,["type"])]))),128))]),e("aside",ct,[r[20]||(r[20]=e("div",{class:"section-title"},[e("div",null,[e("h2",null,"快速管理"),e("p",null,"高频入口")])],-1)),e("button",{onClick:r[3]||(r[3]=o=>m(c).push("/channels"))},[...r[16]||(r[16]=[e("b",null,"渠道池",-1),e("span",null,"测试、启停与调整优先级",-1)])]),e("button",{onClick:r[4]||(r[4]=o=>m(c).push("/chat-preset"))},[...r[17]||(r[17]=[e("b",null,"预设库",-1),e("span",null,"搜索、复制和维护角色",-1)])]),e("button",{onClick:r[5]||(r[5]=o=>m(c).push("/tools"))},[...r[18]||(r[18]=[e("b",null,"工具与分组",-1),e("span",null,"组织模型可调用的能力",-1)])]),e("button",{onClick:r[6]||(r[6]=o=>m(c).push("/config"))},[...r[19]||(r[19]=[e("b",null,"系统配置",-1),e("span",null,"对话、视觉、记忆与服务",-1)])])])])]))}}),mt=de(dt,[["__scopeId","data-v-062ae1ed"]]);export{mt as default};
