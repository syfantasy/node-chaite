import{d as E,bt as _,K as v,o as y,c as A,b as B,w as n,e as o,u as a,C as L,I as x,S as U,g as p,B as m,a as I,A as N,M as T,l as V,h as w,N as F}from"./index-9sTjWrks.js";import{F as R}from"./FormItem-7cI6SzJM.js";import{F as d}from"./FormItemGridItem-DXoTtt6O.js";import{G as j}from"./Grid-D5ek8q6l.js";import{j as q,c as D}from"./index-GLiiNfNv.js";const G={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},z=`import { asyncLocalStorage, PreProcessor } from 'chaite'

export class ExamplePreProcessor extends PreProcessor {
  name = 'example'

  /**
   * 处理逻辑
   * 可以通过\`asyncLocalStorage.getStore().getEvent()\`获取e实例
   * @param {import('chaite').UserMessage} message
   * @returns {Promise<import('chaite').UserMessage>}
   */
  async process (message) {
    const context = (/** @type {AsyncLocalStorage<import('chaite').ChaiteContext>} **/asyncLocalStorage).getStore()
    const e = context.getEvent()
    await e.reply('处理一下' + e.sender.nickname + '的问题')
    message.content.forEach((item) => {
      item.text = item.text.replace(/<|>/g, '')
    })
    return message
  }
}
`,u=`import { asyncLocalStorage, PostProcessor } from 'chaite'

export class ExamplePostProcessor extends PostProcessor {
  name = 'example'

  /**
   * 处理逻辑
   * 可以通过\`asyncLocalStorage.getStore().getEvent()\`获取e实例
   * @param {import('chaite').AssistantMessage} message
   * @returns {Promise<import('chaite').AssistantMessage>}
   */
  async process (message) {
    const context = (/** @type {AsyncLocalStorage<import('chaite').ChaiteContext>} **/asyncLocalStorage).getStore()
    const e = context.getEvent()
    await e.reply('处理一下AI对' + e.sender.nickname + '的回复')
    const rawResponse = message.content[0].text
    message.content[0].text = rawResponse.replace(/<|>/g, '')
    return message
  }
}
`,Q=E({__name:"ProcessorFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({description:"",code:u,modelType:"executable",type:"post"})}},emits:["update:show","submit"],setup(c,{emit:b}){const i=c,g=b,h=_(),f=w(),r=F({get:()=>i.show,set:s=>g("update:show",s)}),C={name:{required:!0,trigger:["blur","input"],message:"请输入处理器名称"},description:{required:!0,trigger:["blur","input"],message:"请输入处理器描述"},code:{required:!0,trigger:["blur","input"],message:"请输入处理器代码"}},t=w({description:"",code:u,modelType:"executable",type:"post"});function P(){const s=t.value.type==="pre"?z:u;if(!t.value.code||t.value.code.trim()===""){t.value.code=s;return}h.warning({title:"确认覆盖",content:"当前编辑区已有代码，插入示例代码将覆盖现有内容，是否继续？",positiveText:"确认",negativeText:"取消",onPositiveClick:()=>{t.value.code=s}})}v(()=>i.initialData,s=>{i.editMode&&s&&(t.value={...s})},{immediate:!0});function S(){f.value?.validate().then(s=>{if(Array.isArray(s)){console.error(s);return}g("submit",t.value),r.value=!1})}const M=q();return v(r,s=>{!s&&!i.editMode&&(t.value={name:"",description:"",code:u})}),(s,e)=>{const k=U;return y(),A("div",null,[r.value?(y(),B(a(T),{key:0,show:r.value,"onUpdate:show":e[5]||(e[5]=l=>r.value=l),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:n(()=>[o(a(L),{title:c.editMode?"编辑处理器":"添加处理器"},{default:n(()=>[o(a(R),{ref_key:"formRef",ref:f,rules:C,model:t.value},{default:n(()=>[o(a(j),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:n(()=>[o(a(d),{span:"24",label:"名称",path:"name"},{default:n(()=>[o(a(x),{value:t.value.name,"onUpdate:value":e[0]||(e[0]=l=>t.value.name=l),placeholder:"请输入处理器名称"},null,8,["value"])]),_:1}),o(a(d),{span:"24",label:"描述",path:"description"},{default:n(()=>[o(a(x),{value:t.value.description,"onUpdate:value":e[1]||(e[1]=l=>t.value.description=l),type:"textarea",placeholder:"请输入处理器描述"},null,8,["value"])]),_:1}),o(a(d),{span:"24",label:"类型",path:"type"},{default:n(()=>[o(k,{value:t.value.type,"onUpdate:value":e[2]||(e[2]=l=>t.value.type=l),options:[{value:"post",label:"后置"},{value:"pre",label:"前置"}],placeholder:"请输入处理器描述"},null,8,["value"])]),_:1}),o(a(d),{span:"24",label:"代码",path:"code"},{label:n(()=>[e[7]||(e[7]=p(" 代码 ",-1)),o(a(m),{quaternary:"",type:"warning",style:{"font-size":"12px"},onClick:P},{default:n(()=>[...e[6]||(e[6]=[p(" 点击插入示例代码 ",-1)])]),_:1})]),default:n(()=>[o(a(D),{modelValue:t.value.code,"onUpdate:modelValue":e[3]||(e[3]=l=>t.value.code=l),style:{width:"100%"},lang:a(M),basic:""},null,8,["modelValue","lang"])]),_:1})]),_:1}),I("div",G,[o(a(N),null,{default:n(()=>[o(a(m),{onClick:e[4]||(e[4]=l=>r.value=!1)},{default:n(()=>[...e[8]||(e[8]=[p(" 取消 ",-1)])]),_:1}),o(a(m),{type:"primary",onClick:S},{default:n(()=>[...e[9]||(e[9]=[p(" 确定 ",-1)])]),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):V("",!0)])}}});export{Q as _};
