import {
  S as i,
  i as r,
  s as c,
  e as d,
  b as v,
  c as p,
  l as u,
  n,
  h as w,
} from './index-da90f7af.js'
function h(s) {
  let e, t, l
  return {
    c() {
      ;(e = d('div')),
        (e.innerHTML =
          '<h1 class="svelte-1ln70wt">Hello there</h1> <div class="centeredParagraph svelte-1ln70wt"><p class="svelte-1ln70wt">This set of slides was created by Georges Corbineau for the talk &quot;From data to Story&quot;, run by the DataLab.</p></div> <div class="bullet-point svelte-1ln70wt"><p class="svelte-1ln70wt">- Use left and right arrows to go from one slide to another</p> <p class="svelte-1ln70wt">- Use down and up arrows to drill down on a specific slide</p></div> <div class="centeredParagraph svelte-1ln70wt"><p class="svelte-1ln70wt">You can find the live recording of the presentation on <a href="https://www.youtube.com/watch?v=_hnUxrSqeRs" target="_blank">Youtube</a></p></div>'),
        v(e, 'class', 'slide-content')
    },
    m(a, o) {
      p(a, e, o), t || ((l = u(window, 'keydown', s[0])), (t = !0))
    },
    p: n,
    i: n,
    o: n,
    d(a) {
      a && w(e), (t = !1), l()
    },
  }
}
function f(s) {
  return [
    (t) => {
      switch (t.keyCode) {
      }
    },
  ]
}
class m extends i {
  constructor(e) {
    super(), r(this, e, f, h, c, {})
  }
}
export { m as default }