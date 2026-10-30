import{ac as D,ad as f,ae as w,aH as p,bc as O,bd as A,d as L,af as N,o as s,c as i,a3 as h,a4 as c,R as G,ah as K,bv as W,cD as Y,aW as J,aj as Q,N as X,aB as Z,aY as ee,aF as re,aC as oe,$ as E,m as T,a as u,n as te,q as se,e as n,w as d,g as S,u as a,B as I,C as ae,bk as le,V as ne,b as H,O as ie,P as de,F as ce,t as ue,a2 as M,bj as me,h as m,D as b,j as ve}from"./index-cuzpzUx6.js";import{D as fe}from"./DataTable-BF1UnkX9.js";import{P as pe}from"./Popconfirm-gfrJms0y.js";import{S as he,_ as be}from"./ConversationDetailDrawer.vue_vue_type_script_setup_true_lang-BynYxPfw.js";import{t as ge}from"./text-CrqbKjnW.js";import{I as ye}from"./preview-open-DujmVY0K.js";import"./download-BHAnypI7.js";import"./Ellipsis-C27UudP3.js";import"./prop-CUltvu8b.js";import"./CheckboxGroup-C7Ok04_L.js";import"./RadioGroup-C3zMUOSW.js";import"./MessageContentCard-D8MCCiMp.js";import"./Code-Cwc3cnpA.js";import"./CollapseItem-BRbP_Zeb.js";import"./Image-CmVYu09c.js";var xe=D([f("list",`
 --n-merged-border-color: var(--n-border-color);
 --n-merged-color: var(--n-color);
 --n-merged-color-hover: var(--n-color-hover);
 margin: 0;
 font-size: var(--n-font-size);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 padding: 0;
 list-style-type: none;
 color: var(--n-text-color);
 background-color: var(--n-merged-color);
 `,[w("show-divider",[f("list-item",[D("&:not(:last-child)",[p("divider",`
 background-color: var(--n-merged-border-color);
 `)])])]),w("clickable",[f("list-item",`
 cursor: pointer;
 `)]),w("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `),w("hoverable",[f("list-item",`
 border-radius: var(--n-border-radius);
 `,[D("&:hover",`
 background-color: var(--n-merged-color-hover);
 `,[p("divider",`
 background-color: transparent;
 `)])])]),w("bordered, hoverable",[f("list-item",`
 padding: 12px 20px;
 `),p("header, footer",`
 padding: 12px 20px;
 `)]),p("header, footer",`
 padding: 12px 0;
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[D("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),f("list-item",`
 position: relative;
 padding: 12px 0; 
 box-sizing: border-box;
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[p("prefix",`
 margin-right: 20px;
 flex: 0;
 `),p("suffix",`
 margin-left: 20px;
 flex: 0;
 `),p("main",`
 flex: 1;
 `),p("divider",`
 height: 1px;
 position: absolute;
 bottom: 0;
 left: 0;
 right: 0;
 background-color: transparent;
 transition: background-color .3s var(--n-bezier);
 pointer-events: none;
 `)])]),O(f("list",`
 --n-merged-color-hover: var(--n-color-hover-modal);
 --n-merged-color: var(--n-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),A(f("list",`
 --n-merged-color-hover: var(--n-color-hover-popover);
 --n-merged-color: var(--n-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const ke={...N.props,size:{type:String,default:"medium"},bordered:Boolean,clickable:Boolean,hoverable:Boolean,showDivider:{type:Boolean,default:!0}},q=Z("n-list");var _e=L({name:"List",props:ke,slots:Object,setup(t){const{mergedClsPrefixRef:e,inlineThemeDisabled:v,mergedRtlRef:x}=K(t),k=W("List",x,e),R=N("List","-list",xe,Y,t,e);J(q,{showDividerRef:ee(t,"showDivider"),mergedClsPrefixRef:e});const g=X(()=>{const{common:{cubicBezierEaseInOut:z},self:{fontSize:$,textColor:_,color:C,colorModal:B,colorPopover:P,borderColor:V,borderColorModal:j,borderColorPopover:r,borderRadius:o,colorHover:l,colorHoverModal:U,colorHoverPopover:F}}=R.value;return{"--n-font-size":$,"--n-bezier":z,"--n-text-color":_,"--n-color":C,"--n-border-radius":o,"--n-border-color":V,"--n-border-color-modal":j,"--n-border-color-popover":r,"--n-color-modal":B,"--n-color-popover":P,"--n-color-hover":l,"--n-color-hover-modal":U,"--n-color-hover-popover":F}}),y=v?Q("list",void 0,g,t):void 0;return{mergedClsPrefix:e,rtlEnabled:k,cssVars:v?void 0:g,themeClass:y?.themeClass,onRender:y?.onRender}},render(){const{$slots:t,mergedClsPrefix:e,onRender:v}=this;return v?.(),s(),i("ul",{class:h([`${e}-list`,this.rtlEnabled&&`${e}-list--rtl`,this.bordered&&`${e}-list--bordered`,this.showDivider&&`${e}-list--show-divider`,this.hoverable&&`${e}-list--hoverable`,this.clickable&&`${e}-list--clickable`,this.themeClass]),style:G(this.cssVars)},[t.header?(s(),i("div",{key:0,class:h(`${e}-list__header`)},[c(()=>t.header())],2)):c(()=>null),c(()=>t.default?.()),t.footer?(s(),i("div",{key:2,class:h(`${e}-list__footer`)},[c(()=>t.footer())],2)):c(()=>null)],6)}}),Ce=L({name:"ListItem",slots:Object,setup(){const t=re(q,null);return t||oe("list-item","`n-list-item` must be placed in `n-list`."),{showDivider:t.showDividerRef,mergedClsPrefix:t.mergedClsPrefixRef}},render(){const{$slots:t,mergedClsPrefix:e}=this;return s(),i("li",{class:h(`${e}-list-item`)},[t.prefix?(s(),i("div",{key:0,class:h(`${e}-list-item__prefix`)},[c(()=>t.prefix())],2)):c(()=>null),t.default?(s(),i("div",{key:2,class:h(`${e}-list-item__main`)},[c(()=>t.default())],2)):c(()=>null),t.suffix?(s(),i("div",{key:4,class:h(`${e}-list-item__suffix`)},[c(()=>t.suffix())],2)):c(()=>null),c(()=>this.showDivider&&(s(),i("div",{class:h(`${e}-list-item__divider`)},null,2)))],2)}});function we(){return E.Get("/api/state/list",{params:{pageSize:100}})}function ze(t){return E.Delete(`/api/state/${t}`)}function $e(t,e){return E.Get(`/api/state/history/${e}`,{params:{messageId:t}})}const De={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Ie(t,e){return s(),i("svg",De,[...e[0]||(e[0]=[u("g",{fill:"none",stroke:"currentColor","stroke-linejoin":"round","stroke-width":"4"},[u("path",{d:"M9 10v34h30V10z"}),u("path",{"stroke-linecap":"round",d:"M20 20v13m8-13v13M4 10h40"}),u("path",{d:"m16 10l3.289-6h9.488L32 10z"})],-1)])])}const Re=T({name:"icon-park-outline-delete",render:Ie}),Be={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Pe(t,e){return s(),i("svg",Be,[...e[0]||(e[0]=[u("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"4",d:"M44 24c0 11.046-8.954 20-20 20H4V24C4 12.954 12.954 4 24 4s20 8.954 20 20m-30-6h18m-18 8h18m-18 8h10"},null,-1)])])}const Ve=T({name:"icon-park-outline-message",render:Pe}),je={class:"chaite-page"},Se={class:"chaite-page-header"},Me={key:0,class:"flex justify-center items-center py-8"},Le=L({__name:"index",setup(t){const e=te(),v=m([]),x=m(!1),k=m(!1),R=m(""),g=m([]),y=m(!1),z=m(null),$=m([]),_=m(!1);async function C(){x.value=!0;try{const r=await we();r.code===0?v.value=Array.isArray(r.data)?r.data:r.data.items||[]:e.error(r.message||"加载用户状态失败")}catch(r){e.error(r.message||"获取用户状态时发生错误")}finally{x.value=!1}}function B(r){R.value=r;const o=v.value.find(l=>l.userId===r);o&&(g.value=o.conversations,k.value=!0)}async function P(r){try{const o=await ze(r);o.code===0?(e.success("删除用户状态成功"),await C()):e.error(o.message||"删除用户状态失败")}catch(o){e.error(o.message||"删除用户状态时发生错误")}}async function V(r){z.value=r,y.value=!0,_.value=!0;try{const o=await $e(r.lastMessageId,r.id);o.code===0?$.value=o.data:e.error(o.message||"获取对话历史失败")}catch(o){e.error(o.message||"获取对话历史时发生错误")}finally{_.value=!1}}const j=[{title:"用户ID",key:"userId"},{title:"昵称",key:"nickname",render:r=>r.nickname||"未设置"},{title:"对话数量",key:"conversationCount",render:r=>r.conversations?.length||0},{title:"当前对话",key:"currentConversation",render:r=>{const o=r.conversations?.find(l=>l.id===r.current.conversationId);return o?o.name:"无"}},{title:"预设",key:"settings.preset",render:r=>r.settings?.preset||"默认"},{title:"模型",key:"settings.model",render:r=>r.settings?.model||"未设置"},{title:"操作",key:"actions",render:r=>[b(I,{quaternary:!0,size:"small",onClick:()=>B(r.userId)},{default:()=>"查看对话",icon:()=>b(M,null,{default:()=>b(Ve)})}),b(pe,{onPositiveClick:()=>P(r.userId.toString())},{trigger:()=>b(I,{quaternary:!0,size:"small",type:"error"},{default:()=>"删除",icon:()=>b(M,null,{default:()=>b(Re)})}),default:()=>"确定要删除此用户状态吗？此操作不可撤销。"})]}];return se(()=>{C()}),(r,o)=>(s(),i("div",je,[u("header",Se,[o[3]||(o[3]=u("div",null,[u("h1",null,"用户与会话"),u("p",null,"查看用户当前模型、预设和历史对话。")],-1)),n(a(I),{type:"primary",onClick:C},{default:d(()=>[...o[2]||(o[2]=[S("刷新",-1)])]),_:1})]),n(a(ae),{class:"chaite-panel",bordered:!1},{default:d(()=>[n(a(he),{show:x.value},{default:d(()=>[n(a(fe),{columns:j,data:v.value,bordered:!1,striped:""},null,8,["data"])]),_:1},8,["show"])]),_:1}),n(a(me),{show:k.value,"onUpdate:show":o[0]||(o[0]=l=>k.value=l),width:500},{default:d(()=>[n(a(le),{title:"用户对话列表",closable:""},{default:d(()=>[g.value.length===0?(s(),i("div",Me,[n(a(ne),{description:"该用户没有对话记录"})])):(s(),H(a(_e),{key:1},{default:d(()=>[(s(!0),i(ie,null,de(g.value,l=>(s(),H(a(Ce),{key:l.id},{default:d(()=>[n(a(ce),{justify:"space-between",align:"center"},{default:d(()=>[u("div",null,[n(a(ge),null,{default:d(()=>[S(ue(l.name),1)]),_:2},1024)]),u("div",null,[n(a(I),{text:"",type:"primary",onClick:U=>V(l)},{icon:d(()=>[n(a(M),null,{default:d(()=>[n(a(ye))]),_:1})]),default:d(()=>[o[4]||(o[4]=S(" 查看详情 ",-1))]),_:1},8,["onClick"])])]),_:2},1024)]),_:2},1024))),128))]),_:1}))]),_:1})]),_:1},8,["show"]),n(be,{show:y.value,"onUpdate:show":o[1]||(o[1]=l=>y.value=l),conversation:z.value,history:$.value,loading:_.value},null,8,["show","conversation","history","loading"])]))}}),Xe=ve(Le,[["__scopeId","data-v-4aa16cc4"]]);export{Xe as default};
