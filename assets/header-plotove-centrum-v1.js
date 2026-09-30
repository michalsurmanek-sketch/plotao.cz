(()=>{
  const header=document.querySelector('.head');
  const logo=header?.querySelector('a.logo');
  const target=document.querySelector('#locationStep .title');
  if(!header||!logo||!target||target.querySelector('.plotao-network-claim'))return;

  const claim=document.createElement('span');
  claim.className='plotao-network-claim';
  claim.setAttribute('aria-label','Plotové centrum – Největší síť prodejen plotů v ČR');
  claim.innerHTML='<span class="plotao-network-pin" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 22s7-6.1 7-13A7 7 0 1 0 5 9c0 6.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2.7"/></svg></span><span class="plotao-network-copy"><strong>PLOTOVÉ CENTRUM</strong><span>Největší síť prodejen plotů v ČR</span></span>';
  target.appendChild(claim);

  const style=document.createElement('style');
  style.dataset.plotaoNetworkClaim='1';
  style.textContent=`
    .head{height:64px}
    .head .logo{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;text-decoration:none;line-height:1}
    .head .logo img{display:block;width:190px;height:auto}
    .location-step .title{position:relative;align-items:center;min-height:48px;padding-right:310px}
    .plotao-network-claim{position:absolute;right:0;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:7px;white-space:nowrap}
    .plotao-network-pin{display:grid;place-items:center;width:25px;height:29px;flex:0 0 25px}
    .plotao-network-pin svg{display:block;width:25px;height:29px;fill:#07915d}
    .plotao-network-pin circle{fill:#fff}
    .plotao-network-copy{display:flex;flex-direction:column;gap:3px;line-height:1.05}
    .plotao-network-copy strong{font-size:13px;font-weight:900;color:#07864f;letter-spacing:-.15px}
    .plotao-network-copy>span{font-size:12px;font-weight:500;color:#17251e;letter-spacing:-.15px}
    @media(min-width:1000px){
      .head .logo img{width:190px}
      .plotao-network-copy strong{font-size:14px}
      .plotao-network-copy>span{font-size:13px}
    }
    @media(max-width:860px){
      .location-step .title{align-items:flex-start;flex-wrap:wrap;padding-right:0}
      .plotao-network-claim{position:static;transform:none;flex:1 0 100%;margin:8px 0 0 43px;white-space:normal}
      .plotao-network-pin{width:20px;height:23px;flex-basis:20px}
      .plotao-network-pin svg{width:20px;height:23px}
    }
    @media(max-width:680px){
      .head{height:60px}
      .head .logo img{width:130px!important}
      .location-step .title{min-height:0}
      .plotao-network-claim{gap:4px;margin-top:8px;margin-left:43px}
      .plotao-network-pin{width:17px;height:20px;flex-basis:17px}
      .plotao-network-pin svg{width:17px;height:20px}
      .plotao-network-copy{gap:1px}
      .plotao-network-copy strong{font-size:9px}
      .plotao-network-copy>span{font-size:8px}
    }
    @media(max-width:430px){
      .head{height:58px}
      .head .logo img{width:116px!important}
      .plotao-network-claim{margin-left:43px}
      .plotao-network-copy strong{font-size:8.5px}
      .plotao-network-copy>span{font-size:7.5px}
    }
  `;
  document.head.appendChild(style);
})();
