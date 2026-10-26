(function(){
  function hideYabSplash(){
    var splash=document.getElementById('yabSplash');
    if(!splash)return;
    window.setTimeout(function(){splash.classList.add('yab-splash-hide');window.setTimeout(function(){if(splash.parentNode)splash.parentNode.removeChild(splash);},220);},2000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideYabSplash,{once:true});
  else hideYabSplash();
})();
