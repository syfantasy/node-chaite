import{d as N,K as v,o as g,c as _,b as k,w as s,e as n,u as t,C as B,I as d,a as M,A as j,B as y,g as h,M as O,l as D,h as m,N as J}from"./index-CGMrCcJI.js";import{F as S}from"./FormItem-CVO-X31M.js";import{F as p}from"./FormItemGridItem-ne21yK8R.js";import{G as q}from"./Grid-Ckk14v0Z.js";import{j as E,c as F}from"./index-YNDY4B8-.js";const K={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},G=N({__name:"ToolFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})}},emits:["update:show","submit"],setup(f,{emit:b}){const u=f,c=b,x=m(),r=J({get:()=>u.show,set:o=>c("update:show",o)}),w={name:{required:!0,trigger:["blur","input"],message:"请输入工具名称"},description:{required:!0,trigger:["blur","input"],message:"请输入工具描述"},code:{required:!0,trigger:["blur","input"],message:"请输入工具代码"}},C=E(),i=m(""),a=m({description:"",code:`import { CustomTool } from 'chaite'

export class ExampleTool extends CustomTool {
  name = 'example'
  function = {
    name: 'example',
    description: '演示工具',
    parameters: {
      type: 'object',
      properties: {
        example: {
          type: 'string',
          description: '输入参数'
        }
      },
      required: ['example']
    }
  }

  async run (args, context) {
    // 可通过 this.config 或 context.toolConfig 获取在控制台配置的专属参数
    const apiKey = this.config?.apiKey || context?.toolConfig?.apiKey
    return \`收到参数: \${args.example}\`
  }
}

export default new ExampleTool()
`,modelType:"executable"});v(()=>u.initialData,o=>{if(u.editMode&&o){a.value={...o};const e=o.config||o.extraData?.config;i.value=e&&Object.keys(e).length>0?JSON.stringify(e,null,2):""}else i.value=""},{immediate:!0});function T(){x.value?.validate().then(o=>{if(Array.isArray(o)){console.error(o);return}let e={};if(i.value.trim())try{e=JSON.parse(i.value.trim())}catch(l){alert(`工具专属配置必须为合法的 JSON 格式: ${l.message}`);return}a.value.config=e,a.value.extraData||(a.value.extraData={}),a.value.extraData.config=e,c("submit",a.value),r.value=!1})}return v(r,o=>{!o&&!u.editMode&&(a.value={name:"",description:"",code:`import { CustomTool } from 'chaite'

export class ExampleTool extends CustomTool {
  name = 'example'
  function = {
    name: 'example',
    description: 'example',
    parameters: {
      type: 'object',
      properties: {
        example: {
          type: 'string',
          description: 'example'
        }
      },
      required: ['example']
    }
  }

  async run (args) {
    return args.example
  }
}

export default new ExampleTool()
`})}),(o,e)=>(g(),_("div",null,[r.value?(g(),k(t(O),{key:0,show:r.value,"onUpdate:show":e[5]||(e[5]=l=>r.value=l),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:s(()=>[n(t(B),{title:f.editMode?"编辑工具":"添加工具"},{default:s(()=>[n(t(S),{ref_key:"formRef",ref:x,rules:w,model:a.value},{default:s(()=>[n(t(q),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:s(()=>[n(t(p),{span:"24",label:"名称",path:"name"},{default:s(()=>[n(t(d),{value:a.value.name,"onUpdate:value":e[0]||(e[0]=l=>a.value.name=l),placeholder:"请输入工具名称"},null,8,["value"])]),_:1}),n(t(p),{span:"24",label:"描述",path:"description"},{default:s(()=>[n(t(d),{value:a.value.description,"onUpdate:value":e[1]||(e[1]=l=>a.value.description=l),type:"textarea",placeholder:"请输入工具描述"},null,8,["value"])]),_:1}),n(t(p),{span:"24",label:"工具专属配置 (JSON，选填)",path:"config"},{default:s(()=>[n(t(d),{value:i.value,"onUpdate:value":e[2]||(e[2]=l=>i.value=l),type:"textarea",autosize:{minRows:2,maxRows:6},placeholder:'选填，请输入 JSON 配置（如: {"apiKey": "sk-xxx", "timeout": 5000}），可在工具内通过 this.config 读取',style:{"font-family":"monospace"}},null,8,["value"])]),_:1}),n(t(p),{span:"24",label:"代码",path:"code"},{default:s(()=>[n(t(F),{modelValue:a.value.code,"onUpdate:modelValue":e[3]||(e[3]=l=>a.value.code=l),style:{width:"100%"},lang:t(C),basic:""},null,8,["modelValue","lang"])]),_:1})]),_:1}),M("div",K,[n(t(j),null,{default:s(()=>[n(t(y),{onClick:e[4]||(e[4]=l=>r.value=!1)},{default:s(()=>[...e[6]||(e[6]=[h(" 取消 ",-1)])]),_:1}),n(t(y),{type:"primary",onClick:T},{default:s(()=>[...e[7]||(e[7]=[h(" 确定 ",-1)])]),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):D("",!0)]))}});export{G as _};
