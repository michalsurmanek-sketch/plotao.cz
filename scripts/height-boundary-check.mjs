import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const panel=read('assets/panel-pricing-v5.js'),mesh=read('assets/mesh-pricing-v2.js'),alu=read('assets/aluminium-pricing.js'),gate=read('assets/gate-pricing-v1.js'),accuracy=read('assets/accuracy-guard.js'),lead=read('assets/lead-core-v1.js');

ok(panel.includes("function requested(){return +($('#height')?.value||0)}"),'panel adapter must keep the actual typed height instead of clamping it to 40cm');
ok(panel.includes("if(h<40||h>400){b.style.display='none';window.PLOTAO_PANEL_PRICE={invalid:true,reason:'height-input'}"),'panel benchmark must disappear and publish invalid state outside 40–400cm');
ok(!panel.includes('function requested(){return Math.max(40'),'panel adapter must never silently price a sub-40cm request as 40cm');

ok(mesh.includes("function h(){return +($('#height')?.value||0)}"),'mesh adapter must keep the actual typed height instead of clamping it to 40cm');
ok(mesh.includes("if(requested<40||requested>400){b.style.display='none';window.PLOTAO_MESH_PRICE={invalid:true,reason:'height-input'}"),'mesh benchmark must disappear and publish invalid state outside 40–400cm');
ok(!mesh.includes('function h(){return Math.max(40'),'mesh adapter must never silently price a sub-40cm request as 40cm');

ok(alu.includes("function h(){return +($('#height')?.value||0)}"),'aluminium adapter must keep the actual typed height instead of clamping it to 40cm');
ok(alu.includes("if(requested<40||requested>400){b.style.display='none';window.PLOTAO_ALUMINIUM_PRICE={invalid:true,reason:'height-input'}"),'aluminium benchmark must disappear and publish invalid state outside 40–400cm');
ok(!alu.includes('function h(){return Math.max(40'),'aluminium adapter must never silently benchmark a sub-40cm request as 40cm');

ok(gate.includes("function requestedH(){return +($('#height')?.value||0)}"),'gate adapter must keep the actual typed fence height');
ok(gate.includes("function invalidHeight(){const h=requestedH();return h<40||h>400}"),'gate benchmark must share the calculator 40–400cm validity boundary');
ok(gate.includes("if(invalidHeight()){invalidate(b,'opravte výšku plotu');return}"),'gate and wicket exact prices must be suppressed for invalid fence height');
ok(!gate.includes('function requestedH(){return Math.max(40'),'gate adapter must never pair an invalid sub-40cm request with a 40cm-equivalent product');

ok(accuracy.includes("if(h<40)return{kind:'invalid'")&&accuracy.includes("if(h>400)return{kind:'invalid'"),'main accuracy guard must keep the same 40–400cm boundary');
ok(lead.includes("if(d.height<40||d.height>400)errors.push"),'lead core must reject the same invalid height range');

if(fail.length){console.error('Height boundary checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Height boundary checks OK: invalid 40–400cm inputs cannot leak into panel, mesh, aluminium or gate benchmarks');
