import{d as E,aA as $e,a as k,bl as Ue,bo as De,cw as Me,bp as Ee,cx as Ne,bD as He,bq as qe,cy as je,cr as We,aB as Je,ad as R,ae as j,aH as y,ac as le,aI as Ke,o as t,c as x,b as v,a5 as Xe,I as Z,a3 as m,aF as K,aQ as Ye,a4 as C,O as A,B as ee,cz as Ge,ct as Qe,bB as Ze,V as et,b1 as tt,aD as te,ah as ce,h as M,N as g,aU as rt,aY as J,af as ue,R as lt,aR as at,aW as ot,ak as H,aX as it,bW as st,aZ as G,K as ae,w as U,e as B,u as D,g as oe,t as nt,M as dt,l as ct}from"./index-cuzpzUx6.js";import{F as ut,a as Q}from"./FormItem-vmo9ceeC.js";import{C as ft}from"./CheckboxGroup-C7Ok04_L.js";var ht=E({name:"Search",render(){return(()=>{const e=$e("5f7b1a43863de7ad");return e[0]||(e[0]=k("svg",{version:"1.1",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",style:"enable-background: new 0 0 512 512"},[k("path",{d:`M443.5,420.2L336.7,312.4c20.9-26.2,33.5-59.4,33.5-95.5c0-84.5-68.5-153-153.1-153S64,132.5,64,217s68.5,153,153.1,153
  c36.6,0,70.1-12.8,96.5-34.2l106.1,107.1c3.2,3.4,7.6,5.1,11.9,5.1c4.1,0,8.2-1.5,11.3-4.5C449.5,437.2,449.7,426.8,443.5,420.2z
   M217.1,337.1c-32.1,0-62.3-12.5-85-35.2c-22.7-22.7-35.2-52.9-35.2-84.9c0-32.1,12.5-62.3,35.2-84.9c22.7-22.7,52.9-35.2,85-35.2
  c32.1,0,62.3,12.5,85,35.2c22.7,22.7,35.2,52.9,35.2,84.9c0,32.1-12.5,62.3-35.2,84.9C279.4,324.6,249.2,337.1,217.1,337.1z`})],-1))})()}});function mt(e){const{fontWeight:o,fontSizeLarge:l,fontSizeMedium:i,fontSizeSmall:c,heightLarge:a,heightMedium:f,borderRadius:s,cardColor:b,tableHeaderColor:u,textColor1:n,textColorDisabled:h,textColor2:F,textColor3:P,borderColor:S,hoverColor:_,closeColorHover:T,closeColorPressed:w,closeIconColor:I,closeIconColorHover:O,closeIconColorPressed:r}=e;return{...je,itemHeightSmall:f,itemHeightMedium:f,itemHeightLarge:a,fontSizeSmall:c,fontSizeMedium:i,fontSizeLarge:l,borderRadius:s,dividerColor:S,borderColor:S,listColor:b,headerColor:We(b,u),titleTextColor:n,titleTextColorDisabled:h,extraTextColor:P,extraTextColorDisabled:h,itemTextColor:F,itemTextColorDisabled:h,itemColorPending:_,titleFontWeight:o,closeColorHover:T,closeColorPressed:w,closeIconColor:I,closeIconColorHover:O,closeIconColorPressed:r}}const vt=Ue({name:"Transfer",common:qe,peers:{Checkbox:He,Scrollbar:Ne,Input:Ee,Empty:Me,Button:De},self:mt}),W=Je("n-transfer");var bt=R("transfer",`
 width: 100%;
 font-size: var(--n-font-size);
 height: 300px;
 display: flex;
 flex-wrap: nowrap;
 word-break: break-word;
`,[j("disabled",[R("transfer-list",[R("transfer-list-header",[y("title",`
 color: var(--n-header-text-color-disabled);
 `),y("extra",`
 color: var(--n-header-extra-text-color-disabled);
 `)])])]),R("transfer-list",`
 flex: 1;
 min-width: 0;
 height: inherit;
 display: flex;
 flex-direction: column;
 background-clip: padding-box;
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-list-color);
 `,[j("source",`
 border-top-left-radius: var(--n-border-radius);
 border-bottom-left-radius: var(--n-border-radius);
 `,[y("border","border-right: 1px solid var(--n-divider-color);")]),j("target",`
 border-top-right-radius: var(--n-border-radius);
 border-bottom-right-radius: var(--n-border-radius);
 `,[y("border","border-left: none;")]),y("border",`
 padding: 0 12px;
 border: 1px solid var(--n-border-color);
 transition: border-color .3s var(--n-bezier);
 pointer-events: none;
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `),R("transfer-list-header",`
 min-height: var(--n-header-height);
 box-sizing: border-box;
 display: flex;
 padding: 12px 12px 10px 12px;
 align-items: center;
 background-clip: padding-box;
 border-radius: inherit;
 border-bottom-left-radius: 0;
 border-bottom-right-radius: 0;
 line-height: 1.5;
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `,[le("> *:not(:first-child)",`
 margin-left: 8px;
 `),y("title",`
 flex: 1;
 min-width: 0;
 line-height: 1.5;
 font-size: var(--n-header-font-size);
 font-weight: var(--n-header-font-weight);
 transition: color .3s var(--n-bezier);
 color: var(--n-header-text-color);
 `),y("button",`
 position: relative;
 `),y("extra",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-extra-font-size);
 margin-right: 0;
 white-space: nowrap;
 color: var(--n-header-extra-text-color);
 `)]),R("transfer-list-body",`
 flex-basis: 0;
 flex-grow: 1;
 box-sizing: border-box;
 position: relative;
 display: flex;
 flex-direction: column;
 border-radius: inherit;
 border-top-left-radius: 0;
 border-top-right-radius: 0;
 `,[R("transfer-filter",`
 padding: 4px 12px 8px 12px;
 box-sizing: border-box;
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),R("transfer-list-flex-container",`
 flex: 1;
 position: relative;
 `,[R("scrollbar",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 height: unset;
 `),R("empty",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateY(-50%) translateX(-50%);
 `),R("transfer-list-content",`
 padding: 0;
 margin: 0;
 position: relative;
 `,[R("transfer-list-item",`
 padding: 0 12px;
 min-height: var(--n-item-height);
 display: flex;
 align-items: center;
 color: var(--n-item-text-color);
 position: relative;
 transition: color .3s var(--n-bezier);
 `,[y("background",`
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),y("checkbox",`
 position: relative;
 margin-right: 8px;
 `),y("close",`
 opacity: 0;
 pointer-events: none;
 position: relative;
 transition:
 opacity .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),y("label",`
 position: relative;
 min-width: 0;
 flex-grow: 1;
 `),j("source","cursor: pointer;"),j("disabled",`
 cursor: not-allowed;
 color: var(--n-item-text-color-disabled);
 `),Ke("disabled",[le("&:hover",[y("background","background-color: var(--n-item-color-pending);"),y("close",`
 opacity: 1;
 pointer-events: all;
 `)])])])])])])])]),ie=E({name:"TransferFilter",props:{value:String,placeholder:String,disabled:Boolean,onUpdateValue:{type:Function,required:!0}},setup(){const{mergedThemeRef:e,mergedClsPrefixRef:o}=K(W);return{mergedClsPrefix:o,mergedTheme:e}},render(){const{mergedTheme:e,mergedClsPrefix:o}=this;return t(),x("div",{class:m(`${o}-transfer-filter`)},[(t(),v(Z,{value:this.value,onUpdateValue:this.onUpdateValue,disabled:this.disabled,placeholder:this.placeholder,theme:e.peers.Input,themeOverrides:e.peerOverrides.Input,clearable:!0,size:"small"},{"clear-icon-placeholder":()=>(t(),v(Xe,{clsPrefix:o},{default:()=>(t(),v(ht))},1032,["clsPrefix"]))},1032,["value","onUpdateValue","disabled","placeholder","theme","themeOverrides"]))],2)}}),se=E({name:"TransferHeader",props:{size:{type:String,required:!0},selectAllText:String,clearText:String,source:Boolean,onCheckedAll:Function,onClearAll:Function,title:[String,Function]},setup(e){const{targetOptionsRef:o,canNotSelectAnythingRef:l,canBeClearedRef:i,allCheckedRef:c,mergedThemeRef:a,disabledRef:f,mergedClsPrefixRef:s,srcOptionsLengthRef:b}=K(W),{localeRef:u}=Ye("Transfer");return()=>{const{source:n,onClearAll:h,onCheckedAll:F,selectAllText:P,clearText:S}=e,{value:_}=a,{value:T}=s,{value:w}=u,I=e.size==="large"?"small":"tiny",{title:O}=e;return t(),x("div",{class:m(`${T}-transfer-list-header`)},[C(()=>O&&(t(),x("div",{class:m(`${T}-transfer-list-header__title`)},[typeof O=="function"?(t(),x(A,{key:0},[C(()=>O())],64)):(t(),x(A,{key:1},[C(()=>O)],64))],2))),C(()=>n&&(t(),v(ee,{class:m(`${T}-transfer-list-header__button`),theme:_.peers.Button,themeOverrides:_.peerOverrides.Button,size:I,tertiary:!0,onClick:c.value?h:F,disabled:l.value||f.value},{default:()=>c.value?S||w.unselectAll:P||w.selectAll},1032,["class","theme","themeOverrides","size","onClick","disabled"]))),C(()=>!n&&i.value&&(t(),v(ee,{class:m(`${T}-transfer-list-header__button`),theme:_.peers.Button,themeOverrides:_.peerOverrides.Button,size:I,tertiary:!0,onClick:h,disabled:f.value},{default:()=>w.clearAll},1032,["class","theme","themeOverrides","size","onClick","disabled"]))),k("div",{class:m(`${T}-transfer-list-header__extra`)},[n?(t(),x(A,{key:0},[C(()=>w.total(b.value))],64)):(t(),x(A,{key:1},[C(()=>w.selected(o.value.length))],64))],2)],2)}}});const gt=["onClick"],pt=["title"];var ne=E({name:"NTransferListItem",props:{source:Boolean,label:{type:String,required:!0},value:{type:[String,Number],required:!0},disabled:Boolean,option:{type:Object,required:!0}},setup(e){const{targetValueSetRef:o,mergedClsPrefixRef:l,mergedThemeRef:i,handleItemCheck:c,renderSourceLabelRef:a,renderTargetLabelRef:f,showSelectedRef:s}=K(W),b=Ze(()=>o.value.has(e.value));function u(){e.disabled||c(!b.value,e.value)}return{mergedClsPrefix:l,mergedTheme:i,checked:b,showSelected:s,renderSourceLabel:a,renderTargetLabel:f,handleClick:u}},render(){const{disabled:e,mergedTheme:o,mergedClsPrefix:l,label:i,checked:c,source:a,renderSourceLabel:f,renderTargetLabel:s}=this;return t(),x("div",{class:m([`${l}-transfer-list-item`,e&&`${l}-transfer-list-item--disabled`,a?`${l}-transfer-list-item--source`:`${l}-transfer-list-item--target`]),onClick:a?this.handleClick:void 0},[k("div",{class:m(`${l}-transfer-list-item__background`)},null,2),C(()=>a&&this.showSelected&&(t(),x("div",{class:m(`${l}-transfer-list-item__checkbox`)},[(t(),v(ft,{theme:o.peers.Checkbox,themeOverrides:o.peerOverrides.Checkbox,disabled:e,checked:c},null,8,["theme","themeOverrides","disabled","checked"]))],2))),k("div",{class:m(`${l}-transfer-list-item__label`),title:Ge(i)},[a?(t(),x(A,{key:0},[f?(t(),x(A,{key:0},[C(()=>f({option:this.option}))],64)):(t(),x(A,{key:1},[C(()=>i)],64))],64)):(t(),x(A,{key:1},[s?(t(),x(A,{key:0},[C(()=>s({option:this.option}))],64)):(t(),x(A,{key:1},[C(()=>i)],64))],64))],10,pt),C(()=>!a&&!e&&(t(),v(Qe,{focusable:!1,class:m(`${l}-transfer-list-item__close`),clsPrefix:l,onClick:this.handleClick},null,8,["class","clsPrefix","onClick"])))],10,gt)}}),de=E({name:"TransferList",props:{virtualScroll:{type:Boolean,required:!0},itemSize:{type:Number,required:!0},options:{type:Array,required:!0},disabled:{type:Boolean,required:!0},source:Boolean},setup(){const{mergedThemeRef:e,mergedClsPrefixRef:o}=K(W),{mergedComponentPropsRef:l}=ce(),i=M(null),c=M(null),a=g(()=>l?.value?.Transfer?.renderEmpty);function f(){i.value?.sync()}function s(){const{value:u}=c;if(!u)return null;const{listElRef:n}=u;return n}function b(){const{value:u}=c;if(!u)return null;const{itemsElRef:n}=u;return n}return{mergedTheme:e,mergedClsPrefix:o,mergedRenderEmpty:a,scrollerInstRef:i,vlInstRef:c,syncVLScroller:f,scrollContainer:s,scrollContent:b}},render(){const{mergedTheme:e,options:o}=this;if(o.length===0)return this.mergedRenderEmpty?.()||(t(),v(et,{key:1,theme:e.peers.Empty,themeOverrides:e.peerOverrides.Empty},null,8,["theme","themeOverrides"]));const{mergedClsPrefix:l,virtualScroll:i,source:c,disabled:a,syncVLScroller:f}=this;return t(),v(te,{ref:"scrollerInstRef",theme:e.peers.Scrollbar,themeOverrides:e.peerOverrides.Scrollbar,container:i?this.scrollContainer:void 0,content:i?this.scrollContent:void 0},{default:()=>i?(t(),v(tt,{key:2,ref:"vlInstRef",style:{height:"100%"},class:m(`${l}-transfer-list-content`),items:this.options,itemSize:this.itemSize,showScrollbar:!1,onResize:f,onScroll:f,keyField:"value"},{default:({item:s})=>{const{source:b,disabled:u}=this;return t(),v(ne,{source:b,key:s.value,value:s.value,disabled:s.disabled||u,label:s.label,option:s},null,8,["source","value","disabled","label","option"])}},1032,["class","items","itemSize","onResize","onScroll"])):(t(),x("div",{key:3,class:m(`${l}-transfer-list-content`)},[C(()=>o.map(s=>(t(),v(ne,{source:c,key:s.value,value:s.value,disabled:s.disabled||a,label:s.label,option:s},null,8,["source","value","disabled","label","option"]))))],2))},1032,["theme","themeOverrides","container","content"])}});function xt(e){const o=M(e.defaultValue),l=rt(J(e,"value"),o),i=g(()=>{const r=new Map;return(e.options||[]).forEach(d=>r.set(d.value,d)),r}),c=g(()=>new Set(l.value||[])),a=g(()=>{const r=i.value,d=[];return(l.value||[]).forEach(q=>{const V=r.get(q);V&&d.push(V)}),d}),f=M(""),s=M(""),b=g(()=>e.sourceFilterable||!!e.filterable),u=g(()=>{const{showSelected:r,options:d,filter:q}=e;return b.value?d.filter(V=>q(f.value,V,"source")&&(r||!c.value.has(V.value))):r?d:d.filter(V=>!c.value.has(V.value))}),n=g(()=>{if(!e.targetFilterable)return a.value;const{filter:r}=e;return a.value.filter(d=>r(s.value,d,"target"))}),h=g(()=>{const{value:r}=l;return r===null?new Set:new Set(r)}),F=g(()=>{const r=new Set(h.value);return u.value.forEach(d=>{!d.disabled&&!r.has(d.value)&&r.add(d.value)}),r}),P=g(()=>{const r=new Set(h.value);return u.value.forEach(d=>{!d.disabled&&r.has(d.value)&&r.delete(d.value)}),r}),S=g(()=>{const r=new Set(h.value);return n.value.forEach(d=>{d.disabled||r.delete(d.value)}),r}),_=g(()=>u.value.every(r=>r.disabled)),T=g(()=>{if(!u.value.length)return!1;const r=h.value;return u.value.every(d=>d.disabled||r.has(d.value))}),w=g(()=>n.value.some(r=>!r.disabled));function I(r){f.value=r??""}function O(r){s.value=r??""}return{uncontrolledValueRef:o,mergedValueRef:l,targetValueSetRef:c,valueSetForCheckAllRef:F,valueSetForUncheckAllRef:P,valueSetForClearRef:S,filteredTgtOptionsRef:n,filteredSrcOptionsRef:u,targetOptionsRef:a,canNotSelectAnythingRef:_,canBeClearedRef:w,allCheckedRef:T,srcPatternRef:f,tgtPatternRef:s,mergedSrcFilterableRef:b,handleSrcFilterUpdateValue:I,handleTgtFilterUpdateValue:O}}const St={...ue.props,value:Array,defaultValue:{type:Array,default:null},options:{type:Array,default:()=>[]},disabled:{type:Boolean,default:void 0},virtualScroll:Boolean,sourceTitle:[String,Function],selectAllText:String,clearText:String,targetTitle:[String,Function],filterable:{type:Boolean,default:void 0},sourceFilterable:Boolean,targetFilterable:Boolean,showSelected:{type:Boolean,default:!0},sourceFilterPlaceholder:String,targetFilterPlaceholder:String,filter:{type:Function,default:(e,o)=>e?~`${o.label}`.toLowerCase().indexOf(`${e}`.toLowerCase()):!0},size:String,renderSourceLabel:Function,renderTargetLabel:Function,renderSourceList:Function,renderTargetList:Function,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onChange:[Function,Array]};var Ct=E({name:"Transfer",props:St,setup(e){const{mergedClsPrefixRef:o,mergedComponentPropsRef:l}=ce(e),i=ue("Transfer","-transfer",bt,vt,e,o),c=at(e,{mergedSize:p=>{const{size:z}=e;if(z)return z;const{mergedSize:L}=p||{};if(L?.value)return L.value;const $=l?.value?.Transfer?.size;return $||"medium"}}),{mergedSizeRef:a,mergedDisabledRef:f}=c,s=g(()=>{const{value:p}=a,{self:{[H("itemHeight",p)]:z}}=i.value;return st(z)}),{uncontrolledValueRef:b,mergedValueRef:u,targetValueSetRef:n,valueSetForCheckAllRef:h,valueSetForUncheckAllRef:F,valueSetForClearRef:P,filteredTgtOptionsRef:S,filteredSrcOptionsRef:_,targetOptionsRef:T,canNotSelectAnythingRef:w,canBeClearedRef:I,allCheckedRef:O,srcPatternRef:r,tgtPatternRef:d,mergedSrcFilterableRef:q,handleSrcFilterUpdateValue:V,handleTgtFilterUpdateValue:fe}=xt(e);function N(p){const{onUpdateValue:z,"onUpdate:value":L,onChange:$}=e,{nTriggerFormInput:X,nTriggerFormChange:Y}=c;z&&G(z,p),L&&G(L,p),$&&G($,p),b.value=p,X(),Y()}function he(){N([...h.value])}function me(){N([...F.value])}function ve(){N([...P.value])}function re(p,z){N(p?(u.value||[]).concat(z):(u.value||[]).filter(L=>L!==z))}function be(p){N(p)}return ot(W,{targetValueSetRef:n,mergedClsPrefixRef:o,disabledRef:f,mergedThemeRef:i,targetOptionsRef:T,canNotSelectAnythingRef:w,canBeClearedRef:I,allCheckedRef:O,srcOptionsLengthRef:g(()=>e.options.length),handleItemCheck:re,renderSourceLabelRef:J(e,"renderSourceLabel"),renderTargetLabelRef:J(e,"renderTargetLabel"),showSelectedRef:J(e,"showSelected")}),{mergedClsPrefix:o,mergedDisabled:f,itemSize:s,isMounted:it(),mergedTheme:i,filteredSrcOpts:_,filteredTgtOpts:S,srcPattern:r,tgtPattern:d,mergedSize:a,mergedSrcFilterable:q,handleSrcFilterUpdateValue:V,handleTgtFilterUpdateValue:fe,handleSourceCheckAll:he,handleSourceUncheckAll:me,handleTargetClearAll:ve,handleItemCheck:re,handleChecked:be,cssVars:g(()=>{const{value:p}=a,{common:{cubicBezierEaseInOut:z},self:{borderRadius:L,borderColor:$,listColor:X,titleTextColor:Y,titleTextColorDisabled:ge,extraTextColor:pe,itemTextColor:xe,itemColorPending:Se,itemTextColorDisabled:Ce,titleFontWeight:ye,closeColorHover:ke,closeColorPressed:ze,closeIconColor:Re,closeIconColorHover:Te,closeIconColorPressed:we,closeIconSize:Fe,closeSize:_e,dividerColor:Oe,extraTextColorDisabled:Ae,[H("extraFontSize",p)]:Pe,[H("fontSize",p)]:Ve,[H("titleFontSize",p)]:Le,[H("itemHeight",p)]:Be,[H("headerHeight",p)]:Ie}}=i.value;return{"--n-bezier":z,"--n-border-color":$,"--n-border-radius":L,"--n-extra-font-size":Pe,"--n-font-size":Ve,"--n-header-font-size":Le,"--n-header-extra-text-color":pe,"--n-header-extra-text-color-disabled":Ae,"--n-header-font-weight":ye,"--n-header-text-color":Y,"--n-header-text-color-disabled":ge,"--n-item-color-pending":Se,"--n-item-height":Be,"--n-item-text-color":xe,"--n-item-text-color-disabled":Ce,"--n-list-color":X,"--n-header-height":Ie,"--n-close-size":_e,"--n-close-icon-size":Fe,"--n-close-color-hover":ke,"--n-close-color-pressed":ze,"--n-close-icon-color":Re,"--n-close-icon-color-hover":Te,"--n-close-icon-color-pressed":we,"--n-divider-color":Oe}})}},render(){const{mergedClsPrefix:e,renderSourceList:o,renderTargetList:l,mergedTheme:i,mergedSrcFilterable:c,targetFilterable:a}=this;return t(),x("div",{class:m([`${e}-transfer`,this.mergedDisabled&&`${e}-transfer--disabled`]),style:lt(this.cssVars)},[k("div",{class:m(`${e}-transfer-list ${e}-transfer-list--source`)},[(t(),v(se,{source:!0,selectAllText:this.selectAllText,clearText:this.clearText,title:this.sourceTitle,onCheckedAll:this.handleSourceCheckAll,onClearAll:this.handleSourceUncheckAll,size:this.mergedSize},null,8,["selectAllText","clearText","title","onCheckedAll","onClearAll","size"])),k("div",{class:m(`${e}-transfer-list-body`)},[c?(t(),v(ie,{key:0,onUpdateValue:this.handleSrcFilterUpdateValue,value:this.srcPattern,disabled:this.mergedDisabled,placeholder:this.sourceFilterPlaceholder},null,8,["onUpdateValue","value","disabled","placeholder"])):C(()=>null),k("div",{class:m(`${e}-transfer-list-flex-container`)},[o?(t(),v(te,{key:0,theme:i.peers.Scrollbar,themeOverrides:i.peerOverrides.Scrollbar},{default:()=>o({onCheck:this.handleChecked,checkedOptions:this.filteredTgtOpts,pattern:this.srcPattern})},1032,["theme","themeOverrides"])):(t(),v(de,{key:1,source:!0,options:this.filteredSrcOpts,disabled:this.mergedDisabled,virtualScroll:this.virtualScroll,itemSize:this.itemSize},null,8,["options","disabled","virtualScroll","itemSize"]))],2)],2),k("div",{class:m(`${e}-transfer-list__border`)},null,2)],2),k("div",{class:m(`${e}-transfer-list ${e}-transfer-list--target`)},[(t(),v(se,{onClearAll:this.handleTargetClearAll,size:this.mergedSize,title:this.targetTitle},null,8,["onClearAll","size","title"])),k("div",{class:m(`${e}-transfer-list-body`)},[a?(t(),v(ie,{key:0,onUpdateValue:this.handleTgtFilterUpdateValue,value:this.tgtPattern,disabled:this.mergedDisabled,placeholder:this.sourceFilterPlaceholder},null,8,["onUpdateValue","value","disabled","placeholder"])):C(()=>null),k("div",{class:m(`${e}-transfer-list-flex-container`)},[l?(t(),v(te,{key:0,theme:i.peers.Scrollbar,themeOverrides:i.peerOverrides.Scrollbar},{default:()=>l({onCheck:this.handleChecked,checkedOptions:this.filteredTgtOpts,pattern:this.tgtPattern})},1032,["theme","themeOverrides"])):(t(),v(de,{key:1,options:this.filteredTgtOpts,disabled:this.mergedDisabled,virtualScroll:this.virtualScroll,itemSize:this.itemSize},null,8,["options","disabled","virtualScroll","itemSize"]))],2)],2),k("div",{class:m(`${e}-transfer-list__border`)},null,2)],2)],6)}});const yt={class:"flex justify-end mt-4 gap-2"},Tt=E({__name:"ToolGroupFormModal",props:{show:{type:Boolean,default:!1},editMode:{type:Boolean,default:!1},initialData:{type:Object,required:!0},availableTools:{type:Array,default:()=>[]}},emits:["update:show","submit"],setup(e,{emit:o}){const l=e,i=o,c=M(null),a=M({}),f=g(()=>l.availableTools.map(n=>({label:n.name,value:n.id,disabled:!1,description:n.description})));ae(()=>l.initialData,n=>{a.value=JSON.parse(JSON.stringify(n))},{immediate:!0,deep:!0}),ae(()=>l.show,n=>{n||(a.value=JSON.parse(JSON.stringify(l.initialData)))});function s(){c.value?.validate(n=>{n||i("submit",a.value)})}const b=g({get:()=>l.show,set:n=>i("update:show",n)});function u(){i("update:show",!1)}return(n,h)=>{const F=ee,P=dt;return b.value?(t(),v(P,{key:0,show:b.value,"onUpdate:show":h[3]||(h[3]=S=>b.value=S),title:e.editMode?"编辑工具组":"新建工具组",preset:"card",style:{width:"60vw"},"mask-closable":!1},{default:U(()=>[B(D(ut),{ref_key:"formRef",ref:c,model:a.value,"label-placement":"left","label-width":"80","require-mark-placement":"right-hanging"},{default:U(()=>[B(D(Q),{label:"组名称",path:"name",rule:{required:!0,message:"请输入工具组名称"}},{default:U(()=>[B(D(Z),{value:a.value.name,"onUpdate:value":h[0]||(h[0]=S=>a.value.name=S),placeholder:"请输入工具组名称"},null,8,["value"])]),_:1}),B(D(Q),{label:"描述",path:"description"},{default:U(()=>[B(D(Z),{value:a.value.description,"onUpdate:value":h[1]||(h[1]=S=>a.value.description=S),type:"textarea",placeholder:"请输入工具组描述",autosize:{minRows:3,maxRows:5}},null,8,["value"])]),_:1}),B(D(Q),{label:"关联工具",path:"toolIds"},{default:U(()=>[B(D(Ct),{value:a.value.toolIds,"onUpdate:value":h[2]||(h[2]=S=>a.value.toolIds=S),options:f.value,filterable:"","source-title":"可选工具","target-title":"已选工具",size:"large"},null,8,["value","options"])]),_:1}),k("div",yt,[B(F,{onClick:u},{default:U(()=>[...h[4]||(h[4]=[oe(" 取消 ",-1)])]),_:1}),B(F,{type:"primary",onClick:s},{default:U(()=>[oe(nt(e.editMode?"保存修改":"创建工具组"),1)]),_:1})])]),_:1},8,["model"])]),_:1},8,["show","title"])):ct("",!0)}}});export{Tt as _};
