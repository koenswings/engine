import { proxy, subscribe } from 'valtio'


import valtio
const moduleA = await import('valtio');
module!
moduleA
const {subscribe, proxy} = await import('valtio')
const s1 = proxy({})
s1
subscribe(s1, () => {
  console.log('s1 is changed!')
})
s1.a = 1 // s1 is changed!

s1.b = 3

o = {a:1, b:2}
po = proxy(o)
subscribe(po, () => {console.log('po has changed')})
po.a
po.a = 2
o.a
o.a=3
ppo = proxy(po)
subscribe(ppo, () => {console.log('ppo has changed')})
po.b = 3
ppo.b
ppo.b - 4
ppo.b = 4

pembedded = proxy({koen: 1})
po.c = pembedded
ppo.c = pembedded

pembedded.koen = 2

po.c
ppo.c
pembedded.koen = 3

po.c
ppo.c
ppo.c
subscribe(pembedded, () => {console.log('pembedded has changed')})
pembedded.koen = 4
