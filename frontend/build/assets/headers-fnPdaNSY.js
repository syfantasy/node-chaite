import{ad as y,ac as i,ae as d,d as z,af as f,D as $,ah as T,aj as R,N as c,ao as B,ak as t}from"./index-C1d8iO7w.js";var P=y("h",`
 font-size: var(--n-font-size);
 font-weight: var(--n-font-weight);
 margin: var(--n-margin);
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[i("&:first-child",{marginTop:0}),d("prefix-bar",{position:"relative",paddingLeft:"var(--n-prefix-width)"},[d("align-text",{paddingLeft:0},[i("&::before",{left:"calc(-1 * var(--n-prefix-width))"})]),i("&::before",`
 content: "";
 width: var(--n-bar-width);
 border-radius: calc(var(--n-bar-width) / 2);
 transition: background-color .3s var(--n-bezier);
 left: 0;
 top: 0;
 bottom: 0;
 position: absolute;
 `),i("&::before",{backgroundColor:"var(--n-bar-color)"})])]);const W={...f.props,type:{type:String,default:"default"},prefix:String,alignText:Boolean};var l=e=>z({name:`H${e}`,props:W,setup(r){const{mergedClsPrefixRef:n,inlineThemeDisabled:a}=T(r),s=f("Typography","-h",P,B,r,n),o=c(()=>{const{type:g}=r,{common:{cubicBezierEaseInOut:m},self:{headerFontWeight:p,headerTextColor:b,[t("headerPrefixWidth",e)]:x,[t("headerFontSize",e)]:u,[t("headerMargin",e)]:C,[t("headerBarWidth",e)]:v,[t("headerBarColor",g)]:w}}=s.value;return{"--n-bezier":m,"--n-font-size":u,"--n-margin":C,"--n-bar-color":w,"--n-bar-width":v,"--n-font-weight":p,"--n-text-color":b,"--n-prefix-width":x}}),h=a?R(`h${e}`,c(()=>r.type[0]),o,r):void 0;return{mergedClsPrefix:n,cssVars:a?void 0:o,themeClass:h?.themeClass,onRender:h?.onRender}},render(){const{prefix:r,alignText:n,mergedClsPrefix:a,cssVars:s,$slots:o}=this;return this.onRender?.(),$(`h${e}`,{class:[`${a}-h`,`${a}-h${e}`,this.themeClass,{[`${a}-h--prefix-bar`]:r,[`${a}-h--align-text`]:n}],style:s},o)}});const N=l("2"),S=l("3");export{S as N,N as a};
