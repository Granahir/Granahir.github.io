import{S as i,i as o,s as r,e as l,b as c,c as u,n,h as p}from"./index-da90f7af.js";function d(s){let e;return{c(){e=l("div"),e.innerHTML='<h1 class="svelte-1ppyjuq">Published</h1>',c(e,"class","slide-content svelte-1ppyjuq")},m(t,a){u(t,e,a)},p:n,i:n,o:n,d(t){t&&p(e)}}}function f(s){const e=Date.now()+2e3;function t(){confetti({particleCount:2,angle:60,spread:55,origin:{x:0}}),confetti({particleCount:2,angle:120,spread:55,origin:{x:1}}),Date.now()<e&&requestAnimationFrame(t)}return t(),[]}class h extends i{constructor(e){super(),o(this,e,f,d,r,{})}}export{h as default};
