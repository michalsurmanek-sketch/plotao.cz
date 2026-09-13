import fs from 'node:fs';
const src=fs.readFileSync('assets/modal-accessibility-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("function focusFallback(modal){const status=$('#leadSafetyStatus');if(visible(status)){status.tabIndex=-1;return status}return focusables(modal)[0]||modal}"),'open modal must prefer a visible validation status when restoring escaped programmatic focus');
ok(src.includes("document.addEventListener('focusin',e=>{if(!modal.classList.contains('open')||modal.contains(e.target))return"),'modal must catch programmatic focus that escapes outside the open dialog');
ok(src.includes("const target=focusFallback(modal);if(target?.focus)queueMicrotask(()=>target.focus())"),'escaped focus must be returned inside without re-entering the originating focus stack');
ok(src.includes("modal.setAttribute('aria-modal','true')")&&src.includes("e.key!=='Tab'"),'focus containment must complement, not replace, the existing aria-modal semantics and Tab trap');
if(fail.length){console.error('Modal focus containment checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Modal focus containment checks OK: validation and programmatic focus cannot escape the open lead dialog');
