(()=>{
  window.PLOTAO_LEAD_TRANSPORT_CONFIG=Object.freeze({
    enabled:false,
    endpoint:'',
    allowedOrigins:[]
  });

  if(!document.querySelector('script[data-plotao-mesh-showcase]')){
    const script=document.createElement('script');
    script.src='/assets/mesh-showcase-v1.js?v=20260917-1';
    script.defer=true;
    script.dataset.plotaoMeshShowcase='1';
    document.head.appendChild(script);
  }
})();
