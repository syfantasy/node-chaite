import{ad as f,ae as x,aH as o,ac as $,ck as K,aI as Y,d as A,af as U,o as u,c as _,a4 as y,R as Z,a3 as g,ah as H,h as G,aU as J,cl as Q,aW as X,bv as M,aj as ee,N as E,aB as ae,aZ as R,b as N,aL as re,a as k,aM as te,bO as le,cm as oe,cn as se,aY as V,b4 as B,co as ie,b_ as ne,a5 as de,cp as ce,ag as pe,bC as me,bB as fe,aF as ue,aC as he,a$ as F}from"./index-CXiTE9ZL.js";var xe=f("collapse","width: 100%;",[f("collapse-item",`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[x("disabled",[o("header","cursor: not-allowed;",[o("header-main",`
 color: var(--n-title-text-color-disabled);
 `),f("collapse-item-arrow",`
 color: var(--n-arrow-color-disabled);
 `)])]),f("collapse-item","margin-left: 32px;"),$("&:first-child","margin-top: 0;"),$("&:first-child >",[o("header","padding-top: 0;")]),x("left-arrow-placement",[o("header",[f("collapse-item-arrow","margin-right: 4px;")])]),x("right-arrow-placement",[o("header",[f("collapse-item-arrow","margin-left: 4px;")])]),o("content-wrapper",[o("content-inner","padding-top: 16px;"),K({duration:"0.15s"})]),x("active",[o("header",[x("active",[f("collapse-item-arrow","transform: rotate(90deg);")])])]),$("&:not(:first-child)","border-top: 1px solid var(--n-divider-color);"),Y("disabled",[x("trigger-area-main",[o("header",[o("header-main","cursor: pointer;"),f("collapse-item-arrow","cursor: default;")])]),x("trigger-area-arrow",[o("header",[f("collapse-item-arrow","cursor: pointer;")])]),x("trigger-area-extra",[o("header",[o("header-extra","cursor: pointer;")])])]),o("header",`
 font-size: var(--n-title-font-size);
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: color .3s var(--n-bezier);
 position: relative;
 padding: var(--n-title-padding);
 color: var(--n-title-text-color);
 `,[o("header-main",`
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 color: var(--n-title-text-color);
 `),o("header-extra",`
 display: flex;
 align-items: center;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),f("collapse-item-arrow",`
 display: flex;
 transition:
 transform .15s var(--n-bezier),
 color .3s var(--n-bezier);
 font-size: 18px;
 color: var(--n-arrow-color);
 `)])])]);const ge={...U.props,defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:"left"},accordion:Boolean,displayDirective:{type:String,default:"if"},triggerAreas:{type:Array,default:()=>["main","extra","arrow"]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}},j=ae("n-collapse");var Ne=A({name:"Collapse",props:ge,slots:Object,setup(e,{slots:n}){const{mergedClsPrefixRef:s,inlineThemeDisabled:l,mergedRtlRef:d}=H(e),a=G(e.defaultExpandedNames),h=E(()=>e.expandedNames),v=J(h,a),w=U("Collapse","-collapse",xe,Q,e,s);function c(p){const{"onUpdate:expandedNames":t,onUpdateExpandedNames:m,onExpandedNamesChange:b}=e;m&&R(m,p),t&&R(t,p),b&&R(b,p),a.value=p}function r(p){const{onItemHeaderClick:t}=e;t&&R(t,p)}function i(p,t,m){const{accordion:b}=e,{value:z}=v;if(b)p?(c([t]),r({name:t,expanded:!0,event:m})):(c([]),r({name:t,expanded:!1,event:m}));else if(!Array.isArray(z))c([t]),r({name:t,expanded:!0,event:m});else{const C=z.slice(),P=C.findIndex(I=>t===I);~P?(C.splice(P,1),c(C),r({name:t,expanded:!1,event:m})):(C.push(t),c(C),r({name:t,expanded:!0,event:m}))}}X(j,{props:e,mergedClsPrefixRef:s,expandedNamesRef:v,slots:n,toggleItem:i});const S=M("Collapse",d,s),D=E(()=>{const{common:{cubicBezierEaseInOut:p},self:{titleFontWeight:t,dividerColor:m,titlePadding:b,titleTextColor:z,titleTextColorDisabled:C,textColor:P,arrowColor:I,fontSize:W,titleFontSize:L,arrowColorDisabled:O,itemMargin:q}}=w.value;return{"--n-font-size":W,"--n-bezier":p,"--n-text-color":P,"--n-divider-color":m,"--n-title-padding":b,"--n-title-font-size":L,"--n-title-text-color":z,"--n-title-text-color-disabled":C,"--n-title-font-weight":t,"--n-arrow-color":I,"--n-arrow-color-disabled":O,"--n-item-margin":q}}),T=l?ee("collapse",void 0,D,e):void 0;return{rtlEnabled:S,mergedTheme:w,mergedClsPrefix:s,cssVars:l?void 0:D,themeClass:T?.themeClass,onRender:T?.onRender}},render(){return this.onRender?.(),u(),_("div",{class:g([`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass]),style:Z(this.cssVars)},[y(()=>this.$slots.default?.())],6)}}),ve=A({name:"CollapseItemContent",props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:se(V(e,"show"))}},render(){return u(),N(oe,null,{_:1,default:re(()=>{const{show:e,displayDirective:n,onceTrue:s,clsPrefix:l}=this,d=n==="show"&&s,a=(u(),_("div",{class:g(`${l}-collapse-item__content-wrapper`)},[k("div",{class:g(`${l}-collapse-item__content-inner`)},[y(()=>this.$slots.default?.())],2)],2));return d?te(a,[[le,e]]):e?a:null})})}});const we=["onClick"],Ce=["onClick"],ye={title:String,name:[String,Number],disabled:Boolean,displayDirective:String};var _e=A({name:"CollapseItem",props:ye,setup(e){const{mergedRtlRef:n}=H(e),s=me(),l=fe(()=>e.name??s),d=ue(j);d||he("collapse-item","`n-collapse-item` must be placed inside `n-collapse`.");const{expandedNamesRef:a,props:h,mergedClsPrefixRef:v,slots:w}=d,c=E(()=>{const{value:r}=a;if(Array.isArray(r)){const{value:i}=l;return!~r.findIndex(S=>S===i)}else if(r){const{value:i}=l;return i!==r}return!0});return{rtlEnabled:M("Collapse",n,v),collapseSlots:w,randomName:s,mergedClsPrefix:v,collapsed:c,triggerAreas:V(h,"triggerAreas"),mergedDisplayDirective:E(()=>{const{displayDirective:r}=e;return r||h.displayDirective}),arrowPlacement:E(()=>h.arrowPlacement),handleClick(r){let i="main";F(r,"arrow")&&(i="arrow"),F(r,"extra")&&(i="extra"),h.triggerAreas.includes(i)&&d&&!e.disabled&&d.toggleItem(c.value,l.value,r)}}},render(){const{collapseSlots:e,$slots:n,arrowPlacement:s,collapsed:l,mergedDisplayDirective:d,mergedClsPrefix:a,disabled:h,triggerAreas:v}=this,w=B(n.header,{collapsed:l},()=>[this.title]),c=n["header-extra"]||e["header-extra"],r=n.arrow||e.arrow;return u(),_("div",{class:g([`${a}-collapse-item`,`${a}-collapse-item--${s}-arrow-placement`,h&&`${a}-collapse-item--disabled`,!l&&`${a}-collapse-item--active`,v.map(i=>`${a}-collapse-item--trigger-area-${i}`)])},[k("div",{class:g([`${a}-collapse-item__header`,!l&&`${a}-collapse-item__header--active`])},[k("div",{class:g(`${a}-collapse-item__header-main`),onClick:this.handleClick},[y(()=>s==="right"&&w),(u(),_("div",{class:g(`${a}-collapse-item-arrow`),key:this.rtlEnabled?0:1,"data-arrow":!0},[y(()=>B(r,{collapsed:l},()=>[(u(),N(de,{clsPrefix:a},{default:()=>this.rtlEnabled?(u(),N(ie,{key:1})):(u(),N(ne,{key:2}))},1032,["clsPrefix"]))]))],2)),y(()=>s==="left"&&w)],10,Ce),y(()=>ce(c,{collapsed:l},i=>(u(),_("div",{class:g(`${a}-collapse-item__header-extra`),onClick:this.handleClick,"data-extra":!0},[y(()=>i)],10,we))))],2),(u(),N(ve,{clsPrefix:a,displayDirective:d,show:!l},pe(n),1032,["clsPrefix","displayDirective","show"]))],2)}});export{Ne as C,_e as a};
