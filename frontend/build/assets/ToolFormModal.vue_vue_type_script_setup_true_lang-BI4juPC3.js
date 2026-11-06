import{d as T,K as f,o as _,b as M,w as l,e as a,u as t,I as c,a as x,A as B,B as v,g,M as j,l as k,h as y,N as V}from"./index-DSBgBm7h.js";import{F as q}from"./Form-BTifyEzb.js";import{F as d}from"./FormItemGridItem-tQ_rQe5w.js";import{G as F}from"./Grid-BG6ByCHN.js";import{j as N,c as A}from"./index-B1AxEXkk.js";const E={style:{width:"100%","max-height":"360px","overflow-y":"auto",border:"1px solid var(--n-border-color)","border-radius":"4px"}},I={style:{display:"flex","justify-content":"flex-end",width:"100%"}},$=T({__name:"ToolFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})}},emits:["update:show","submit"],setup(p,{emit:h}){const i=p,u=h,m=y(),s=V({get:()=>i.show,set:n=>u("update:show",n)}),w={name:{required:!0,trigger:["blur","input"],message:"请输入工具名称"},description:{required:!0,trigger:["blur","input"],message:"请输入工具描述"},code:{required:!0,trigger:["blur","input"],message:"请输入工具代码"}},b=N(),o=y({description:"",code:`import { CustomTool } from 'chaite'

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
`,modelType:"executable"});f(()=>i.initialData,n=>{i.editMode&&n&&(o.value={...n})},{immediate:!0});function C(){m.value?.validate().then(n=>{if(Array.isArray(n)){console.error(n);return}u("submit",o.value),s.value=!1})}return f(s,n=>{!n&&!i.editMode&&(o.value={name:"",description:"",code:`import { CustomTool } from 'chaite'

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
`})}),(n,e)=>s.value?(_(),M(t(j),{key:0,show:s.value,"onUpdate:show":e[4]||(e[4]=r=>s.value=r),preset:"card",title:p.editMode?"编辑工具":"添加工具",style:{width:"780px","max-width":"92vw","max-height":"88vh",display:"flex","flex-direction":"column"},"content-style":{overflowY:"auto",flex:1,paddingRight:"6px"}},{action:l(()=>[x("div",I,[a(t(B),null,{default:l(()=>[a(t(v),{onClick:e[3]||(e[3]=r=>s.value=!1)},{default:l(()=>[...e[5]||(e[5]=[g(" 取消 ",-1)])]),_:1}),a(t(v),{type:"primary",onClick:C},{default:l(()=>[...e[6]||(e[6]=[g(" 确定保存 ",-1)])]),_:1})]),_:1})])]),default:l(()=>[a(t(q),{ref_key:"formRef",ref:m,rules:w,model:o.value},{default:l(()=>[a(t(F),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:l(()=>[a(t(d),{span:"24",label:"名称",path:"name"},{default:l(()=>[a(t(c),{value:o.value.name,"onUpdate:value":e[0]||(e[0]=r=>o.value.name=r),placeholder:"请输入工具名称"},null,8,["value"])]),_:1}),a(t(d),{span:"24",label:"描述",path:"description"},{default:l(()=>[a(t(c),{value:o.value.description,"onUpdate:value":e[1]||(e[1]=r=>o.value.description=r),type:"textarea",placeholder:"请输入工具描述"},null,8,["value"])]),_:1}),a(t(d),{span:"24",label:"代码",path:"code"},{default:l(()=>[x("div",E,[a(t(A),{modelValue:o.value.code,"onUpdate:modelValue":e[2]||(e[2]=r=>o.value.code=r),style:{width:"100%"},lang:t(b),basic:""},null,8,["modelValue","lang"])])]),_:1})]),_:1})]),_:1},8,["model"])]),_:1},8,["show","title"])):k("",!0)}});export{$ as _};
