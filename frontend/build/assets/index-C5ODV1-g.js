import{A as ce}from"./Alert-DiyoZdjP.js";import{ae as d,af as M,ad as I,aH as H,bu as L,aI as te,d as ee,ag as de,o as u,c as y,a5 as b,be as fe,bf as me,a4 as k,ai as pe,bv as ve,bw as be,aW as he,aB as ge,b2 as ae,a as l,e as o,b as E,b5 as Q,bx as ye,a6 as se,by as xe,bz as we,O as W,R as Ce,aF as ke,aC as ze,ak as Ie,N as F,aZ as oe,aY as re,al as P,n as Pe,k as Se,p as $e,q as Ne,w as n,u as a,g as w,I as _,S as ne,l as le,t as q,B as Y,h as A,H as Te,j as Ue}from"./index-DUI5DuVi.js";import{a as Re,C as K}from"./CheckboxGroup-CROcwKc-.js";import{R as Z}from"./RadioButton-EwbjZbW-.js";import{R as Be}from"./RadioGroup-L12jYpxm.js";import{a as g,F as ie}from"./FormItem-XySj4L2A.js";import{I as J}from"./InputNumber-CrIvO9fs.js";import{h as _e,c as Ae,t as Ke}from"./channels-C8Kp1FaA.js";import{c as Ee,a as Fe}from"./presets-CJ77uZWA.js";import{f as Ge}from"./processors-Df7v6wFF.js";import{f as Oe}from"./toolGroup-XwBXgOJW.js";import{f as je,s as De}from"./config-CEFodxtq.js";import"./pagination-DH5ltoJM.js";var Ve=d("steps",`
 width: 100%;
 display: flex;
`,[d("step",`
 position: relative;
 display: flex;
 flex: 1;
 `,[M("disabled","cursor: not-allowed"),M("clickable",`
 cursor: pointer;
 `),I("&:last-child",[d("step-splitor","display: none;")])]),d("step-splitor",`
 background-color: var(--n-splitor-color);
 margin-top: calc(var(--n-step-header-font-size) / 2);
 height: 1px;
 flex: 1;
 align-self: flex-start;
 margin-left: 12px;
 margin-right: 12px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),d("step-content","flex: 1;",[d("step-content-header",`
 color: var(--n-header-text-color);
 margin-top: calc(var(--n-indicator-size) / 2 - var(--n-step-header-font-size) / 2);
 line-height: var(--n-step-header-font-size);
 font-size: var(--n-step-header-font-size);
 position: relative;
 display: flex;
 font-weight: var(--n-step-header-font-weight);
 margin-left: 9px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `,[H("title",`
 white-space: nowrap;
 flex: 0;
 `)]),H("description",`
 color: var(--n-description-text-color);
 margin-top: 12px;
 margin-left: 9px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),d("step-indicator",`
 background-color: var(--n-indicator-color);
 box-shadow: 0 0 0 1px var(--n-indicator-border-color);
 height: var(--n-indicator-size);
 width: var(--n-indicator-size);
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[d("step-indicator-slot",`
 position: relative;
 width: var(--n-indicator-icon-size);
 height: var(--n-indicator-icon-size);
 font-size: var(--n-indicator-icon-size);
 line-height: var(--n-indicator-icon-size);
 `,[H("index",`
 display: inline-block;
 text-align: center;
 position: absolute;
 left: 0;
 top: 0;
 white-space: nowrap;
 font-size: var(--n-indicator-index-font-size);
 width: var(--n-indicator-icon-size);
 height: var(--n-indicator-icon-size);
 line-height: var(--n-indicator-icon-size);
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[L()]),d("icon",`
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[L()]),d("base-icon",`
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[L()])])]),M("vertical","flex-direction: column;",[te("show-description",[I(">",[d("step","padding-bottom: 8px;")])]),I(">",[d("step","margin-bottom: 16px;",[I("&:last-child","margin-bottom: 0;"),I(">",[d("step-indicator",[I(">",[d("step-splitor",`
 position: absolute;
 bottom: -8px;
 width: 1px;
 margin: 0 !important;
 left: calc(var(--n-indicator-size) / 2);
 height: calc(100% - var(--n-indicator-size));
 `)])]),d("step-content",[H("description","margin-top: 8px;")])])])])]),M("content-bottom",[te("vertical",[I(">",[d("step","flex-direction: column",[I(">",[d("step-line","display: flex;",[I(">",[d("step-splitor",`
 margin-top: 0;
 align-self: center;
 `)])])]),I(">",[d("step-content","margin-top: calc(var(--n-indicator-size) / 2 - var(--n-step-header-font-size) / 2);",[d("step-content-header",`
 margin-left: 0;
 `),d("step-content__description",`
 margin-left: 0;
 `)])])])])])])]);function Me(r,h){return typeof r!="object"||r===null||Array.isArray(r)?null:(r.props||(r.props={}),r.props.internalIndex=h+1,r)}function He(r){return r.map((h,v)=>Me(h,v))}const We={...de.props,current:Number,status:{type:String,default:"process"},size:{type:String,default:"medium"},vertical:Boolean,contentPlacement:{type:String,default:"right"},"onUpdate:current":[Function,Array],onUpdateCurrent:[Function,Array]},ue=ge("n-steps");var qe=ee({name:"Steps",props:We,slots:Object,setup(r,{slots:h}){const{mergedClsPrefixRef:v,mergedRtlRef:f}=pe(r),C=ve("Steps",f,v),x=de("Steps","-steps",Ve,be,r,v);return he(ue,{props:r,mergedThemeRef:x,mergedClsPrefixRef:v,stepsSlots:h}),{mergedClsPrefix:v,rtlEnabled:C}},render(){const{mergedClsPrefix:r}=this;return u(),y("div",{class:k([`${r}-steps`,this.rtlEnabled&&`${r}-steps--rtl`,this.vertical&&`${r}-steps--vertical`,this.contentPlacement==="bottom"&&`${r}-steps--content-bottom`])},[b(()=>He(fe(me(this))))],2)}});const Le=["onClick"],Qe={status:String,title:String,description:String,disabled:Boolean,internalIndex:{type:Number,default:0}};var X=ee({name:"Step",props:Qe,slots:Object,setup(r){const h=ke(ue,null);h||ze("step","`n-step` must be placed inside `n-steps`.");const{inlineThemeDisabled:v}=pe(),{props:f,mergedThemeRef:C,mergedClsPrefixRef:x,stepsSlots:R}=h,S=re(f,"vertical"),$=re(f,"contentPlacement"),N=F(()=>{const{status:i}=r;if(i)return i;{const{internalIndex:p}=r,{current:B}=f;if(B===void 0)return"process";if(p<B)return"finish";if(p===B)return f.status||"process";if(p>B)return"wait"}return"process"}),e=F(()=>{const{value:i}=N,{size:p}=f,{common:{cubicBezierEaseInOut:B},self:{stepHeaderFontWeight:c,[P("stepHeaderFontSize",p)]:t,[P("indicatorIndexFontSize",p)]:s,[P("indicatorSize",p)]:m,[P("indicatorIconSize",p)]:G,[P("indicatorTextColor",i)]:O,[P("indicatorBorderColor",i)]:D,[P("headerTextColor",i)]:j,[P("splitorColor",i)]:T,[P("indicatorColor",i)]:U,[P("descriptionTextColor",i)]:V}}=C.value;return{"--n-bezier":B,"--n-description-text-color":V,"--n-header-text-color":j,"--n-indicator-border-color":D,"--n-indicator-color":U,"--n-indicator-icon-size":G,"--n-indicator-index-font-size":s,"--n-indicator-size":m,"--n-indicator-text-color":O,"--n-splitor-color":T,"--n-step-header-font-size":t,"--n-step-header-font-weight":c}}),z=v?Ie("step",F(()=>{const{value:i}=N,{size:p}=f;return`${i[0]}${p[0]}`}),e,f):void 0;return{stepsSlots:R,mergedClsPrefix:x,vertical:S,mergedStatus:N,handleStepClick:F(()=>{if(r.disabled)return;const{onUpdateCurrent:i,"onUpdate:current":p}=f;return i||p?()=>{i&&oe(i,r.internalIndex),p&&oe(p,r.internalIndex)}:void 0}),cssVars:v?void 0:e,themeClass:z?.themeClass,onRender:z?.onRender,contentPlacement:$}},render(){const{mergedClsPrefix:r,onRender:h,handleStepClick:v,disabled:f,contentPlacement:C,vertical:x}=this,R=ae(this.$slots.default,z=>{const i=z||this.description;return i?(u(),y("div",{key:1,class:k(`${r}-step-content__description`)},[b(()=>i)],2)):null}),S=(u(),y("div",{class:k(`${r}-step-splitor`)},null,2)),$=(u(),y("div",{class:k(`${r}-step-indicator`),key:C},[l("div",{class:k(`${r}-step-indicator-slot`)},[o(we,null,{default:()=>ae(this.$slots.icon,z=>{const{mergedStatus:i,stepsSlots:p}=this;return i==="finish"||i==="error"?i==="finish"?(u(),E(se,{clsPrefix:r,key:"finish"},{default:()=>Q(p["finish-icon"],()=>[(u(),E(ye))])},1032,["clsPrefix"])):i==="error"?(u(),E(se,{clsPrefix:r,key:"error"},{default:()=>Q(p["error-icon"],()=>[(u(),E(xe))])},1032,["clsPrefix"])):null:z||(u(),y("div",{key:this.internalIndex,class:k(`${r}-step-indicator-slot__index`)},[b(()=>this.internalIndex)],2))})},1024)],2),x?(u(),y(W,{key:0},[b(()=>S)],64)):b(()=>null)],2)),N=(u(),y("div",{class:k(`${r}-step-content`)},[l("div",{class:k(`${r}-step-content-header`)},[l("div",{class:k(`${r}-step-content-header__title`)},[b(()=>Q(this.$slots.title,()=>[this.title]))],2),!x&&C==="right"?(u(),y(W,{key:0},[b(()=>S)],64)):b(()=>null)],2),b(()=>R)],2));let e;return!x&&C==="bottom"?e=(z=>(u(),y(W,{key:5},[l("div",{class:k(`${r}-step-line`)},[b(()=>$),b(()=>S)],2),b(()=>N)],64)))():e=(z=>(u(),y(W,{key:6},[b(()=>$),b(()=>N)],64)))(),h?.(),u(),y("div",{class:k([`${r}-step`,f&&`${r}-step--disabled`,!f&&v&&`${r}-step--clickable`,this.themeClass,R&&`${r}-step--show-description`,`${r}-step--${this.mergedStatus}-status`]),style:Ce(this.cssVars),onClick:v},[b(()=>e)],14,Le)}});const Ye={class:"chaite-page setup-page"},Ze={key:0,class:"setup-grid"},Je={class:"chaite-panel form-panel","data-tour":"quick-setup"},Xe={class:"two"},et={class:"chaite-panel form-panel"},tt={class:"two"},at={class:"two"},st={class:"checks"},ot={key:1,class:"chaite-panel success-card"},rt=ee({__name:"index",setup(r){const h=Pe(),v=Se(),f=$e(),C=A(""),x=A(1),R=A(!1),S=A(""),$=A([]),N=A([]),e=Te({adapterType:"openai",channelName:"",baseUrl:"",apiKey:"",model:"",features:["chat","tool"],priority:1,weight:1,presetName:"",prefix:"",systemPrompt:"你是一个活跃在 QQ 群聊中的 AI 助手。自然、友善地参与讨论。",temperature:.8,maxToken:4096,groupContext:!0,preProcessorIds:[],postProcessorIds:[],toolGroupIds:[],applyDefault:!0,enableBym:!1,bymProbability:.02}),z=F(()=>$.value.map(c=>({label:`${c.type==="pre"?"前置":"后置"} · ${c.name}`,value:c.id}))),i=F(()=>N.value.map(c=>({label:c.name,value:c.id})));function p(c){e.adapterType=c,(!e.baseUrl||["https://api.openai.com/v1","https://generativelanguage.googleapis.com","https://api.anthropic.com"].includes(e.baseUrl))&&(e.baseUrl=c==="openai"?"https://api.openai.com/v1":c==="gemini"?"https://generativelanguage.googleapis.com":"https://api.anthropic.com")}async function B(){if(!e.channelName||!e.baseUrl||!e.apiKey||!e.model||!e.presetName){h.warning("请填写渠道、连接、模型和预设名称");return}R.value=!0;let c="",t="";try{x.value=2;const s=e.preProcessorIds.filter(T=>$.value.find(U=>U.id===T)?.type==="pre"),m=e.postProcessorIds.filter(T=>$.value.find(U=>U.id===T)?.type==="post"),G=C.value?{code:0,data:{id:C.value}}:await Ae({name:e.channelName,description:"通过快速接入向导创建",modelType:"settings",embedded:!1,adapterType:e.adapterType,type:e.adapterType,status:"enabled",priority:e.priority,weight:e.weight,models:[{name:e.model,features:e.features}],options:{baseUrl:e.baseUrl,apiKey:e.apiKey,features:e.features,preProcessorIds:s,postProcessorIds:m}});if(G.code!==0)throw new Error(G.message||"渠道创建失败");c=G.data.id;const O=await Ke({id:c,model:e.model});if(!O.data?.success)throw new Error(`渠道测试失败：${O.data?.error||"未知错误"}`);S.value=`连接成功，耗时 ${O.data.elapsed}ms`;const D=e.prefix?e.prefix.split(/[,，\s]+/).filter(Boolean):[],j=await Ee({name:e.presetName,description:`使用 ${e.channelName} / ${e.model}`,modelType:"settings",embedded:!1,local:!0,prefix:D[0]||"",prefixes:D,isBymMode:e.enableBym,autoTriggerProbability:e.enableBym?e.bymProbability:0,groupContext:e.groupContext?"enabled":"disable",sendMessageOption:{model:e.model,systemOverride:e.systemPrompt,temperature:e.temperature,maxToken:e.maxToken,toolGroupId:e.toolGroupIds}});if(j.code!==0)throw new Error(j.message||"预设创建失败");if(t=j.data.id,e.applyDefault){const T=await je();if(T.code!==0)throw new Error(T.message||"插件配置读取失败");const U=T.data;U.llm={...U.llm||{},defaultModel:e.model,defaultChatPresetId:t};const V=await De(U);if(V.code!==0)throw new Error(V.message||"群聊配置保存失败")}x.value=3,h.success("接入完成，新模型已经可以用于群聊")}catch(s){t&&await Fe(t).catch(()=>{}),h.error(s instanceof Error?s.message:"接入失败"),x.value=c?2:1}finally{R.value=!1}}return Ne(async()=>{p("openai");const[c,t]=await Promise.all([Ge(),Oe()]);if($.value=c,N.value=t,typeof f.query.channelId=="string"){const s=await _e(f.query.channelId);if(s.code===0){const m=s.data;C.value=m.id||"",e.channelName=m.name,e.adapterType=m.adapterType,e.baseUrl=m.options.baseUrl,e.apiKey=Array.isArray(m.options.apiKey)?m.options.apiKey[0]||"":m.options.apiKey,e.model=m.models[0]?.name||"",e.features=m.models[0]?.features||["chat"],e.priority=m.priority,e.weight=m.weight,e.presetName=`${m.name} 预设`}}}),(c,t)=>(u(),y("div",Ye,[t[35]||(t[35]=l("header",{class:"chaite-page-header"},[l("div",null,[l("h1",null,"快速接入"),l("p",null,"把一个 API、模型和 Key 一次配置成群聊中可直接使用的预设。")])],-1)),o(a(qe),{current:x.value,class:"steps"},{default:n(()=>[o(a(X),{title:"填写接入信息"}),o(a(X),{title:"创建并测试"}),o(a(X),{title:"群聊可用"})]),_:1},8,["current"]),x.value<3?(u(),y("div",Ze,[l("section",Je,[t[25]||(t[25]=l("div",{class:"section-head"},[l("span",null,"01"),l("div",null,[l("h2",null,"模型渠道"),l("p",null,"只填写分享者给你的内容，其余可以保持默认。")])],-1)),o(a(ie),{"label-placement":"top"},{default:n(()=>[o(a(g),{label:"接口类型"},{default:n(()=>[o(a(Be),{value:e.adapterType,"onUpdate:value":p},{default:n(()=>[o(a(Z),{value:"openai"},{default:n(()=>[...t[19]||(t[19]=[w("OpenAI 兼容",-1)])]),_:1}),o(a(Z),{value:"gemini"},{default:n(()=>[...t[20]||(t[20]=[w("Gemini",-1)])]),_:1}),o(a(Z),{value:"claude"},{default:n(()=>[...t[21]||(t[21]=[w("Claude",-1)])]),_:1})]),_:1},8,["value"])]),_:1}),l("div",Xe,[o(a(g),{label:"渠道名称"},{default:n(()=>[o(a(_),{value:e.channelName,"onUpdate:value":t[0]||(t[0]=s=>e.channelName=s),placeholder:"例如：群友分享的公益站"},null,8,["value"])]),_:1}),o(a(g),{label:"模型名称"},{default:n(()=>[o(a(_),{value:e.model,"onUpdate:value":t[1]||(t[1]=s=>e.model=s),placeholder:"例如：gpt-4o-mini"},null,8,["value"])]),_:1})]),o(a(g),{label:"API 地址"},{default:n(()=>[o(a(_),{value:e.baseUrl,"onUpdate:value":t[2]||(t[2]=s=>e.baseUrl=s)},null,8,["value"])]),_:1}),o(a(g),{label:"API Key"},{default:n(()=>[o(a(_),{value:e.apiKey,"onUpdate:value":t[3]||(t[3]=s=>e.apiKey=s),type:"password","show-password-on":"click",placeholder:"仅保存在你的机器人服务器"},null,8,["value"])]),_:1}),o(a(g),{label:"模型能力"},{default:n(()=>[o(a(Re),{value:e.features,"onUpdate:value":t[4]||(t[4]=s=>e.features=s)},{default:n(()=>[o(a(K),{value:"chat",disabled:""},{default:n(()=>[...t[22]||(t[22]=[w("对话",-1)])]),_:1}),o(a(K),{value:"tool"},{default:n(()=>[...t[23]||(t[23]=[w("工具",-1)])]),_:1}),o(a(K),{value:"visual"},{default:n(()=>[...t[24]||(t[24]=[w("图片",-1)])]),_:1})]),_:1},8,["value"])]),_:1})]),_:1})]),l("section",et,[t[30]||(t[30]=l("div",{class:"section-head"},[l("span",null,"02"),l("div",null,[l("h2",null,"预设与群聊"),l("p",null,"无需记住模型名称或离开本页。")])],-1)),o(a(ie),{"label-placement":"top"},{default:n(()=>[l("div",tt,[o(a(g),{label:"预设名称"},{default:n(()=>[o(a(_),{value:e.presetName,"onUpdate:value":t[5]||(t[5]=s=>e.presetName=s),placeholder:"例如：群聊小助手"},null,8,["value"])]),_:1}),o(a(g),{label:"触发前缀（支持多个，逗号分隔）"},{default:n(()=>[o(a(_),{value:e.prefix,"onUpdate:value":t[6]||(t[6]=s=>e.prefix=s),placeholder:"例如：小助手, 助手"},null,8,["value"])]),_:1})]),o(a(g),{label:"角色设定"},{default:n(()=>[o(a(_),{value:e.systemPrompt,"onUpdate:value":t[7]||(t[7]=s=>e.systemPrompt=s),type:"textarea",autosize:{minRows:5,maxRows:10}},null,8,["value"])]),_:1}),l("div",at,[o(a(g),{label:"温度"},{default:n(()=>[o(a(J),{value:e.temperature,"onUpdate:value":t[8]||(t[8]=s=>e.temperature=s),min:0,max:2,step:.1},null,8,["value"])]),_:1}),o(a(g),{label:"最大输出"},{default:n(()=>[o(a(J),{value:e.maxToken,"onUpdate:value":t[9]||(t[9]=s=>e.maxToken=s),min:1},null,8,["value"])]),_:1})]),o(a(g),{label:"处理器"},{default:n(()=>[o(a(ne),{value:e.preProcessorIds,"onUpdate:value":[t[10]||(t[10]=s=>e.preProcessorIds=s),t[11]||(t[11]=s=>{e.preProcessorIds=s,e.postProcessorIds=s})],multiple:"",clearable:"",options:z.value,placeholder:"可选：选择消息处理器"},null,8,["value","options"])]),_:1}),o(a(g),{label:"工具组"},{default:n(()=>[o(a(ne),{value:e.toolGroupIds,"onUpdate:value":t[12]||(t[12]=s=>e.toolGroupIds=s),multiple:"",clearable:"",options:i.value,placeholder:"可选：让模型使用工具"},null,8,["value","options"])]),_:1}),l("div",st,[o(a(K),{checked:e.groupContext,"onUpdate:checked":t[13]||(t[13]=s=>e.groupContext=s)},{default:n(()=>[...t[26]||(t[26]=[w("携带群聊上下文",-1)])]),_:1},8,["checked"]),o(a(K),{checked:e.applyDefault,"onUpdate:checked":t[14]||(t[14]=s=>e.applyDefault=s)},{default:n(()=>[...t[27]||(t[27]=[w("设为默认对话预设",-1)])]),_:1},8,["checked"]),o(a(K),{checked:e.enableBym,"onUpdate:checked":t[15]||(t[15]=s=>e.enableBym=s)},{default:n(()=>[...t[28]||(t[28]=[w("设为伪人预设（单轮插话）",-1)])]),_:1},8,["checked"])]),e.enableBym?(u(),E(a(g),{key:0,label:"主动插话概率（0~1）"},{default:n(()=>[o(a(J),{value:e.bymProbability,"onUpdate:value":t[16]||(t[16]=s=>e.bymProbability=s),min:0,max:1,step:.01},null,8,["value"])]),_:1})):le("",!0)]),_:1}),S.value?(u(),E(a(ce),{key:0,type:"success","show-icon":!0,class:"result"},{default:n(()=>[w(q(S.value),1)]),_:1})):le("",!0),o(a(Y),{type:"primary",size:"large",block:"",loading:R.value,onClick:B},{default:n(()=>[...t[29]||(t[29]=[w("创建渠道、测试并应用到群聊",-1)])]),_:1},8,["loading"])])])):(u(),y("section",ot,[t[33]||(t[33]=l("div",{class:"success-icon"},"✓",-1)),t[34]||(t[34]=l("h2",null,"接入完成",-1)),l("p",null,q(e.channelName)+" 的 "+q(e.model)+" 已创建为“"+q(e.presetName)+"”。",1),l("div",null,[o(a(Y),{type:"primary",onClick:t[17]||(t[17]=s=>a(v).push("/chat-preset"))},{default:n(()=>[...t[31]||(t[31]=[w("查看预设",-1)])]),_:1}),o(a(Y),{secondary:"",onClick:t[18]||(t[18]=s=>a(v).push("/dashboard"))},{default:n(()=>[...t[32]||(t[32]=[w("返回驾驶台",-1)])]),_:1})])]))]))}}),yt=Ue(rt,[["__scopeId","data-v-968ef45b"]]);export{yt as default};
