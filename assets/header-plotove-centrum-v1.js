(()=>{
  const header=document.querySelector('.head');
  const logo=header?.querySelector('a.logo');
  if(!header||!logo||logo.querySelector('.plotao-network-claim'))return;

  const claim=document.createElement('span');
  claim.className='plotao-network-claim';
  claim.setAttribute('aria-label','Plotové centrum – Největší síť prodejen plotů v ČR');
  claim.innerHTML='<span class="plotao-network-pin" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 22s7-6.1 7-13A7 7 0 1 0 5 9c0 6.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2.7"/></svg></span><span class="plotao-network-copy"><strong>PLOTOVÉ CENTRUM</strong><span>Největší síť prodejen plotů v ČR</span></span>';
  logo.appendChild(claim);

  const style=document.createElement('style');
  style.dataset.plotaoNetworkClaim='1';
  style.textContent=`
    .head{height:96px}
    .head .logo{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;text-decoration:none;line-height:1}
    .head .logo img{width:190px}
    .plotao-network-claim{display:flex;align-items:center;gap:7px;transform:translateY(-6px);margin-top:2px;margin-left:43px;white-space:nowrap}
    .plotao-network-pin{display:grid;place-items:center;width:25px;height:29px;flex:0 0 25px}
    .plotao-network-pin svg{display:block;width:25px;height:29px;fill:#07915d}
    .plotao-network-pin circle{fill:#fff}
    .plotao-network-copy{display:flex;flex-direction:column;gap:3px;line-height:1.05}
    .plotao-network-copy strong{font-size:13px;font-weight:900;color:#07864f;letter-spacing:-.15px}
    .plotao-network-copy>span{font-size:12px;font-weight:500;color:#17251e;letter-spacing:-.15px}
    @media(min-width:1000px){
      .head .logo img{width:220px}
      .plotao-network-claim{margin-left:51px}
      .plotao-network-copy strong{font-size:14px}
      .plotao-network-copy>span{font-size:13px}
    }
    @media(max-width:680px){
      .head{height:76px}
      .head .logo img{width:130px!important}
      .plotao-network-claim{gap:4px;margin-top:1px;margin-left:28px}
      .plotao-network-pin{width:16px;height:19px;flex-basis:16px}
      .plotao-network-pin svg{width:16px;height:19px}
      .plotao-network-copy{gap:1px}
      .plotao-network-copy strong{font-size:8.5px}
      .plotao-network-copy>span{font-size:7.4px}
    }
    @media(max-width:430px){
      .head{height:72px}
      .head .logo img{width:116px!important}
      .plotao-network-claim{margin-left:24px}
      .plotao-network-copy strong{font-size:7.6px}
      .plotao-network-copy>span{font-size:6.6px}
    }
  `;
  document.head.appendChild(style);
})();
