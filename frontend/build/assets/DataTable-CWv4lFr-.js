import{af as $t,aB as _r,d as se,D as Lr,b6 as Te,bU as Kr,bV as $r,h as X,aA as dt,o,c as k,O as fe,a4 as B,bW as ft,ab as _e,a as ie,e as it,b as z,a3 as N,aD as Mt,B as xt,ah as st,bv as At,aF as Ae,N as h,R as Re,a5 as ct,X as Mr,bF as Ar,bX as ot,bA as Rt,bY as Ur,Y as Or,bN as Ee,b1 as Ut,w as Ot,a$ as Ct,bJ as wt,bZ as Bt,b_ as Br,bz as Nr,bg as Dr,b$ as Hr,bB as Ye,ac as Q,b7 as Nt,c0 as Ir,c1 as Vr,b5 as Dt,V as Wr,b9 as kt,ad as w,ae as W,aG as jr,bu as nt,aI as St,aH as Ve,bc as qr,bd as Xr,aZ as ae,aU as vt,aY as te,K as Pt,aV as Gr,bS as Ft,c2 as Yr,T as Zr,c3 as Jr,aQ as Qr,aW as en,bC as tn,aj as rn,ak as ht}from"./index-C1d8iO7w.js";import{d as nn}from"./download-BHAnypI7.js";import{e as an,E as bt,i as on,c as ln,d as dn,g as sn,P as cn}from"./Ellipsis-5qRfXZnI.js";import{C as yt,a as un}from"./CheckboxGroup-FrEX5BwG.js";import{a as Ht,R as fn}from"./RadioGroup-3NZz9ZiU.js";const hn={...$t.props,onUnstableColumnResize:Function,pagination:{type:[Object,Boolean],default:!1},paginateSinglePage:{type:Boolean,default:!0},minHeight:[Number,String],maxHeight:[Number,String],columns:{type:Array,default:()=>[]},rowClassName:[String,Function],rowProps:Function,rowKey:Function,summary:[Function],data:{type:Array,default:()=>[]},loading:Boolean,bordered:{type:Boolean,default:void 0},bottomBordered:{type:Boolean,default:void 0},striped:Boolean,scrollX:[Number,String],defaultCheckedRowKeys:{type:Array,default:()=>[]},checkedRowKeys:Array,singleLine:{type:Boolean,default:!0},singleColumn:Boolean,size:String,remote:Boolean,defaultExpandedRowKeys:{type:Array,default:[]},defaultExpandAll:Boolean,expandedRowKeys:Array,stickyExpandedRows:Boolean,virtualScroll:Boolean,virtualScrollX:Boolean,virtualScrollHeader:Boolean,headerHeight:{type:Number,default:28},heightForRow:Function,minRowHeight:{type:Number,default:28},tableLayout:{type:String,default:"auto"},allowCheckingNotLoaded:Boolean,cascade:{type:Boolean,default:!0},childrenKey:{type:String,default:"children"},indent:{type:Number,default:16},flexHeight:Boolean,summaryPlacement:{type:String,default:"bottom"},paginationBehaviorOnFilter:{type:String,default:"current"},filterIconPopoverProps:Object,scrollbarProps:Object,renderCell:Function,renderExpandIcon:Function,spinProps:Object,getCsvCell:Function,getCsvHeader:Function,onLoad:Function,"onUpdate:page":[Function,Array],onUpdatePage:[Function,Array],"onUpdate:pageSize":[Function,Array],onUpdatePageSize:[Function,Array],"onUpdate:sorter":[Function,Array],onUpdateSorter:[Function,Array],"onUpdate:filters":[Function,Array],onUpdateFilters:[Function,Array],"onUpdate:checkedRowKeys":[Function,Array],onUpdateCheckedRowKeys:[Function,Array],"onUpdate:expandedRowKeys":[Function,Array],onUpdateExpandedRowKeys:[Function,Array],onScroll:Function,onPageChange:[Function,Array],onPageSizeChange:[Function,Array],onSorterChange:[Function,Array],onFiltersChange:[Function,Array],onCheckedRowKeysChange:[Function,Array]},Ue=_r("n-data-table"),gn=se({name:"PerformantEllipsis",props:an,inheritAttrs:!1,setup(e,{attrs:r,slots:t}){const n=X(!1),a=Kr();return $r("-ellipsis",on,a),{mouseEntered:n,renderTrigger:()=>{const{lineClamp:u}=e,y=a.value;return(()=>{const p=dt("dba02f32d69b23e6");return o(),k("span",Te(Te(r,{class:[`${y}-ellipsis`,u!==void 0?ln(y):void 0,e.expandTrigger==="click"?dn(y,"pointer"):void 0],style:u===void 0?{textOverflow:"ellipsis"}:{"-webkit-line-clamp":u}}),{onMouseenter:p[0]||(p[0]=()=>{n.value=!0})}),[u?(o(),k(fe,{key:0},[B(()=>t.default?.())],64)):(o(),k("span",{key:1},[B(()=>t.default?.())]))],16)})()}}},render(){return this.mouseEntered?Lr(bt,Te({},this.$attrs,this.$props),this.$slots):this.renderTrigger()}});function zt(e){if(e.type==="selection")return e.width===void 0?40:ft(e.width);if(e.type==="expand")return e.width===void 0?40:ft(e.width);if(!("children"in e))return typeof e.width=="string"?ft(e.width):e.width}function pn(e){if(e.type==="selection")return _e(e.width??40);if(e.type==="expand")return _e(e.width??40);if(!("children"in e))return _e(e.width)}function Me(e){return e.type==="selection"?"__n_selection__":e.type==="expand"?"__n_expand__":e.key}function Et(e){return e&&(typeof e=="object"?Object.assign({},e):e)}function mn(e){return e==="ascend"?1:e==="descend"?-1:0}function vn(e,r,t){return t!==void 0&&(e=Math.min(e,typeof t=="number"?t:Number.parseFloat(t))),r!==void 0&&(e=Math.max(e,typeof r=="number"?r:Number.parseFloat(r))),e}function bn(e,r){if(r!==void 0)return{width:r,minWidth:r,maxWidth:r};const t=pn(e),{minWidth:n,maxWidth:a}=e;return{width:t,minWidth:_e(n)||t,maxWidth:_e(a)}}function yn(e,r,t){return typeof t=="function"?t(e,r):t||""}function gt(e){return e.filterOptionValues!==void 0||e.filterOptionValue===void 0&&e.defaultFilterOptionValues!==void 0}function pt(e){return"children"in e?!1:!!e.sorter}function It(e){return"children"in e&&e.children.length?!1:!!e.resizable}function Tt(e){return"children"in e?!1:!!e.filter&&(!!e.filterOptions||!!e.renderFilterMenu)}function _t(e){if(e){if(e==="descend")return"ascend"}else return"descend";return!1}function xn(e,r){if(e.sorter===void 0)return null;const{customNextSortOrder:t}=e;return r===null||r.columnKey!==e.key?{columnKey:e.key,sorter:e.sorter,order:_t(!1)}:{...r,order:(t||_t)(r.order)}}function Vt(e,r){return r.find(t=>t.columnKey===e.key&&t.order)!==void 0}function Rn(e){return typeof e=="string"?e.replace(/,/g,"\\,"):e==null?"":`${e}`.replace(/,/g,"\\,")}function Cn(e,r,t,n){const a=e.filter(l=>l.type!=="expand"&&l.type!=="selection"&&l.allowExport!==!1);return[a.map(l=>n?n(l):l.title).join(","),...r.map(l=>a.map(u=>t?t(l[u.key],l,u):Rn(l[u.key])).join(","))].join(`
`)}var wn=se({name:"Filter",render(){return(()=>{const e=dt("32f755e984c27f19");return e[0]||(e[0]=ie("svg",{viewBox:"0 0 28 28",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},[ie("g",{stroke:"none","stroke-width":"1","fill-rule":"evenodd"},[ie("g",{"fill-rule":"nonzero"},[ie("path",{d:"M17,19 C17.5522847,19 18,19.4477153 18,20 C18,20.5522847 17.5522847,21 17,21 L11,21 C10.4477153,21 10,20.5522847 10,20 C10,19.4477153 10.4477153,19 11,19 L17,19 Z M21,13 C21.5522847,13 22,13.4477153 22,14 C22,14.5522847 21.5522847,15 21,15 L7,15 C6.44771525,15 6,14.5522847 6,14 C6,13.4477153 6.44771525,13 7,13 L21,13 Z M24,7 C24.5522847,7 25,7.44771525 25,8 C25,8.55228475 24.5522847,9 24,9 L4,9 C3.44771525,9 3,8.55228475 3,8 C3,7.44771525 3.44771525,7 4,7 L24,7 Z"})])])],-1))})()}}),kn=se({name:"DataTableFilterMenu",props:{column:{type:Object,required:!0},radioGroupName:{type:String,required:!0},multiple:{type:Boolean,required:!0},value:{type:[Array,String,Number],default:null},options:{type:Array,required:!0},onConfirm:{type:Function,required:!0},onClear:{type:Function,required:!0},onChange:{type:Function,required:!0}},setup(e){const{mergedClsPrefixRef:r,mergedRtlRef:t}=st(e),n=At("DataTable",t,r),{mergedClsPrefixRef:a,mergedThemeRef:l,localeRef:u}=Ae(Ue),y=X(e.value),p=h(()=>{const{value:d}=y;return Array.isArray(d)?d:null}),s=h(()=>{const{value:d}=y;return gt(e.column)?Array.isArray(d)&&d.length&&d[0]||null:Array.isArray(d)?null:d});function R(d){e.onChange(d)}function _(d){e.multiple&&Array.isArray(d)?y.value=d:gt(e.column)&&!Array.isArray(d)?y.value=[d]:y.value=d}function U(){R(y.value),e.onConfirm()}function c(){e.multiple||gt(e.column)?R([]):R(null),e.onClear()}return{mergedClsPrefix:a,rtlEnabled:n,mergedTheme:l,locale:u,checkboxGroupValue:p,radioGroupValue:s,handleChange:_,handleConfirmClick:U,handleClearClick:c}},render(){const{mergedTheme:e,locale:r,mergedClsPrefix:t}=this;return o(),k("div",{class:N([`${t}-data-table-filter-menu`,this.rtlEnabled&&`${t}-data-table-filter-menu--rtl`])},[it(Mt,null,{default:()=>{const{checkboxGroupValue:n,handleChange:a}=this;return this.multiple?(o(),z(un,{key:1,value:n,class:N(`${t}-data-table-filter-menu__group`),onUpdateValue:a},{default:()=>this.options.map(l=>(o(),z(yt,{key:l.value,theme:e.peers.Checkbox,themeOverrides:e.peerOverrides.Checkbox,value:l.value},{default:()=>l.label},1032,["theme","themeOverrides","value"])))},1032,["value","class","onUpdateValue"])):(o(),z(fn,{key:2,name:this.radioGroupName,class:N(`${t}-data-table-filter-menu__group`),value:this.radioGroupValue,onUpdateValue:this.handleChange},{default:()=>this.options.map(l=>(o(),z(Ht,{key:l.value,value:l.value,theme:e.peers.Radio,themeOverrides:e.peerOverrides.Radio},{default:()=>l.label},1032,["value","theme","themeOverrides"])))},1032,["name","class","value","onUpdateValue"]))}},1024),ie("div",{class:N(`${t}-data-table-filter-menu__action`)},[(o(),z(xt,{size:"tiny",theme:e.peers.Button,themeOverrides:e.peerOverrides.Button,onClick:this.handleClearClick},{default:()=>r.clear},1032,["theme","themeOverrides","onClick"])),(o(),z(xt,{theme:e.peers.Button,themeOverrides:e.peerOverrides.Button,type:"primary",size:"tiny",onClick:this.handleConfirmClick},{default:()=>r.confirm},1032,["theme","themeOverrides","onClick"]))],2)],2)}}),Sn=se({name:"DataTableRenderFilter",props:{render:{type:Function,required:!0},active:Boolean,show:Boolean},render(){const{render:e,active:r,show:t}=this;return e({active:r,show:t})}});function Pn(e,r,t){const n=Object.assign({},e);return n[r]=t,n}var Fn=se({name:"DataTableFilterButton",props:{column:{type:Object,required:!0},options:{type:Array,default:()=>[]}},setup(e){const{mergedComponentPropsRef:r}=st(),{mergedThemeRef:t,mergedClsPrefixRef:n,mergedFilterStateRef:a,filterMenuCssVarsRef:l,paginationBehaviorOnFilterRef:u,doUpdatePage:y,doUpdateFilters:p,filterIconPopoverPropsRef:s}=Ae(Ue),R=X(!1),_=a,U=h(()=>e.column.filterMultiple!==!1),c=h(()=>{const S=_.value[e.column.key];if(S===void 0){const{value:I}=U;return I?[]:null}return S}),d=h(()=>{const{value:S}=c;return Array.isArray(S)?S.length>0:S!==null}),C=h(()=>r?.value?.DataTable?.renderFilter||e.column.renderFilter);function g(S){const I=Pn(_.value,e.column.key,S);p(I,e.column),u.value==="first"&&y(1)}function D(){R.value=!1}function Z(){R.value=!1}return{mergedTheme:t,mergedClsPrefix:n,active:d,showPopover:R,mergedRenderFilter:C,filterIconPopoverProps:s,filterMultiple:U,mergedFilterValue:c,filterMenuCssVars:l,handleFilterChange:g,handleFilterMenuConfirm:Z,handleFilterMenuCancel:D}},render(){const{mergedTheme:e,mergedClsPrefix:r,handleFilterMenuCancel:t,filterIconPopoverProps:n}=this;return o(),z(Mr,Te({show:this.showPopover,onUpdateShow:a=>this.showPopover=a,trigger:"click",theme:e.peers.Popover,themeOverrides:e.peerOverrides.Popover,placement:"bottom"},n,{style:{padding:0}}),{trigger:()=>{const{mergedRenderFilter:a}=this;if(a)return o(),z(Sn,{key:1,"data-data-table-filter":!0,render:a,active:this.active,show:this.showPopover},null,8,["render","active","show"]);const{renderFilterIcon:l}=this.column;return o(),k("div",{"data-data-table-filter":!0,class:N([`${r}-data-table-filter`,{[`${r}-data-table-filter--active`]:this.active,[`${r}-data-table-filter--show`]:this.showPopover}])},[l?(o(),k(fe,{key:0},[B(()=>l({active:this.active,show:this.showPopover}))],64)):(o(),z(ct,{key:1,clsPrefix:r},{default:()=>(o(),z(wn))},1032,["clsPrefix"]))],2)},default:()=>{const{renderFilterMenu:a}=this.column;return a?a({hide:t}):(o(),z(kn,{key:2,style:Re(this.filterMenuCssVars),radioGroupName:String(this.column.key),multiple:this.filterMultiple,value:this.mergedFilterValue,options:this.options,column:this.column,onChange:this.handleFilterChange,onClear:this.handleFilterMenuCancel,onConfirm:this.handleFilterMenuConfirm},null,8,["style","radioGroupName","multiple","value","options","column","onChange","onClear","onConfirm"]))}},1040,["show","onUpdateShow","theme","themeOverrides"])}});const zn=["onMousedown"];var En=se({name:"ColumnResizeButton",props:{onResizeStart:Function,onResize:Function,onResizeEnd:Function},setup(e){const{mergedClsPrefixRef:r}=Ae(Ue),t=X(!1);let n=0;function a(p){return p.clientX}function l(p){p.preventDefault();const s=t.value;n=a(p),t.value=!0,s||(Rt("mousemove",window,u),Rt("mouseup",window,y),e.onResizeStart?.())}function u(p){e.onResize?.(a(p)-n)}function y(){t.value=!1,e.onResizeEnd?.(),ot("mousemove",window,u),ot("mouseup",window,y)}return Ar(()=>{ot("mousemove",window,u),ot("mouseup",window,y)}),{mergedClsPrefix:r,active:t,handleMousedown:l}},render(){const{mergedClsPrefix:e}=this;return o(),k("span",{"data-data-table-resizable":!0,class:N([`${e}-data-table-resize-button`,this.active&&`${e}-data-table-resize-button--active`]),onMousedown:this.handleMousedown},null,42,zn)}}),Tn=se({name:"ArrowDown",render(){return(()=>{const e=dt("bd1a1948a64f963c");return e[0]||(e[0]=ie("svg",{viewBox:"0 0 28 28",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},[ie("g",{stroke:"none","stroke-width":"1","fill-rule":"evenodd"},[ie("g",{"fill-rule":"nonzero"},[ie("path",{d:"M23.7916,15.2664 C24.0788,14.9679 24.0696,14.4931 23.7711,14.206 C23.4726,13.9188 22.9978,13.928 22.7106,14.2265 L14.7511,22.5007 L14.7511,3.74792 C14.7511,3.33371 14.4153,2.99792 14.0011,2.99792 C13.5869,2.99792 13.2511,3.33371 13.2511,3.74793 L13.2511,22.4998 L5.29259,14.2265 C5.00543,13.928 4.53064,13.9188 4.23213,14.206 C3.93361,14.4931 3.9244,14.9679 4.21157,15.2664 L13.2809,24.6944 C13.6743,25.1034 14.3289,25.1034 14.7223,24.6944 L23.7916,15.2664 Z"})])])],-1))})()}}),_n=se({name:"DataTableRenderSorter",props:{render:{type:Function,required:!0},order:{type:[String,Boolean],default:!1}},render(){const{render:e,order:r}=this;return e({order:r})}}),Ln=se({name:"SortIcon",props:{column:{type:Object,required:!0}},setup(e){const{mergedComponentPropsRef:r}=st(),{mergedSortStateRef:t,mergedClsPrefixRef:n}=Ae(Ue),a=h(()=>t.value.find(u=>u.columnKey===e.column.key)),l=h(()=>a.value!==void 0);return{mergedClsPrefix:n,active:l,mergedSortOrder:h(()=>{const{value:u}=a;return u&&l.value?u.order:!1}),mergedRenderSorter:h(()=>r?.value?.DataTable?.renderSorter||e.column.renderSorter)}},render(){const{mergedRenderSorter:e,mergedSortOrder:r,mergedClsPrefix:t}=this,{renderSorterIcon:n}=this.column;return e?(o(),z(_n,{key:1,render:e,order:r},null,8,["render","order"])):(o(),k("span",{key:2,class:N([`${t}-data-table-sorter`,r==="ascend"&&`${t}-data-table-sorter--asc`,r==="descend"&&`${t}-data-table-sorter--desc`])},[n?(o(),k(fe,{key:0},[B(()=>n({order:r}))],64)):(o(),z(ct,{key:1,clsPrefix:t},{default:()=>(o(),z(Tn))},1032,["clsPrefix"]))],2))}});const Wt="_n_all__",jt="_n_none__";function Kn(e,r,t,n){return e?a=>{for(const l of e)switch(a){case Wt:t(!0);return;case jt:n(!0);return;default:if(typeof l=="object"&&l.key===a){l.onSelect(r.value);return}}}:()=>{}}function $n(e,r){return e?e.map(t=>{switch(t){case"all":return{label:r.checkTableAll,key:Wt};case"none":return{label:r.uncheckTableAll,key:jt};default:return t}}):[]}var Mn=se({name:"DataTableSelectionMenu",props:{clsPrefix:{type:String,required:!0}},setup(e){const{props:r,localeRef:t,checkOptionsRef:n,rawPaginatedDataRef:a,doCheckAll:l,doUncheckAll:u}=Ae(Ue),y=h(()=>Kn(n.value,a,l,u)),p=h(()=>$n(n.value,t.value));return()=>{const{clsPrefix:s}=e;return o(),z(Or,{theme:r.theme?.peers?.Dropdown,themeOverrides:r.themeOverrides?.peers?.Dropdown,options:p.value,onSelect:y.value},{default:()=>(o(),z(ct,{clsPrefix:s,class:N(`${s}-data-table-check-extra`)},{default:()=>(o(),z(Ur))},1032,["clsPrefix","class"]))},1032,["theme","themeOverrides","options","onSelect"])}}});const An=["data-n-id"],Un=["colspan"],On={style:{position:"relative"}},Bn=["data-n-id"],Nn=["onScroll"];function mt(e){return typeof e.title=="function"?e.title(e):e.title}const Dn=se({props:{clsPrefix:{type:String,required:!0},id:{type:String,required:!0},cols:{type:Array,required:!0},width:String},render(){const{clsPrefix:e,id:r,cols:t,width:n}=this;return o(),k("table",{style:Re({tableLayout:"fixed",width:n}),class:N(`${e}-data-table-table`)},[ie("colgroup",null,[B(()=>t.map(a=>(o(),k("col",{key:a.key,style:Re(a.style)},null,4))))]),ie("thead",{"data-n-id":r,class:N(`${e}-data-table-thead`)},[B(()=>this.$slots.default?.())],10,An)],6)}});var qt=se({name:"DataTableHeader",props:{discrete:{type:Boolean,default:!0}},setup(){const{mergedClsPrefixRef:e,scrollXRef:r,fixedColumnLeftMapRef:t,fixedColumnRightMapRef:n,mergedCurrentPageRef:a,allRowsCheckedRef:l,someRowsCheckedRef:u,rowsRef:y,colsRef:p,mergedThemeRef:s,checkOptionsRef:R,mergedSortStateRef:_,componentId:U,mergedTableLayoutRef:c,headerCheckboxDisabledRef:d,virtualScrollHeaderRef:C,headerHeightRef:g,onUnstableColumnResize:D,doUpdateResizableWidth:Z,handleTableHeaderScroll:S,deriveNextSorter:I,doUncheckAll:P,doCheckAll:K}=Ae(Ue),V=X(),G=X({});function q(f){return G.value[f]?.getBoundingClientRect().width}function ee(){l.value?P():K()}function re(f,$){if(Ct(f,"dataTableFilter")||Ct(f,"dataTableResizable")||!pt($))return;const O=_.value.find(j=>j.columnKey===$.key)||null,E=xn($,O);I(E)}const x=new Map;function oe(f){x.set(f.key,q(f.key))}function m(f,$){const O=x.get(f.key);if(O===void 0)return;const E=O+$,j=vn(E,f.minWidth,f.maxWidth);D(E,j,f,q),Z(f,j)}return{cellElsRef:G,componentId:U,mergedSortState:_,mergedClsPrefix:e,scrollX:r,fixedColumnLeftMap:t,fixedColumnRightMap:n,currentPage:a,allRowsChecked:l,someRowsChecked:u,rows:y,cols:p,mergedTheme:s,checkOptions:R,mergedTableLayout:c,headerCheckboxDisabled:d,headerHeight:g,virtualScrollHeader:C,virtualListRef:V,handleCheckboxUpdateChecked:ee,handleColHeaderClick:re,handleTableHeaderScroll:S,handleColumnResizeStart:oe,handleColumnResize:m}},render(){const{cellElsRef:e,mergedClsPrefix:r,fixedColumnLeftMap:t,fixedColumnRightMap:n,currentPage:a,allRowsChecked:l,someRowsChecked:u,rows:y,cols:p,mergedTheme:s,checkOptions:R,componentId:_,discrete:U,mergedTableLayout:c,headerCheckboxDisabled:d,mergedSortState:C,virtualScrollHeader:g,handleColHeaderClick:D,handleCheckboxUpdateChecked:Z,handleColumnResizeStart:S,handleColumnResize:I}=this,P=(q,ee,re)=>q.map(({column:x,colIndex:oe,colSpan:m,rowSpan:f,isLast:$})=>{const O=Me(x),{ellipsis:E}=x,j=()=>x.type==="selection"?x.multiple!==!1?(o(),k(fe,{key:1},[(o(),z(yt,{key:a,privateInsideTable:!0,checked:l,indeterminate:u,disabled:d,onUpdateChecked:Z},null,8,["checked","indeterminate","disabled","onUpdateChecked"])),R?(o(),z(Mn,{key:0,clsPrefix:r},null,8,["clsPrefix"])):B(()=>null)],64)):null:(o(),k(fe,null,[ie("div",{class:N(`${r}-data-table-th__title-wrapper`)},[ie("div",{class:N(`${r}-data-table-th__title`)},[E===!0||E&&!E.tooltip?(o(),k("div",{key:0,class:N(`${r}-data-table-th__ellipsis`)},[B(()=>mt(x))],2)):(o(),k(fe,{key:1},[E&&typeof E=="object"?(o(),z(bt,Te({key:0},E,{theme:s.peers.Ellipsis,themeOverrides:s.peerOverrides.Ellipsis}),{default:()=>mt(x)},1040,["theme","themeOverrides"])):(o(),k(fe,{key:1},[B(()=>mt(x))],64))],64))],2),pt(x)?(o(),z(Ln,{key:0,column:x},null,8,["column"])):B(()=>null)],2),Tt(x)?(o(),z(Fn,{key:0,column:x,options:x.filterOptions},null,8,["column","options"])):B(()=>null),It(x)?(o(),z(En,{key:2,onResizeStart:()=>{S(x)},onResize:v=>{I(x,v)}},null,8,["onResizeStart","onResize"])):B(()=>null)],64)),le=O in t,he=O in n,i=ee&&!x.fixed?"div":"th";return o(),z(i,{ref:v=>e[O]=v,key:O,style:Re([ee&&!x.fixed?{position:"absolute",left:Ee(ee(oe)),top:0,bottom:0}:{left:Ee(t[O]?.start),right:Ee(n[O]?.start)},{width:Ee(x.width),textAlign:x.titleAlign||x.align,height:re}]),colspan:m,rowspan:f,"data-col-key":O,class:N([`${r}-data-table-th`,(le||he)&&`${r}-data-table-th--fixed-${le?"left":"right"}`,{[`${r}-data-table-th--sorting`]:Vt(x,C),[`${r}-data-table-th--filterable`]:Tt(x),[`${r}-data-table-th--sortable`]:pt(x),[`${r}-data-table-th--selection`]:x.type==="selection",[`${r}-data-table-th--last`]:$},x.className]),onClick:x.type!=="selection"&&x.type!=="expand"&&!("children"in x)?v=>{D(v,x)}:void 0},{default:Ot(()=>[B(()=>j())]),_:2},1032,["style","colspan","rowspan","data-col-key","class","onClick"])});if(g){const{headerHeight:q}=this;let ee=0,re=0;return p.forEach(x=>{x.column.fixed==="left"?ee++:x.column.fixed==="right"&&re++}),o(),z(Ut,{key:2,ref:"virtualListRef",class:N(`${r}-data-table-base-table-header`),style:Re({height:Ee(q)}),onScroll:this.handleTableHeaderScroll,columns:p,itemSize:q,showScrollbar:!1,items:[{}],itemResizable:!1,visibleItemsTag:Dn,visibleItemsProps:{clsPrefix:r,id:_,cols:p,width:_e(this.scrollX)},renderItemWithCols:({startColIndex:x,endColIndex:oe,getLeft:m})=>{const f=p.map((O,E)=>({column:O.column,isLast:E===p.length-1,colIndex:O.index,colSpan:1,rowSpan:1})).filter(({column:O},E)=>!!(x<=E&&E<=oe||O.fixed)),$=P(f,m,Ee(q));return $.splice(ee,0,(o(),k("th",{colspan:p.length-ee-re,style:{pointerEvents:"none",visibility:"hidden",height:0}},null,8,Un))),o(),k("tr",On,[B(()=>$)])}},{default:({renderedItemWithCols:x})=>x},1032,["class","style","onScroll","columns","itemSize","visibleItemsTag","visibleItemsProps","renderItemWithCols"])}const K=(o(),k("thead",{class:N(`${r}-data-table-thead`),"data-n-id":_},[B(()=>y.map(q=>(o(),k("tr",{class:N(`${r}-data-table-tr`)},[B(()=>P(q,null,void 0))],2))))],10,Bn));if(!U)return K;const{handleTableHeaderScroll:V,scrollX:G}=this;return o(),k("div",{class:N(`${r}-data-table-base-table-header`),onScroll:V},[ie("table",{class:N(`${r}-data-table-table`),style:Re({minWidth:_e(G),tableLayout:c})},[ie("colgroup",null,[B(()=>p.map(q=>(o(),k("col",{key:q.key,style:Re(q.style)},null,4))))]),B(()=>K)],6)],42,Nn)}}),Hn=se({name:"DataTableBodyCheckbox",props:{rowKey:{type:[String,Number],required:!0},disabled:{type:Boolean,required:!0},onUpdateChecked:{type:Function,required:!0}},setup(e){const{mergedCheckedRowKeySetRef:r,mergedInderminateRowKeySetRef:t}=Ae(Ue);return()=>{const{rowKey:n}=e;return o(),z(yt,{privateInsideTable:!0,disabled:e.disabled,indeterminate:t.value.has(n),checked:r.value.has(n),onUpdateChecked:e.onUpdateChecked},null,8,["disabled","indeterminate","checked","onUpdateChecked"])}}}),In=se({name:"DataTableBodyRadio",props:{rowKey:{type:[String,Number],required:!0},disabled:{type:Boolean,required:!0},onUpdateChecked:{type:Function,required:!0}},setup(e){const{mergedCheckedRowKeySetRef:r,componentId:t}=Ae(Ue);return()=>{const{rowKey:n}=e;return o(),z(Ht,{name:t,disabled:e.disabled,checked:r.value.has(n),onUpdateChecked:e.onUpdateChecked},null,8,["name","disabled","checked","onUpdateChecked"])}}}),Vn=se({name:"DataTableCell",props:{clsPrefix:{type:String,required:!0},row:{type:Object,required:!0},index:{type:Number,required:!0},column:{type:Object,required:!0},isSummary:Boolean,mergedTheme:{type:Object,required:!0},renderCell:Function},render(){const{isSummary:e,column:r,row:t,renderCell:n}=this;let a;const{render:l,key:u,ellipsis:y}=r;if(l&&!e?a=l(t,this.index):e?a=t[u]?.value:a=n?n(wt(t,u),t,r):wt(t,u),y)if(typeof y=="object"){const{mergedTheme:p}=this;return r.ellipsisComponent==="performant-ellipsis"?(o(),z(gn,Te({key:1},y,{theme:p.peers.Ellipsis,themeOverrides:p.peerOverrides.Ellipsis}),{default:()=>a},1040,["theme","themeOverrides"])):(o(),z(bt,Te({key:2},y,{theme:p.peers.Ellipsis,themeOverrides:p.peerOverrides.Ellipsis}),{default:()=>a},1040,["theme","themeOverrides"]))}else return o(),k("span",{key:3,class:N(`${this.clsPrefix}-data-table-td__ellipsis`)},[B(()=>a)],2);return a}});const Wn=["onClick"];var Lt=se({name:"DataTableExpandTrigger",props:{clsPrefix:{type:String,required:!0},expanded:Boolean,loading:Boolean,onClick:{type:Function,required:!0},renderExpandIcon:{type:Function},rowData:{type:Object,required:!0}},render(){const{clsPrefix:e}=this;return(()=>{const r=dt("82f30e69bbec5134");return o(),k("div",{class:N([`${e}-data-table-expand-trigger`,this.expanded&&`${e}-data-table-expand-trigger--expanded`]),onClick:this.onClick,onMousedown:r[0]||(r[0]=t=>{t.preventDefault()})},[it(Nr,null,{default:()=>this.loading?(o(),z(Bt,{key:"loading",clsPrefix:this.clsPrefix,radius:85,strokeWidth:15,scale:.88},null,8,["clsPrefix"])):this.renderExpandIcon?this.renderExpandIcon({expanded:this.expanded,rowData:this.rowData}):(o(),z(ct,{clsPrefix:e,key:"base-icon"},{default:()=>(o(),z(Br))},1032,["clsPrefix"]))},1024)],42,Wn)})()}});const jn=["onMouseenter","onMouseleave"],qn=["data-n-id"],Xn=["colspan"],Gn=["colspan"],Yn=["onMouseenter"],Zn=["onMouseleave"];function Jn(e,r){const t=[];function n(a,l){a.forEach(u=>{u.children&&r.has(u.key)?(t.push({tmNode:u,striped:!1,key:u.key,index:l}),n(u.children,l)):t.push({key:u.key,tmNode:u,striped:!1,index:l})})}return e.forEach(a=>{t.push(a);const{children:l}=a.tmNode;l&&r.has(a.key)&&n(l,a.index)}),t}const Qn=se({props:{clsPrefix:{type:String,required:!0},id:{type:String,required:!0},cols:{type:Array,required:!0},onMouseenter:Function,onMouseleave:Function},render(){const{clsPrefix:e,id:r,cols:t,onMouseenter:n,onMouseleave:a}=this;return o(),k("table",{style:{tableLayout:"fixed"},class:N(`${e}-data-table-table`),onMouseenter:n,onMouseleave:a},[ie("colgroup",null,[B(()=>t.map(l=>(o(),k("col",{key:l.key,style:Re(l.style)},null,4))))]),ie("tbody",{"data-n-id":r,class:N(`${e}-data-table-tbody`)},[B(()=>this.$slots.default?.())],10,qn)],42,jn)}});var ea=se({name:"DataTableBody",props:{onResize:Function,showHeader:Boolean,flexHeight:Boolean,bodyStyle:Object},setup(e){const{slots:r,bodyWidthRef:t,mergedExpandedRowKeysRef:n,mergedClsPrefixRef:a,mergedThemeRef:l,scrollXRef:u,colsRef:y,paginatedDataRef:p,rawPaginatedDataRef:s,fixedColumnLeftMapRef:R,fixedColumnRightMapRef:_,mergedCurrentPageRef:U,rowClassNameRef:c,leftActiveFixedColKeyRef:d,leftActiveFixedChildrenColKeysRef:C,rightActiveFixedColKeyRef:g,rightActiveFixedChildrenColKeysRef:D,renderExpandRef:Z,hoverKeyRef:S,summaryRef:I,mergedSortStateRef:P,virtualScrollRef:K,virtualScrollXRef:V,heightForRowRef:G,minRowHeightRef:q,componentId:ee,mergedTableLayoutRef:re,childTriggerColIndexRef:x,indentRef:oe,rowPropsRef:m,stripedRef:f,loadingRef:$,onLoadRef:O,loadingKeySetRef:E,expandableRef:j,stickyExpandedRowsRef:le,renderExpandIconRef:he,summaryPlacementRef:i,treeMateRef:v,scrollbarPropsRef:T,setHeaderScrollLeft:A,doUpdateExpandedRowKeys:ne,handleTableBodyScroll:de,doCheck:Ce,doUncheck:Se,renderCell:Le,xScrollableRef:we,explicitlyScrollableRef:Be}=Ae(Ue),me=Ae(Hr,null),Ke=X(null),Oe=X(null),F=X(null),Y=h(()=>me?.mergedComponentPropsRef.value?.DataTable?.renderEmpty),ve=Ye(()=>p.value.length===0),ue=Ye(()=>K.value&&!ve.value);let Ne="";const Ze=h(()=>new Set(n.value));function We(b){return v.value.getNode(b)?.rawNode}function be(b,L,M){const H=We(b.key);if(!H){kt("data-table",`fail to get row data with key ${b.key}`);return}if(M){const pe=p.value.findIndex(Pe=>Pe.key===Ne);if(pe!==-1){const Pe=p.value.findIndex(Fe=>Fe.key===b.key),ke=Math.min(pe,Pe),J=Math.max(pe,Pe),ce=[];p.value.slice(ke,J+1).forEach(Fe=>{Fe.disabled||ce.push(Fe.key)}),L?Ce(ce,!1,H):Se(ce,H),Ne=b.key;return}}L?Ce(b.key,!1,H):Se(b.key,H),Ne=b.key}function ye(b){const L=We(b.key);if(!L){kt("data-table",`fail to get row data with key ${b.key}`);return}Ce(b.key,!0,L)}function Je(){if(ue.value)return ge();const{value:b}=Ke;return b?b.containerRef:null}function Qe(b,L){if(E.value.has(b))return;const{value:M}=n,H=M.indexOf(b),pe=Array.from(M);~H?(pe.splice(H,1),ne(pe)):L&&!L.isLeaf&&!L.shallowLoaded?(E.value.add(b),O.value?.(L.rawNode).then(()=>{const{value:Pe}=n,ke=Array.from(Pe);~ke.indexOf(b)||ke.push(b),ne(ke)}).finally(()=>{E.value.delete(b)})):(pe.push(b),ne(pe))}function $e(){S.value=null}function ge(){const{value:b}=Oe;return b?.listElRef||null}function je(){const{value:b}=Oe;return b?.itemsElRef||null}function De(b){de(b),Ke.value?.sync()}function et(b){const{onResize:L}=e;L&&L(b),Ke.value?.sync()}const tt={getScrollContainer:Je,scrollTo(b,L){K.value?Oe.value?.scrollTo(b,L):Ke.value?.scrollTo(b,L)}},qe=Q([({props:b})=>{const L=H=>H===null?null:Q(`[data-n-id="${b.componentId}"] [data-col-key="${H}"]::after`,{boxShadow:"var(--n-box-shadow-after)"}),M=H=>H===null?null:Q(`[data-n-id="${b.componentId}"] [data-col-key="${H}"]::before`,{boxShadow:"var(--n-box-shadow-before)"});return Q([L(b.leftActiveFixedColKey),M(b.rightActiveFixedColKey),b.leftActiveFixedChildrenColKeys.map(H=>L(H)),b.rightActiveFixedChildrenColKeys.map(H=>M(H))])}]);let Xe=!1;return Nt(()=>{const{value:b}=d,{value:L}=C,{value:M}=g,{value:H}=D;if(!Xe&&b===null&&M===null)return;const pe={leftActiveFixedColKey:b,leftActiveFixedChildrenColKeys:L,rightActiveFixedColKey:M,rightActiveFixedChildrenColKeys:H,componentId:ee};qe.mount({id:`n-${ee}`,force:!0,props:pe,anchorMetaName:Ir,parent:me?.styleMountTarget}),Xe=!0}),Vr(()=>{qe.unmount({id:`n-${ee}`,parent:me?.styleMountTarget})}),{bodyWidth:t,summaryPlacement:i,dataTableSlots:r,componentId:ee,scrollbarInstRef:Ke,virtualListRef:Oe,emptyElRef:F,summary:I,mergedClsPrefix:a,mergedTheme:l,mergedRenderEmpty:Y,scrollX:u,cols:y,loading:$,shouldDisplayVirtualList:ue,empty:ve,paginatedDataAndInfo:h(()=>{const{value:b}=f;let L=!1;return{data:p.value.map(b?(M,H)=>(M.isLeaf||(L=!0),{tmNode:M,key:M.key,striped:H%2===1,index:H}):(M,H)=>(M.isLeaf||(L=!0),{tmNode:M,key:M.key,striped:!1,index:H})),hasChildren:L}}),rawPaginatedData:s,fixedColumnLeftMap:R,fixedColumnRightMap:_,currentPage:U,rowClassName:c,renderExpand:Z,mergedExpandedRowKeySet:Ze,hoverKey:S,mergedSortState:P,virtualScroll:K,virtualScrollX:V,heightForRow:G,minRowHeight:q,mergedTableLayout:re,childTriggerColIndex:x,indent:oe,rowProps:m,loadingKeySet:E,expandable:j,stickyExpandedRows:le,renderExpandIcon:he,scrollbarProps:T,setHeaderScrollLeft:A,handleVirtualListScroll:De,handleVirtualListResize:et,handleMouseleaveTable:$e,virtualListContainer:ge,virtualListContent:je,handleTableBodyScroll:de,handleCheckboxUpdateChecked:be,handleRadioUpdateChecked:ye,handleUpdateExpanded:Qe,renderCell:Le,explicitlyScrollable:Be,xScrollable:we,...tt}},render(){const{mergedTheme:e,scrollX:r,mergedClsPrefix:t,explicitlyScrollable:n,xScrollable:a,loadingKeySet:l,onResize:u,setHeaderScrollLeft:y,empty:p,shouldDisplayVirtualList:s}=this,R={minWidth:_e(r)||"100%"};r&&(R.width="100%");const _=()=>(o(),k("div",{class:N([`${t}-data-table-empty`,this.loading&&`${t}-data-table-empty--hide`]),style:Re([this.bodyStyle,a?"position: sticky; left: 0; width: var(--n-scrollbar-current-width);":void 0]),ref:"emptyElRef"},[B(()=>Dt(this.dataTableSlots.empty,()=>[this.mergedRenderEmpty?.()||(o(),z(Wr,{theme:this.mergedTheme.peers.Empty,themeOverrides:this.mergedTheme.peerOverrides.Empty},null,8,["theme","themeOverrides"]))]))],6));return o(),z(Mt,Te(this.scrollbarProps,{ref:"scrollbarInstRef",scrollable:n||a,class:`${t}-data-table-base-table-body`,style:p?void 0:this.bodyStyle,theme:e.peers.Scrollbar,themeOverrides:e.peerOverrides.Scrollbar,contentStyle:R,container:s?this.virtualListContainer:void 0,content:s?this.virtualListContent:void 0,horizontalRailStyle:{zIndex:3},verticalRailStyle:{zIndex:3},internalExposeWidthCssVar:a&&p,xScrollable:a,onScroll:s?void 0:this.handleTableBodyScroll,internalOnUpdateScrollLeft:y,onResize:u}),{default:()=>{if(this.empty&&!this.showHeader&&(this.explicitlyScrollable||this.xScrollable))return _();const U={},c={},{cols:d,paginatedDataAndInfo:C,mergedTheme:g,fixedColumnLeftMap:D,fixedColumnRightMap:Z,currentPage:S,rowClassName:I,mergedSortState:P,mergedExpandedRowKeySet:K,stickyExpandedRows:V,componentId:G,childTriggerColIndex:q,expandable:ee,rowProps:re,handleMouseleaveTable:x,renderExpand:oe,summary:m,handleCheckboxUpdateChecked:f,handleRadioUpdateChecked:$,handleUpdateExpanded:O,heightForRow:E,minRowHeight:j,virtualScrollX:le}=this,{length:he}=d;let i;const{data:v,hasChildren:T}=C,A=T?Jn(v,K):v;if(m){const F=m(this.rawPaginatedData);if(Array.isArray(F)){const Y=F.map((ve,ue)=>({isSummaryRow:!0,key:`__n_summary__${ue}`,tmNode:{rawNode:ve,disabled:!0},index:-1}));i=this.summaryPlacement==="top"?[...Y,...A]:[...A,...Y]}else{const Y={isSummaryRow:!0,key:"__n_summary__",tmNode:{rawNode:F,disabled:!0},index:-1};i=this.summaryPlacement==="top"?[Y,...A]:[...A,Y]}}else i=A;const ne=T?{width:Ee(this.indent)}:void 0,de=[];i.forEach(F=>{oe&&K.has(F.key)&&(!ee||ee(F.tmNode.rawNode))?de.push(F,{isExpandedRow:!0,key:`${F.key}-expand`,tmNode:F.tmNode,index:F.index}):de.push(F)});const{length:Ce}=de,Se={};v.forEach(({tmNode:F},Y)=>{Se[Y]=F.key});const Le=V?this.bodyWidth:null,we=Le===null?void 0:`${Le}px`,Be=this.virtualScrollX?"div":"td";let me=0,Ke=0;le&&d.forEach(F=>{F.column.fixed==="left"?me++:F.column.fixed==="right"&&Ke++});const Oe=({rowInfo:F,displayedRowIndex:Y,isVirtual:ve,isVirtualX:ue,startColIndex:Ne,endColIndex:Ze,getLeft:We})=>{const{index:be}=F;if("isExpandedRow"in F){const{tmNode:{key:b,rawNode:L}}=F;return o(),k("tr",{class:N(`${t}-data-table-tr ${t}-data-table-tr--expanded`),key:`${b}__expand`},[ie("td",{class:N([`${t}-data-table-td`,`${t}-data-table-td--last-col`,Y+1===Ce&&`${t}-data-table-td--last-row`]),colspan:he},[V?(o(),k("div",{key:0,class:N(`${t}-data-table-expand`),style:Re({width:we})},[B(()=>oe(L,be))],6)):(o(),k(fe,{key:1},[B(()=>oe(L,be))],64))],10,Xn)],2)}const ye="isSummaryRow"in F,Je=!ye&&F.striped,{tmNode:Qe,key:$e}=F,{rawNode:ge}=Qe,je=K.has($e),De=re?re(ge,be):void 0,et=typeof I=="string"?I:yn(ge,be,I),tt=ue?d.filter((b,L)=>!!(Ne<=L&&L<=Ze||b.column.fixed)):d,qe=ue?Ee(E?.(ge,be)||j):void 0,Xe=tt.map(b=>{const L=b.index;if(Y in U){const xe=U[Y],ze=xe.indexOf(L);if(~ze)return xe.splice(ze,1),null}const{column:M}=b,H=Me(b),{rowSpan:pe,colSpan:Pe}=M,ke=ye?F.tmNode.rawNode[H]?.colSpan||1:Pe?Pe(ge,be):1,J=ye?F.tmNode.rawNode[H]?.rowSpan||1:pe?pe(ge,be):1,ce=L+ke===he,Fe=Y+J===Ce,He=J>1;if(He&&(c[Y]={[L]:[]}),ke>1||He)for(let xe=Y;xe<Y+J;++xe){He&&c[Y][L].push(Se[xe]);for(let ze=L;ze<L+ke;++ze)xe===Y&&ze===L||(xe in U?U[xe].push(ze):U[xe]=[ze])}const Ge=He?this.hoverKey:null,{cellProps:rt}=M,Ie=rt?.(ge,be),at={"--indent-offset":""},ut=M.fixed?"td":Be;return o(),z(ut,Te(Ie,{key:H,style:[{textAlign:M.align||void 0,width:Ee(M.width)},ue&&{height:qe},ue&&!M.fixed?{position:"absolute",left:Ee(We(L)),top:0,bottom:0}:{left:Ee(D[H]?.start),right:Ee(Z[H]?.start)},at,Ie?.style||""],colspan:ke,rowspan:ve?void 0:J,"data-col-key":H,class:[`${t}-data-table-td`,M.className,Ie?.class,ye&&`${t}-data-table-td--summary`,Ge!==null&&c[Y][L].includes(Ge)&&`${t}-data-table-td--hover`,Vt(M,P)&&`${t}-data-table-td--sorting`,M.fixed&&`${t}-data-table-td--fixed-${M.fixed}`,M.align&&`${t}-data-table-td--${M.align}-align`,M.type==="selection"&&`${t}-data-table-td--selection`,M.type==="expand"&&`${t}-data-table-td--expand`,ce&&`${t}-data-table-td--last-col`,Fe&&`${t}-data-table-td--last-row`]}),{default:Ot(()=>[T&&L===q?(o(),k(fe,{key:0},[B(()=>[Dr(at["--indent-offset"]=ye?0:F.tmNode.level,(o(),k("div",{class:N(`${t}-data-table-indent`),style:Re(ne)},null,6))),ye||F.tmNode.isLeaf?(o(),k("div",{key:2,class:N(`${t}-data-table-expand-placeholder`)},null,2)):(o(),z(Lt,{key:3,class:N(`${t}-data-table-expand-trigger`),clsPrefix:t,expanded:je,rowData:ge,renderExpandIcon:this.renderExpandIcon,loading:l.has(F.key),onClick:()=>{O($e,F.tmNode)}},null,8,["class","clsPrefix","expanded","rowData","renderExpandIcon","loading","onClick"]))])],64)):B(()=>null),M.type==="selection"?(o(),k(fe,{key:2},[ye?B(()=>null):(o(),k(fe,{key:0},[M.multiple===!1?(o(),z(In,{key:S,rowKey:$e,disabled:F.tmNode.disabled,onUpdateChecked:()=>{$(F.tmNode)}},null,8,["rowKey","disabled","onUpdateChecked"])):(o(),z(Hn,{key:S,rowKey:$e,disabled:F.tmNode.disabled,onUpdateChecked:(xe,ze)=>{f(F.tmNode,xe,ze.shiftKey)}},null,8,["rowKey","disabled","onUpdateChecked"]))],64))],64)):(o(),k(fe,{key:3},[M.type==="expand"?(o(),k(fe,{key:0},[ye?B(()=>null):(o(),k(fe,{key:0},[!M.expandable||M.expandable?.(ge)?(o(),z(Lt,{key:0,clsPrefix:t,rowData:ge,expanded:je,renderExpandIcon:this.renderExpandIcon,onClick:()=>{O($e,null)}},null,8,["clsPrefix","rowData","expanded","renderExpandIcon","onClick"])):B(()=>null)],64))],64)):(o(),z(Vn,{key:1,clsPrefix:t,index:be,row:ge,column:M,isSummary:ye,mergedTheme:g,renderCell:this.renderCell},null,8,["clsPrefix","index","row","column","isSummary","mergedTheme","renderCell"]))],64))]),_:2},1040,["style","colspan","rowspan","data-col-key","class"])});return ue&&me&&Ke&&Xe.splice(me,0,(o(),k("td",{key:4,colspan:d.length-me-Ke,style:{pointerEvents:"none",visibility:"hidden",height:0}},null,8,Gn))),o(),k("tr",Te(De,{onMouseenter:b=>{this.hoverKey=$e,De?.onMouseenter?.(b)},key:$e,class:[`${t}-data-table-tr`,ye&&`${t}-data-table-tr--summary`,Je&&`${t}-data-table-tr--striped`,je&&`${t}-data-table-tr--expanded`,et,De?.class],style:[De?.style,ue&&{height:qe}]}),[B(()=>Xe)],16,Yn)};return this.shouldDisplayVirtualList?(o(),z(Ut,{key:6,ref:"virtualListRef",items:de,itemSize:this.minRowHeight,visibleItemsTag:Qn,visibleItemsProps:{clsPrefix:t,id:G,cols:d,onMouseleave:x},showScrollbar:!1,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemsStyle:R,itemResizable:!le,columns:d,renderItemWithCols:le?({itemIndex:F,item:Y,startColIndex:ve,endColIndex:ue,getLeft:Ne})=>Oe({displayedRowIndex:F,isVirtual:!0,isVirtualX:!0,rowInfo:Y,startColIndex:ve,endColIndex:ue,getLeft:Ne}):void 0},{default:({item:F,index:Y,renderedItemWithCols:ve})=>ve||Oe({rowInfo:F,displayedRowIndex:Y,isVirtual:!0,isVirtualX:!1,startColIndex:0,endColIndex:0,getLeft(ue){return 0}})},1032,["items","itemSize","visibleItemsTag","visibleItemsProps","onResize","onScroll","itemsStyle","itemResizable","columns","renderItemWithCols"])):(o(),k(fe,{key:5},[ie("table",{class:N(`${t}-data-table-table`),onMouseleave:x,style:Re({tableLayout:this.mergedTableLayout})},[ie("colgroup",null,[B(()=>d.map(F=>(o(),k("col",{key:F.key,style:Re(F.style)},null,4))))]),this.showHeader?(o(),z(qt,{key:0,discrete:!1})):B(()=>null),this.empty?B(()=>null):(o(),k("tbody",{key:2,"data-n-id":G,class:N(`${t}-data-table-tbody`)},[B(()=>de.map((F,Y)=>Oe({rowInfo:F,displayedRowIndex:Y,isVirtual:!1,isVirtualX:!1,startColIndex:-1,endColIndex:-1,getLeft(ve){return-1}})))],10,["data-n-id"]))],46,Zn),this.empty?(o(),k(fe,{key:0},[B(()=>_())],64)):B(()=>null)],64))}},1040,["scrollable","class","style","theme","themeOverrides","contentStyle","container","content","internalExposeWidthCssVar","xScrollable","onScroll","internalOnUpdateScrollLeft","onResize"])}}),ta=se({name:"MainTable",setup(){const{mergedClsPrefixRef:e,rightFixedColumnsRef:r,leftFixedColumnsRef:t,bodyWidthRef:n,maxHeightRef:a,minHeightRef:l,flexHeightRef:u,virtualScrollHeaderRef:y,syncScrollState:p,scrollXRef:s}=Ae(Ue),R=X(null),_=X(null),U=X(null),c=X(!(t.value.length||r.value.length)),d=h(()=>({maxHeight:_e(a.value),minHeight:_e(l.value)}));function C(S){n.value=S.contentRect.width,p("layout"),c.value||(c.value=!0)}function g(){const{value:S}=R;return S?y.value?S.virtualListRef?.listElRef||null:S.$el:null}function D(){const{value:S}=_;return S?S.getScrollContainer():null}const Z={getBodyElement:D,getHeaderElement:g,scrollTo(S,I){_.value?.scrollTo(S,I)}};return Nt(()=>{const{value:S}=U;if(!S)return;const I=`${e.value}-data-table-base-table--transition-disabled`;c.value?setTimeout(()=>{S.classList.remove(I)},0):S.classList.add(I)}),{maxHeight:a,mergedClsPrefix:e,selfElRef:U,headerInstRef:R,bodyInstRef:_,bodyStyle:d,flexHeight:u,handleBodyResize:C,scrollX:s,...Z}},render(){const{mergedClsPrefix:e,maxHeight:r,flexHeight:t}=this,n=r===void 0&&!t;return o(),k("div",{class:N(`${e}-data-table-base-table`),ref:"selfElRef"},[n?B(()=>null):(o(),z(qt,{key:1,ref:"headerInstRef"},null,512)),(o(),z(ea,{ref:"bodyInstRef",bodyStyle:this.bodyStyle,showHeader:n,flexHeight:t,onResize:this.handleBodyResize},null,8,["bodyStyle","showHeader","flexHeight","onResize"]))],2)}});const Kt=na();var ra=Q([w("data-table",`
 width: 100%;
 font-size: var(--n-font-size);
 display: flex;
 flex-direction: column;
 position: relative;
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 --n-merged-th-color-hover: var(--n-th-color-hover);
 --n-merged-th-color-sorting: var(--n-th-color-sorting);
 --n-merged-td-color-hover: var(--n-td-color-hover);
 --n-merged-td-color-sorting: var(--n-td-color-sorting);
 --n-merged-td-color-striped: var(--n-td-color-striped);
 `,[w("data-table-wrapper",`
 flex-grow: 1;
 display: flex;
 flex-direction: column;
 `),W("empty",[w("data-table-base-table",`
 height: 100%;
 display: flex;
 flex-direction: column;
 `),w("data-table-base-table-body",["height: 100%;",w("scrollbar-content",`
 height: 100%;
 display: flex;
 flex-direction: column;
 `)])]),W("flex-height",[Q(">",[w("data-table-wrapper",[Q(">",[w("data-table-base-table",`
 display: flex;
 flex-direction: column;
 flex-grow: 1;
 `,[Q(">",[w("data-table-base-table-body","flex-basis: 0;",[Q("&:last-child","flex-grow: 1;")])])])])])])]),Q(">",[w("data-table-loading-wrapper",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 transition: color .3s var(--n-bezier);
 display: flex;
 align-items: center;
 justify-content: center;
 `,[jr({originalTransform:"translateX(-50%) translateY(-50%)"})])]),w("data-table-expand-placeholder",`
 margin-right: 8px;
 display: inline-block;
 width: 16px;
 height: 1px;
 `),w("data-table-indent",`
 display: inline-block;
 height: 1px;
 `),w("data-table-expand-trigger",`
 display: inline-flex;
 margin-right: 8px;
 cursor: pointer;
 font-size: 16px;
 vertical-align: -0.2em;
 position: relative;
 width: 16px;
 height: 16px;
 color: var(--n-td-text-color);
 transition: color .3s var(--n-bezier);
 `,[W("expanded",[w("icon","transform: rotate(90deg);",[nt({originalTransform:"rotate(90deg)"})]),w("base-icon","transform: rotate(90deg);",[nt({originalTransform:"rotate(90deg)"})])]),w("base-loading",`
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `,[nt()]),w("icon",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `,[nt()]),w("base-icon",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `,[nt()])]),w("data-table-thead",`
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-merged-th-color);
 `),w("data-table-tr",`
 position: relative;
 box-sizing: border-box;
 background-clip: padding-box;
 transition: background-color .3s var(--n-bezier);
 `,[w("data-table-expand",`
 position: sticky;
 left: 0;
 overflow: hidden;
 margin: calc(var(--n-th-padding) * -1);
 padding: var(--n-th-padding);
 box-sizing: border-box;
 `),W("striped","background-color: var(--n-merged-td-color-striped);",[w("data-table-td","background-color: var(--n-merged-td-color-striped);")]),St("summary",[Q("&:hover","background-color: var(--n-merged-td-color-hover);",[Q(">",[w("data-table-td","background-color: var(--n-merged-td-color-hover);")])])])]),w("data-table-th",`
 padding: var(--n-th-padding);
 position: relative;
 text-align: start;
 box-sizing: border-box;
 background-color: var(--n-merged-th-color);
 border-color: var(--n-merged-border-color);
 border-bottom: 1px solid var(--n-merged-border-color);
 color: var(--n-th-text-color);
 transition:
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 font-weight: var(--n-th-font-weight);
 `,[W("filterable",`
 padding-right: 36px;
 `,[W("sortable",`
 padding-right: calc(var(--n-th-padding) + 36px);
 `)]),Kt,W("selection",`
 padding: 0;
 text-align: center;
 line-height: 0;
 z-index: 3;
 `),Ve("title-wrapper",`
 display: flex;
 align-items: center;
 flex-wrap: nowrap;
 max-width: 100%;
 `,[Ve("title",`
 flex: 1;
 min-width: 0;
 `)]),Ve("ellipsis",`
 display: inline-block;
 vertical-align: bottom;
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap;
 max-width: 100%;
 `),W("hover",`
 background-color: var(--n-merged-th-color-hover);
 `),W("sorting",`
 background-color: var(--n-merged-th-color-sorting);
 `),W("sortable",`
 cursor: pointer;
 `,[Ve("ellipsis",`
 max-width: calc(100% - 18px);
 `),Q("&:hover",`
 background-color: var(--n-merged-th-color-hover);
 `)]),w("data-table-sorter",`
 height: var(--n-sorter-size);
 width: var(--n-sorter-size);
 margin-left: 4px;
 position: relative;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 vertical-align: -0.2em;
 color: var(--n-th-icon-color);
 transition: color .3s var(--n-bezier);
 `,[w("base-icon","transition: transform .3s var(--n-bezier)"),W("desc",[w("base-icon",`
 transform: rotate(0deg);
 `)]),W("asc",[w("base-icon",`
 transform: rotate(-180deg);
 `)]),W("asc, desc",`
 color: var(--n-th-icon-color-active);
 `)]),w("data-table-resize-button",`
 width: var(--n-resizable-container-size);
 position: absolute;
 top: 0;
 right: calc(var(--n-resizable-container-size) / 2);
 bottom: 0;
 cursor: col-resize;
 user-select: none;
 `,[Q("&::after",`
 width: var(--n-resizable-size);
 height: 50%;
 position: absolute;
 top: 50%;
 left: calc(var(--n-resizable-container-size) / 2);
 bottom: 0;
 background-color: var(--n-merged-border-color);
 transform: translateY(-50%);
 transition: background-color .3s var(--n-bezier);
 z-index: 1;
 content: '';
 `),W("active",[Q("&::after",` 
 background-color: var(--n-th-icon-color-active);
 `)]),Q("&:hover::after",`
 background-color: var(--n-th-icon-color-active);
 `)]),w("data-table-filter",`
 position: absolute;
 z-index: auto;
 right: 0;
 width: 36px;
 top: 0;
 bottom: 0;
 cursor: pointer;
 display: flex;
 justify-content: center;
 align-items: center;
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 font-size: var(--n-filter-size);
 color: var(--n-th-icon-color);
 `,[Q("&:hover",`
 background-color: var(--n-th-button-color-hover);
 `),W("show",`
 background-color: var(--n-th-button-color-hover);
 `),W("active",`
 background-color: var(--n-th-button-color-hover);
 color: var(--n-th-icon-color-active);
 `)])]),w("data-table-td",`
 padding: var(--n-td-padding);
 text-align: start;
 box-sizing: border-box;
 border: none;
 background-color: var(--n-merged-td-color);
 color: var(--n-td-text-color);
 border-bottom: 1px solid var(--n-merged-border-color);
 transition:
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `,[W("expand",[w("data-table-expand-trigger",`
 margin-right: 0;
 `)]),W("last-row",`
 border-bottom: 0 solid var(--n-merged-border-color);
 `,[Q("&::after",`
 bottom: 0 !important;
 `),Q("&::before",`
 bottom: 0 !important;
 `)]),W("summary",`
 background-color: var(--n-merged-th-color);
 `),W("hover",`
 background-color: var(--n-merged-td-color-hover);
 `),W("sorting",`
 background-color: var(--n-merged-td-color-sorting);
 `),Ve("ellipsis",`
 display: inline-block;
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap;
 max-width: 100%;
 vertical-align: bottom;
 max-width: calc(100% - var(--indent-offset, -1.5) * 16px - 24px);
 `),W("selection, expand",`
 text-align: center;
 padding: 0;
 line-height: 0;
 `),Kt]),w("data-table-empty",`
 box-sizing: border-box;
 padding: var(--n-empty-padding);
 flex-grow: 1;
 flex-shrink: 0;
 opacity: 1;
 display: flex;
 align-items: center;
 justify-content: center;
 transition: opacity .3s var(--n-bezier);
 `,[W("hide",`
 opacity: 0;
 `)]),Ve("pagination",`
 margin: var(--n-pagination-margin);
 display: flex;
 justify-content: flex-end;
 `),w("data-table-wrapper",`
 position: relative;
 opacity: 1;
 transition: opacity .3s var(--n-bezier), border-color .3s var(--n-bezier);
 border-top-left-radius: var(--n-border-radius);
 border-top-right-radius: var(--n-border-radius);
 line-height: var(--n-line-height);
 `),W("loading",[w("data-table-wrapper",`
 opacity: var(--n-opacity-loading);
 pointer-events: none;
 `)]),W("single-column",[w("data-table-td",`
 border-bottom: 0 solid var(--n-merged-border-color);
 `,[Q("&::after, &::before",`
 bottom: 0 !important;
 `)])]),St("single-line",[w("data-table-th",`
 border-right: 1px solid var(--n-merged-border-color);
 `,[W("last",`
 border-right: 0 solid var(--n-merged-border-color);
 `)]),w("data-table-td",`
 border-right: 1px solid var(--n-merged-border-color);
 `,[W("last-col",`
 border-right: 0 solid var(--n-merged-border-color);
 `)])]),W("bordered",[w("data-table-wrapper",`
 border: 1px solid var(--n-merged-border-color);
 border-bottom-left-radius: var(--n-border-radius);
 border-bottom-right-radius: var(--n-border-radius);
 overflow: hidden;
 `)]),w("data-table-base-table",[W("transition-disabled",[w("data-table-th",[Q("&::after, &::before","transition: none;")]),w("data-table-td",[Q("&::after, &::before","transition: none;")])])]),W("bottom-bordered",[w("data-table-td",[W("last-row",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)])]),w("data-table-table",`
 font-variant-numeric: tabular-nums;
 width: 100%;
 word-break: break-word;
 transition: background-color .3s var(--n-bezier);
 border-collapse: separate;
 border-spacing: 0;
 background-color: var(--n-merged-td-color);
 `),w("data-table-base-table-header",`
 border-top-left-radius: calc(var(--n-border-radius) - 1px);
 border-top-right-radius: calc(var(--n-border-radius) - 1px);
 z-index: 3;
 overflow: scroll;
 flex-shrink: 0;
 transition: border-color .3s var(--n-bezier);
 scrollbar-width: none;
 `,[Q("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb",`
 display: none;
 width: 0;
 height: 0;
 `)]),w("data-table-check-extra",`
 transition: color .3s var(--n-bezier);
 color: var(--n-th-icon-color);
 position: absolute;
 font-size: 14px;
 right: -4px;
 top: 50%;
 transform: translateY(-50%);
 z-index: 1;
 `)]),w("data-table-filter-menu",[w("scrollbar",`
 max-height: 240px;
 `),Ve("group",`
 display: flex;
 flex-direction: column;
 padding: 12px 12px 0 12px;
 `,[w("checkbox",`
 margin-bottom: 12px;
 margin-right: 0;
 `),w("radio",`
 margin-bottom: 12px;
 margin-right: 0;
 `)]),Ve("action",`
 padding: var(--n-action-padding);
 display: flex;
 flex-wrap: nowrap;
 justify-content: space-evenly;
 border-top: 1px solid var(--n-action-divider-color);
 `,[w("button",[Q("&:not(:last-child)",`
 margin: var(--n-action-button-margin);
 `),Q("&:last-child",`
 margin-right: 0;
 `)])]),w("divider",`
 margin: 0 !important;
 `)]),qr(w("data-table",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 --n-merged-th-color-hover: var(--n-th-color-hover-modal);
 --n-merged-td-color-hover: var(--n-td-color-hover-modal);
 --n-merged-th-color-sorting: var(--n-th-color-hover-modal);
 --n-merged-td-color-sorting: var(--n-td-color-hover-modal);
 --n-merged-td-color-striped: var(--n-td-color-striped-modal);
 `)),Xr(w("data-table",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 --n-merged-th-color-hover: var(--n-th-color-hover-popover);
 --n-merged-td-color-hover: var(--n-td-color-hover-popover);
 --n-merged-th-color-sorting: var(--n-th-color-hover-popover);
 --n-merged-td-color-sorting: var(--n-td-color-hover-popover);
 --n-merged-td-color-striped: var(--n-td-color-striped-popover);
 `))]);function na(){return[W("fixed-left",`
 left: 0;
 position: sticky;
 z-index: 2;
 `,[Q("&::after",`
 pointer-events: none;
 content: "";
 width: 36px;
 display: inline-block;
 position: absolute;
 top: 0;
 bottom: -1px;
 transition: box-shadow .2s var(--n-bezier);
 right: -36px;
 `)]),W("fixed-right",`
 right: 0;
 position: sticky;
 z-index: 1;
 `,[Q("&::before",`
 pointer-events: none;
 content: "";
 width: 36px;
 display: inline-block;
 position: absolute;
 top: 0;
 bottom: -1px;
 transition: box-shadow .2s var(--n-bezier);
 left: -36px;
 `)])]}function aa(e,r){const{paginatedDataRef:t,treeMateRef:n,selectionColumnRef:a}=r,l=X(e.defaultCheckedRowKeys),u=h(()=>{const{checkedRowKeys:P}=e,K=P===void 0?l.value:P;return a.value?.multiple===!1?{checkedKeys:K.slice(0,1),indeterminateKeys:[]}:n.value.getCheckedKeys(K,{cascade:e.cascade,allowNotLoaded:e.allowCheckingNotLoaded})}),y=h(()=>u.value.checkedKeys),p=h(()=>u.value.indeterminateKeys),s=h(()=>new Set(y.value)),R=h(()=>new Set(p.value)),_=h(()=>{const{value:P}=s;return t.value.reduce((K,V)=>{const{key:G,disabled:q}=V;return K+(!q&&P.has(G)?1:0)},0)}),U=h(()=>t.value.filter(P=>P.disabled).length),c=h(()=>{const{length:P}=t.value,{value:K}=R;return _.value>0&&_.value<P-U.value||t.value.some(V=>K.has(V.key))}),d=h(()=>{const{length:P}=t.value;return _.value!==0&&_.value===P-U.value}),C=h(()=>t.value.length===0);function g(P,K,V){const{"onUpdate:checkedRowKeys":G,onUpdateCheckedRowKeys:q,onCheckedRowKeysChange:ee}=e,re=[],{value:{getNode:x}}=n;P.forEach(oe=>{const m=x(oe)?.rawNode;re.push(m)}),G&&ae(G,P,re,{row:K,action:V}),q&&ae(q,P,re,{row:K,action:V}),ee&&ae(ee,P,re,{row:K,action:V}),l.value=P}function D(P,K=!1,V){if(!e.loading){if(K){g(Array.isArray(P)?P.slice(0,1):[P],V,"check");return}g(n.value.check(P,y.value,{cascade:e.cascade,allowNotLoaded:e.allowCheckingNotLoaded}).checkedKeys,V,"check")}}function Z(P,K){e.loading||g(n.value.uncheck(P,y.value,{cascade:e.cascade,allowNotLoaded:e.allowCheckingNotLoaded}).checkedKeys,K,"uncheck")}function S(P=!1){const{value:K}=a;if(!K||e.loading)return;const V=[];(P?n.value.treeNodes:t.value).forEach(G=>{G.disabled||V.push(G.key)}),g(n.value.check(V,y.value,{cascade:!0,allowNotLoaded:e.allowCheckingNotLoaded}).checkedKeys,void 0,"checkAll")}function I(P=!1){const{value:K}=a;if(!K||e.loading)return;const V=[];(P?n.value.treeNodes:t.value).forEach(G=>{G.disabled||V.push(G.key)}),g(n.value.uncheck(V,y.value,{cascade:!0,allowNotLoaded:e.allowCheckingNotLoaded}).checkedKeys,void 0,"uncheckAll")}return{mergedCheckedRowKeySetRef:s,mergedCheckedRowKeysRef:y,mergedInderminateRowKeySetRef:R,someRowsCheckedRef:c,allRowsCheckedRef:d,headerCheckboxDisabledRef:C,doUpdateCheckedRowKeys:g,doCheckAll:S,doUncheckAll:I,doCheck:D,doUncheck:Z}}function oa(e,r){const t=Ye(()=>{for(const s of e.columns)if(s.type==="expand")return s.renderExpand}),n=Ye(()=>{let s;for(const R of e.columns)if(R.type==="expand"){s=R.expandable;break}return s}),a=X(e.defaultExpandAll?t?.value?(()=>{const s=[];return r.value.treeNodes.forEach(R=>{n.value?.(R.rawNode)&&s.push(R.key)}),s})():r.value.getNonLeafKeys():e.defaultExpandedRowKeys),l=te(e,"expandedRowKeys"),u=te(e,"stickyExpandedRows"),y=vt(l,a);function p(s){const{onUpdateExpandedRowKeys:R,"onUpdate:expandedRowKeys":_}=e;R&&ae(R,s),_&&ae(_,s),a.value=s}return{stickyExpandedRowsRef:u,mergedExpandedRowKeysRef:y,renderExpandRef:t,expandableRef:n,doUpdateExpandedRowKeys:p}}function la(e,r){const t=[],n=[],a=[],l=new WeakMap;let u=-1,y=0,p=!1,s=0;function R(U,c){c>u&&(t[c]=[],u=c),U.forEach(d=>{if("children"in d)R(d.children,c+1);else{const C="key"in d?d.key:void 0;n.push({key:Me(d),style:bn(d,C!==void 0?_e(r(C)):void 0),column:d,index:s++,width:d.width===void 0?128:Number(d.width)}),y+=1,p||(p=!!d.ellipsis),a.push(d)}})}R(e,0),s=0;function _(U,c){let d=0;U.forEach(C=>{if("children"in C){const g=s,D={column:C,colIndex:s,colSpan:0,rowSpan:1,isLast:!1};_(C.children,c+1),C.children.forEach(Z=>{D.colSpan+=l.get(Z)?.colSpan??0}),g+D.colSpan===y&&(D.isLast=!0),l.set(C,D),t[c].push(D)}else{if(s<d){s+=1;return}let g=1;"titleColSpan"in C&&(g=C.titleColSpan??1),g>1&&(d=s+g);const D=s+g===y,Z={column:C,colSpan:g,colIndex:s,rowSpan:u-c+1,isLast:D};l.set(C,Z),t[c].push(Z),s+=1}})}return _(e,0),{hasEllipsis:p,rows:t,cols:n,dataRelatedCols:a}}function ia(e,r){const t=h(()=>la(e.columns,r));return{rowsRef:h(()=>t.value.rows),colsRef:h(()=>t.value.cols),hasEllipsisRef:h(()=>t.value.hasEllipsis),dataRelatedColsRef:h(()=>t.value.dataRelatedCols)}}function da(){const e=X({});function r(a){return e.value[a]}function t(a,l){It(a)&&"key"in a&&(e.value[a.key]=l)}function n(){e.value={}}return{getResizableWidth:r,doUpdateResizableWidth:t,clearResizableWidth:n}}function sa(e,{mainTableInstRef:r,mergedCurrentPageRef:t,bodyWidthRef:n,maxHeightRef:a,mergedTableLayoutRef:l,mergedEmptyRef:u}){const y=h(()=>e.scrollX!==void 0||a.value!==void 0||e.flexHeight),p=h(()=>{const m=!y.value&&l.value==="auto";return e.scrollX!==void 0||m});let s=0;const R=X(),_=X(null),U=X([]),c=X(null),d=X([]),C=h(()=>_e(e.scrollX)),g=h(()=>e.columns.filter(m=>m.fixed==="left")),D=h(()=>e.columns.filter(m=>m.fixed==="right")),Z=h(()=>{const m={};let f=0;function $(O){O.forEach(E=>{const j={start:f,end:0};m[Me(E)]=j,"children"in E?($(E.children),j.end=f):(f+=zt(E)||0,j.end=f)})}return $(g.value),m}),S=h(()=>{const m={};let f=0;function $(O){for(let E=O.length-1;E>=0;--E){const j=O[E],le={start:f,end:0};m[Me(j)]=le,"children"in j?($(j.children),le.end=f):(f+=zt(j)||0,le.end=f)}}return $(D.value),m});function I(){const{value:m}=g;let f=0;const{value:$}=Z;let O=null;for(let E=0;E<m.length;++E){const j=Me(m[E]);if(s>($[j]?.start||0)-f)O=j,f=$[j]?.end||0;else break}_.value=O}function P(){U.value=[];let m=e.columns.find(f=>Me(f)===_.value);for(;m&&"children"in m;){const f=m.children.length;if(f===0)break;const $=m.children[f-1];U.value.push(Me($)),m=$}}function K(){const{value:m}=D,f=Number(e.scrollX),{value:$}=n;if($===null)return;let O=0,E=null;const{value:j}=S;for(let le=m.length-1;le>=0;--le){const he=Me(m[le]);if(Math.round(s+(j[he]?.start||0)+$-O)<f)E=he,O=j[he]?.end||0;else break}c.value=E}function V(){d.value=[];let m=e.columns.find(f=>Me(f)===c.value);for(;m&&"children"in m&&m.children.length;){const f=m.children[0];d.value.push(Me(f)),m=f}}function G(){return{header:r.value?r.value.getHeaderElement():null,body:r.value?r.value.getBodyElement():null}}function q(){const{body:m}=G();m&&(m.scrollTop=0)}function ee(){R.value!=="body"?Ft(x,"head"):R.value=void 0}function re(m){e.onScroll?.(m),R.value!=="head"?Ft(x,"body"):R.value=void 0}function x(m){const{header:f,body:$}=G();if(!$)return;if(m==="layout")f&&(f.scrollLeft=s),$.scrollLeft=s;else if(f)if(m==="head")s=f.scrollLeft,$.scrollLeft=s,R.value="head";else if(m==="body")s=$.scrollLeft,f.scrollLeft=s,R.value="body";else{const E=s-f.scrollLeft;R.value=E!==0?"head":"body",R.value==="head"?(s=f.scrollLeft,$.scrollLeft=s):(s=$.scrollLeft,f.scrollLeft=s)}else m!=="head"&&(s=$.scrollLeft);const{value:O}=n;O!==null&&(I(),P(),K(),V())}function oe(m){const{header:f}=G();f&&(f.scrollLeft=m,s=m,x("head"))}return Pt(t,()=>{q()}),Pt([()=>e.virtualScroll,u],()=>{Gr(()=>{x("layout")})}),{styleScrollXRef:C,fixedColumnLeftMapRef:Z,fixedColumnRightMapRef:S,leftFixedColumnsRef:g,rightFixedColumnsRef:D,leftActiveFixedColKeyRef:_,leftActiveFixedChildrenColKeysRef:U,rightActiveFixedColKeyRef:c,rightActiveFixedChildrenColKeysRef:d,syncScrollState:x,handleTableBodyScroll:re,handleTableHeaderScroll:ee,setHeaderScrollLeft:oe,explicitlyScrollableRef:y,xScrollableRef:p}}function lt(e){return typeof e=="object"&&typeof e.multiple=="number"?e.multiple:!1}function ca(e,r){return r&&(e===void 0||e==="default"||typeof e=="object"&&e.compare==="default")?ua(r):typeof e=="function"?e:e&&typeof e=="object"&&e.compare&&e.compare!=="default"?e.compare:!1}function ua(e){return(r,t)=>{const n=r[e],a=t[e];return n==null?a==null?0:-1:a==null?1:typeof n=="number"&&typeof a=="number"?n-a:typeof n=="string"&&typeof a=="string"?n.localeCompare(a):0}}function fa(e,{dataRelatedColsRef:r,filteredDataRef:t}){const n=[];r.value.forEach(c=>{c.sorter!==void 0&&U(n,{columnKey:c.key,sorter:c.sorter,order:c.defaultSortOrder??!1})});const a=X(n),l=h(()=>{const c=r.value.filter(g=>g.type!=="selection"&&g.sorter!==void 0&&(g.sortOrder==="ascend"||g.sortOrder==="descend"||g.sortOrder===!1)),d=c.filter(g=>g.sortOrder!==!1);if(d.length)return d.map(g=>({columnKey:g.key,order:g.sortOrder,sorter:g.sorter}));if(c.length)return[];const{value:C}=a;return Array.isArray(C)?C:C?[C]:[]}),u=h(()=>{const c=l.value.slice().sort((d,C)=>{const g=lt(d.sorter)||0;return(lt(C.sorter)||0)-g});return c.length?t.value.slice().sort((d,C)=>{let g=0;return c.some(D=>{const{columnKey:Z,sorter:S,order:I}=D,P=ca(S,Z);return P&&I&&(g=P(d.rawNode,C.rawNode),g!==0)?(g=g*mn(I),!0):!1}),g}):t.value});function y(c){let d=l.value.slice();return c&&lt(c.sorter)!==!1?(d=d.filter(C=>lt(C.sorter)!==!1),U(d,c),d):c||null}function p(c){s(y(c))}function s(c){const{"onUpdate:sorter":d,onUpdateSorter:C,onSorterChange:g}=e;d&&ae(d,c),C&&ae(C,c),g&&ae(g,c),a.value=c}function R(c,d="ascend"){if(!c)_();else{const C=r.value.find(D=>D.type!=="selection"&&D.type!=="expand"&&D.key===c);if(!C?.sorter)return;const g=C.sorter;p({columnKey:c,sorter:g,order:d})}}function _(){s(null)}function U(c,d){const C=c.findIndex(g=>d?.columnKey&&g.columnKey===d.columnKey);C!==void 0&&C>=0?c[C]=d:c.push(d)}return{clearSorter:_,sort:R,sortedDataRef:u,mergedSortStateRef:l,deriveNextSorter:p}}function ha(e,{dataRelatedColsRef:r}){const t=h(()=>{const i=v=>{for(let T=0;T<v.length;++T){const A=v[T];if("children"in A)return i(A.children);if(A.type==="selection")return A}return null};return i(e.columns)}),n=h(()=>{const{childrenKey:i}=e;return Yr(e.data,{ignoreEmptyChildren:!0,getKey:e.rowKey,getChildren:v=>v[i],getDisabled:v=>!!t.value?.disabled?.(v)})}),a=Ye(()=>{const{columns:i}=e,{length:v}=i;let T=null;for(let A=0;A<v;++A){const ne=i[A];if(!ne.type&&T===null&&(T=A),"tree"in ne&&ne.tree)return A}return T||0}),l=X({}),{pagination:u}=e,y=X(u&&u.defaultPage||1),p=X(sn(u)),s=h(()=>{const i=r.value.filter(T=>T.filterOptionValues!==void 0||T.filterOptionValue!==void 0),v={};return i.forEach(T=>{T.type==="selection"||T.type==="expand"||(T.filterOptionValues===void 0?v[T.key]=T.filterOptionValue??null:v[T.key]=T.filterOptionValues)}),Object.assign(Et(l.value),v)}),R=h(()=>{const i=s.value,{columns:v}=e;function T(de){return(Ce,Se)=>!!~String(Se[de]).indexOf(String(Ce))}const{value:{treeNodes:A}}=n,ne=[];return v.forEach(de=>{de.type==="selection"||de.type==="expand"||"children"in de||ne.push([de.key,de])}),A?A.filter(de=>{const{rawNode:Ce}=de;for(const[Se,Le]of ne){let we=i[Se];if(we==null||(Array.isArray(we)||(we=[we]),!we.length))continue;const Be=Le.filter==="default"?T(Se):Le.filter;if(Le&&typeof Be=="function")if(Le.filterMode==="and"){if(we.some(me=>!Be(me,Ce)))return!1}else{if(we.some(me=>Be(me,Ce)))continue;return!1}}return!0}):[]}),{sortedDataRef:_,deriveNextSorter:U,mergedSortStateRef:c,sort:d,clearSorter:C}=fa(e,{dataRelatedColsRef:r,filteredDataRef:R});r.value.forEach(i=>{if(i.filter){const v=i.defaultFilterOptionValues;i.filterMultiple?l.value[i.key]=v||[]:v!==void 0?l.value[i.key]=v===null?[]:v:l.value[i.key]=i.defaultFilterOptionValue??null}});const g=h(()=>{const{pagination:i}=e;if(i!==!1)return i.page}),D=h(()=>{const{pagination:i}=e;if(i!==!1)return i.pageSize}),Z=vt(g,y),S=vt(D,p),I=Ye(()=>{const i=Z.value;return e.remote?i:Math.max(1,Math.min(Math.ceil(R.value.length/S.value),i))}),P=h(()=>{const{pagination:i}=e;if(i){const{pageCount:v}=i;if(v!==void 0)return v}}),K=h(()=>{if(e.remote)return n.value.treeNodes;if(!e.pagination)return _.value;const i=S.value,v=(I.value-1)*i;return _.value.slice(v,v+i)}),V=h(()=>K.value.map(i=>i.rawNode)),G=h(()=>_.value.map(i=>i.rawNode));function q(i){const{pagination:v}=e;if(v){const{onChange:T,"onUpdate:page":A,onUpdatePage:ne}=v;T&&ae(T,i),ne&&ae(ne,i),A&&ae(A,i),oe(i)}}function ee(i){const{pagination:v}=e;if(v){const{onPageSizeChange:T,"onUpdate:pageSize":A,onUpdatePageSize:ne}=v;T&&ae(T,i),ne&&ae(ne,i),A&&ae(A,i),m(i)}}const re=h(()=>{if(e.remote){const{pagination:i}=e;if(i){const{itemCount:v}=i;if(v!==void 0)return v}return}return R.value.length}),x=h(()=>({...e.pagination,onChange:void 0,onUpdatePage:void 0,onUpdatePageSize:void 0,onPageSizeChange:void 0,"onUpdate:page":q,"onUpdate:pageSize":ee,page:I.value,pageSize:S.value,pageCount:re.value===void 0?P.value:void 0,itemCount:re.value}));function oe(i){const{"onUpdate:page":v,onPageChange:T,onUpdatePage:A}=e;A&&ae(A,i),v&&ae(v,i),T&&ae(T,i),y.value=i}function m(i){const{"onUpdate:pageSize":v,onPageSizeChange:T,onUpdatePageSize:A}=e;T&&ae(T,i),A&&ae(A,i),v&&ae(v,i),p.value=i}function f(i,v){const{onUpdateFilters:T,"onUpdate:filters":A,onFiltersChange:ne}=e;T&&ae(T,i,v),A&&ae(A,i,v),ne&&ae(ne,i,v),l.value=i}function $(i,v,T,A){e.onUnstableColumnResize?.(i,v,T,A)}function O(i){oe(i)}function E(){j()}function j(){le({})}function le(i){he(i)}function he(i){i?i&&(l.value=Et(i)):l.value={}}return{treeMateRef:n,mergedCurrentPageRef:I,mergedPaginationRef:x,paginatedDataRef:K,rawPaginatedDataRef:V,rawSortedDataRef:G,mergedFilterStateRef:s,mergedSortStateRef:c,hoverKeyRef:X(null),selectionColumnRef:t,childTriggerColIndexRef:a,doUpdateFilters:f,deriveNextSorter:U,doUpdatePageSize:m,doUpdatePage:oe,onUnstableColumnResize:$,filter:he,filters:le,clearFilter:E,clearFilters:j,clearSorter:C,page:O,sort:d}}var ya=se({name:"DataTable",alias:["AdvancedTable"],props:hn,slots:Object,setup(e,{slots:r}){const{mergedBorderedRef:t,mergedClsPrefixRef:n,inlineThemeDisabled:a,mergedRtlRef:l,mergedComponentPropsRef:u}=st(e),y=At("DataTable",l,n),p=h(()=>e.size||u?.value?.DataTable?.size||"medium"),s=h(()=>{const{bottomBordered:J}=e;return t.value?!1:J!==void 0?J:!0}),R=$t("DataTable","-data-table",ra,Jr,e,n),_=X(null),U=X(null),{getResizableWidth:c,clearResizableWidth:d,doUpdateResizableWidth:C}=da(),{rowsRef:g,colsRef:D,dataRelatedColsRef:Z,hasEllipsisRef:S}=ia(e,c),{treeMateRef:I,mergedCurrentPageRef:P,paginatedDataRef:K,rawPaginatedDataRef:V,rawSortedDataRef:G,selectionColumnRef:q,hoverKeyRef:ee,mergedPaginationRef:re,mergedFilterStateRef:x,mergedSortStateRef:oe,childTriggerColIndexRef:m,doUpdatePage:f,doUpdateFilters:$,onUnstableColumnResize:O,deriveNextSorter:E,filter:j,filters:le,clearFilter:he,clearFilters:i,clearSorter:v,page:T,sort:A}=ha(e,{dataRelatedColsRef:Z}),ne=h(()=>K.value.length===0),de=J=>{const{fileName:ce="data.csv",keepOriginalData:Fe=!1}=J||{},He=Fe?e.data:V.value,Ge=Cn(e.columns,He,e.getCsvCell,e.getCsvHeader),rt=new Blob([Ge],{type:"text/csv;charset=utf-8"}),Ie=URL.createObjectURL(rt);nn(Ie,ce.endsWith(".csv")?ce:`${ce}.csv`),URL.revokeObjectURL(Ie)},{doCheckAll:Ce,doUncheckAll:Se,doCheck:Le,doUncheck:we,headerCheckboxDisabledRef:Be,someRowsCheckedRef:me,allRowsCheckedRef:Ke,mergedCheckedRowKeySetRef:Oe,mergedInderminateRowKeySetRef:F}=aa(e,{selectionColumnRef:q,treeMateRef:I,paginatedDataRef:K}),{stickyExpandedRowsRef:Y,mergedExpandedRowKeysRef:ve,renderExpandRef:ue,expandableRef:Ne,doUpdateExpandedRowKeys:Ze}=oa(e,I),We=te(e,"maxHeight"),be=h(()=>e.virtualScroll||e.flexHeight||e.maxHeight!==void 0||S.value?"fixed":e.tableLayout),{handleTableBodyScroll:ye,handleTableHeaderScroll:Je,syncScrollState:Qe,setHeaderScrollLeft:$e,leftActiveFixedColKeyRef:ge,leftActiveFixedChildrenColKeysRef:je,rightActiveFixedColKeyRef:De,rightActiveFixedChildrenColKeysRef:et,leftFixedColumnsRef:tt,rightFixedColumnsRef:qe,fixedColumnLeftMapRef:Xe,fixedColumnRightMapRef:b,xScrollableRef:L,explicitlyScrollableRef:M}=sa(e,{bodyWidthRef:_,mainTableInstRef:U,mergedCurrentPageRef:P,maxHeightRef:We,mergedTableLayoutRef:be,mergedEmptyRef:ne}),{localeRef:H}=Qr("DataTable");en(Ue,{xScrollableRef:L,explicitlyScrollableRef:M,props:e,treeMateRef:I,renderExpandIconRef:te(e,"renderExpandIcon"),loadingKeySetRef:X(new Set),slots:r,indentRef:te(e,"indent"),childTriggerColIndexRef:m,bodyWidthRef:_,componentId:tn(),hoverKeyRef:ee,mergedClsPrefixRef:n,mergedThemeRef:R,scrollXRef:h(()=>e.scrollX),rowsRef:g,colsRef:D,paginatedDataRef:K,leftActiveFixedColKeyRef:ge,leftActiveFixedChildrenColKeysRef:je,rightActiveFixedColKeyRef:De,rightActiveFixedChildrenColKeysRef:et,leftFixedColumnsRef:tt,rightFixedColumnsRef:qe,fixedColumnLeftMapRef:Xe,fixedColumnRightMapRef:b,mergedCurrentPageRef:P,someRowsCheckedRef:me,allRowsCheckedRef:Ke,mergedSortStateRef:oe,mergedFilterStateRef:x,loadingRef:te(e,"loading"),rowClassNameRef:te(e,"rowClassName"),mergedCheckedRowKeySetRef:Oe,mergedExpandedRowKeysRef:ve,mergedInderminateRowKeySetRef:F,localeRef:H,expandableRef:Ne,stickyExpandedRowsRef:Y,rowKeyRef:te(e,"rowKey"),renderExpandRef:ue,summaryRef:te(e,"summary"),virtualScrollRef:te(e,"virtualScroll"),virtualScrollXRef:te(e,"virtualScrollX"),heightForRowRef:te(e,"heightForRow"),minRowHeightRef:te(e,"minRowHeight"),virtualScrollHeaderRef:te(e,"virtualScrollHeader"),headerHeightRef:te(e,"headerHeight"),rowPropsRef:te(e,"rowProps"),stripedRef:te(e,"striped"),checkOptionsRef:h(()=>{const{value:J}=q;return J?.options}),rawPaginatedDataRef:V,filterMenuCssVarsRef:h(()=>{const{self:{actionDividerColor:J,actionPadding:ce,actionButtonMargin:Fe}}=R.value;return{"--n-action-padding":ce,"--n-action-button-margin":Fe,"--n-action-divider-color":J}}),onLoadRef:te(e,"onLoad"),mergedTableLayoutRef:be,maxHeightRef:We,minHeightRef:te(e,"minHeight"),flexHeightRef:te(e,"flexHeight"),headerCheckboxDisabledRef:Be,paginationBehaviorOnFilterRef:te(e,"paginationBehaviorOnFilter"),summaryPlacementRef:te(e,"summaryPlacement"),filterIconPopoverPropsRef:te(e,"filterIconPopoverProps"),scrollbarPropsRef:te(e,"scrollbarProps"),syncScrollState:Qe,doUpdatePage:f,doUpdateFilters:$,getResizableWidth:c,onUnstableColumnResize:O,clearResizableWidth:d,doUpdateResizableWidth:C,deriveNextSorter:E,doCheck:Le,doUncheck:we,doCheckAll:Ce,doUncheckAll:Se,doUpdateExpandedRowKeys:Ze,handleTableHeaderScroll:Je,handleTableBodyScroll:ye,setHeaderScrollLeft:$e,renderCell:te(e,"renderCell")});const pe={filter:j,filters:le,clearFilters:i,clearSorter:v,page:T,sort:A,clearFilter:he,downloadCsv:de,scrollTo:(J,ce)=>{U.value?.scrollTo(J,ce)},getFilteredAndSortedData:()=>G.value,getCurrentPageData:()=>V.value},Pe=h(()=>{const J=p.value,{common:{cubicBezierEaseInOut:ce},self:{borderColor:Fe,tdColorHover:He,tdColorSorting:Ge,tdColorSortingModal:rt,tdColorSortingPopover:Ie,thColorSorting:at,thColorSortingModal:ut,thColorSortingPopover:xe,thColor:ze,thColorHover:Xt,tdColor:Gt,tdTextColor:Yt,thTextColor:Zt,thFontWeight:Jt,thButtonColorHover:Qt,thIconColor:er,thIconColorActive:tr,filterSize:rr,borderRadius:nr,lineHeight:ar,tdColorModal:or,thColorModal:lr,borderColorModal:ir,thColorHoverModal:dr,tdColorHoverModal:sr,borderColorPopover:cr,thColorPopover:ur,tdColorPopover:fr,tdColorHoverPopover:hr,thColorHoverPopover:gr,paginationMargin:pr,emptyPadding:mr,boxShadowAfter:vr,boxShadowBefore:br,sorterSize:yr,resizableContainerSize:xr,resizableSize:Rr,loadingColor:Cr,loadingSize:wr,opacityLoading:kr,tdColorStriped:Sr,tdColorStripedModal:Pr,tdColorStripedPopover:Fr,[ht("fontSize",J)]:zr,[ht("thPadding",J)]:Er,[ht("tdPadding",J)]:Tr}}=R.value;return{"--n-font-size":zr,"--n-th-padding":Er,"--n-td-padding":Tr,"--n-bezier":ce,"--n-border-radius":nr,"--n-line-height":ar,"--n-border-color":Fe,"--n-border-color-modal":ir,"--n-border-color-popover":cr,"--n-th-color":ze,"--n-th-color-hover":Xt,"--n-th-color-modal":lr,"--n-th-color-hover-modal":dr,"--n-th-color-popover":ur,"--n-th-color-hover-popover":gr,"--n-td-color":Gt,"--n-td-color-hover":He,"--n-td-color-modal":or,"--n-td-color-hover-modal":sr,"--n-td-color-popover":fr,"--n-td-color-hover-popover":hr,"--n-th-text-color":Zt,"--n-td-text-color":Yt,"--n-th-font-weight":Jt,"--n-th-button-color-hover":Qt,"--n-th-icon-color":er,"--n-th-icon-color-active":tr,"--n-filter-size":rr,"--n-pagination-margin":pr,"--n-empty-padding":mr,"--n-box-shadow-before":br,"--n-box-shadow-after":vr,"--n-sorter-size":yr,"--n-resizable-container-size":xr,"--n-resizable-size":Rr,"--n-loading-size":wr,"--n-loading-color":Cr,"--n-opacity-loading":kr,"--n-td-color-striped":Sr,"--n-td-color-striped-modal":Pr,"--n-td-color-striped-popover":Fr,"--n-td-color-sorting":Ge,"--n-td-color-sorting-modal":rt,"--n-td-color-sorting-popover":Ie,"--n-th-color-sorting":at,"--n-th-color-sorting-modal":ut,"--n-th-color-sorting-popover":xe}}),ke=a?rn("data-table",h(()=>p.value[0]),Pe,e):void 0;return{mainTableInstRef:U,mergedClsPrefix:n,rtlEnabled:y,mergedTheme:R,paginatedData:K,mergedBordered:t,mergedBottomBordered:s,mergedPagination:re,mergedShowPagination:h(()=>{if(!e.pagination)return!1;if(e.paginateSinglePage)return!0;const J=re.value,{pageCount:ce}=J;return ce!==void 0?ce>1:J.itemCount&&J.pageSize&&J.itemCount>J.pageSize}),cssVars:a?void 0:Pe,themeClass:ke?.themeClass,onRender:ke?.onRender,mergedEmpty:ne,...pe}},render(){const{mergedClsPrefix:e,themeClass:r,onRender:t,$slots:n,spinProps:a}=this;return t?.(),o(),k("div",{class:N([`${e}-data-table`,this.rtlEnabled&&`${e}-data-table--rtl`,r,{[`${e}-data-table--bordered`]:this.mergedBordered,[`${e}-data-table--bottom-bordered`]:this.mergedBottomBordered,[`${e}-data-table--single-line`]:this.singleLine,[`${e}-data-table--single-column`]:this.singleColumn,[`${e}-data-table--loading`]:this.loading,[`${e}-data-table--flex-height`]:this.flexHeight,[`${e}-data-table--empty`]:this.mergedEmpty}]),style:Re(this.cssVars)},[ie("div",{class:N(`${e}-data-table-wrapper`)},[it(ta,{ref:"mainTableInstRef"},null,512)],2),this.mergedShowPagination?(o(),k("div",{key:0,class:N(`${e}-data-table__pagination`)},[(o(),z(cn,Te({theme:this.mergedTheme.peers.Pagination,themeOverrides:this.mergedTheme.peerOverrides.Pagination,disabled:this.loading},this.mergedPagination),null,16,["theme","themeOverrides","disabled"]))],2)):B(()=>null),it(Zr,{name:"fade-in-scale-up-transition"},{default:()=>this.loading?(o(),k("div",{key:1,class:N(`${e}-data-table-loading-wrapper`)},[B(()=>Dt(n.loading,()=>[(o(),z(Bt,Te({clsPrefix:e,strokeWidth:20},a),null,16,["clsPrefix"]))]))],2)):null},1024)],6)}});export{ya as D};
