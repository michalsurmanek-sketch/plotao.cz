import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const panel=read('assets/panel-pricing-v5.js'),mesh=read('assets/mesh-pricing-v2.js'),alu=read('assets/aluminium-pricing.js'),privacy=read('assets/privacy-pricing.js'),structural=read('assets/structural-pricing-v5.js'),extra=read('assets/extra-fence-pricing.js'),metal=read('assets/metal-pricing.js'),gate=read('assets/gate-pricing-v1.js'),accuracy=read('assets/accuracy-guard.js'),lead=read('assets/lead-core-v1.js');

ok(panel.includes("function requested(){return +($('#height')?.value||0)}"),'panel adapter must keep the actual typed height instead of clamping it to 40cm');
ok(panel.includes("if(h<40||h>400){b.style.display='none';window.PLOTAO_PANEL_PRICE={invalid:true,reason:'height-input'}"),'panel benchmark must disappear and publish invalid state outside 40–400cm');
ok(!panel.includes('function requested(){return Math.max(40'),'panel adapter must never silently price a sub-40cm request as 40cm');

ok(mesh.includes("function h(){return +($('#height')?.value||0)}"),'mesh adapter must keep the actual typed height instead of clamping it to 40cm');
ok(mesh.includes("if(requested<40||requested>400){b.style.display='none';window.PLOTAO_MESH_PRICE={invalid:true,reason:'height-input'}"),'mesh benchmark must disappear and publish invalid state outside 40–400cm');
ok(!mesh.includes('function h(){return Math.max(40'),'mesh adapter must never silently price a sub-40cm request as 40cm');

ok(alu.includes("function h(){return +($('#height')?.value||0)}"),'aluminium adapter must keep the actual typed height instead of clamping it to 40cm');
ok(alu.includes("if(requested<40||requested>400){b.style.display='none';window.PLOTAO_ALUMINIUM_PRICE={invalid:true,reason:'height-input'}"),'aluminium benchmark must disappear and publish invalid state outside 40–400cm');
ok(!alu.includes('function h(){return Math.max(40'),'aluminium adapter must never silently benchmark a sub-40cm request as 40cm');

ok(privacy.includes("function h(){return +($('#height')?.value||0)}"),'privacy adapter must keep the actual typed height');
ok(privacy.includes("if(height<40||height>400){b.style.display='none';window.PLOTAO_PRIVACY_PRICE={invalid:true,reason:'height-input'}"),'privacy benchmark must disappear outside 40–400cm');
ok(!privacy.includes('Math.max(40,+($(\'#height\')'),'privacy adapter must not restore the old minimum-height clamp');

ok(structural.includes("function h(){return +($('#height')?.value||0)}"),'structural adapter must keep the actual typed height');
ok(structural.includes("if(height<40||height>400){b.style.display='none';if(t==='concrete')window.PLOTAO_CONCRETE_PRICE={invalid:true,reason:'height-input'};else window.PLOTAO_GABION_PRICE={invalid:true,reason:'height-input'}"),'concrete/gabion benchmarks must disappear and publish invalid state outside 40–400cm');
ok(!structural.includes('function h(){return Math.max(40'),'structural adapter must not silently clamp invalid heights');

ok(extra.includes("height=+($('#height')?.value||0)")&&extra.includes("if(height<40||height>400){clearBox(b);publish({invalid:true,reason:'height-input'});return}"),'mobile/masonry/other benchmark adapter must suppress detail output outside 40–400cm');
ok(!extra.includes("height=Math.max(40,+($('#height')"),'extra fence adapter must not silently clamp invalid heights');

ok(metal.includes("const height=+($('#height')?.value||0);if(height<40||height>400){b.style.display='none';window.PLOTAO_METAL_PRICE={invalid:true,reason:'height-input'}"),'metal detail must hide and publish invalid state outside 40–400cm');
ok(!metal.includes("h=Math.max(.4,+($('#height')"),'metal detail must not silently display 40cm for an invalid lower height');

ok(gate.includes("function requestedH(){return +($('#height')?.value||0)}"),'gate adapter must keep the actual typed fence height');
ok(gate.includes("function invalidIssue(){const shared=window.PLOTAO_INPUT_VALIDITY?.current?.();if(shared)return shared")&&gate.includes("const h=requestedH();if(h<40||h>400)return{code:'height',note:'opravte výšku plotu'}"),'gate benchmark must use shared validity and retain a 40–400cm startup fallback before the shared guard loads');
ok(gate.includes("const issue=invalidIssue();if(issue){invalidate(b,issue.note);return}"),'gate and wicket exact prices must be suppressed whenever the shared validity reports an invalid height or other calculator input');
ok(!gate.includes('function requestedH(){return Math.max(40'),'gate adapter must never pair an invalid sub-40cm request with a 40cm-equivalent product');

ok(accuracy.includes("if(h<40)return{kind:'invalid'")&&accuracy.includes("if(h>400)return{kind:'invalid'"),'main accuracy guard must keep the same 40–400cm boundary');
ok(lead.includes("if(d.height<40||d.height>400)errors.push"),'lead core must reject the same invalid height range');

if(fail.length){console.error('Height boundary checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Height boundary checks OK: invalid 40–400cm inputs cannot leak into any panel, mesh, aluminium, privacy, structural, extra, metal or gate benchmark');
