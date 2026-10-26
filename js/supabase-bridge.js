/* اتصال یاب به Supabase: اصلاح مدیر، رویداد و گزارش */
(function(){
  const URL='https://jtzvidnofailzguumruf.supabase.co';
  const KEY='sb_publishable_KjZvFj9Fp5UgzXRly-C6hg_WQXntByW';
  if(!window.supabase || !window.supabase.createClient) return;
  const db=window.supabase.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  window.yabSupabase=db;
  window.yabCorrectionRows=[];
  // تازه‌خوانی هنگام هر تحلیل تا اصلاح‌های پنل بدون انتشار نسخه جدید هم اعمال شوند.
  window.yabRefreshCorrections=async function(){
    try {
      const {data,error}=await db.from('yab_corrections')
        .select('word,corrected_root,correction_type,counts_as_error,updated_at')
        .order('updated_at',{ascending:false}).limit(2000);
      if(!error && Array.isArray(data)) window.yabCorrectionRows=data;
      else if(error) console.debug('Yab corrections unavailable:',error.message);
    } catch(e){console.debug('Yab corrections unavailable.');}
    return window.yabCorrectionRows;
  };
  window.yabCorrectionsReady=window.yabRefreshCorrections();
  window.yabLogEvent=async function(event_type,word,root,error_type){
    try { const {error}=await db.from('yab_events').insert({event_type,word:String(word||'').slice(0,160)||null,root:root==null?null:String(root).slice(0,160),error_type:error_type||null}); if(error)console.debug('Yab event not stored:',error.message); }
    catch(e){console.debug('Yab event logging unavailable.');}
  };
  window.yabReportError=async function(word,reported_root,details,category){
    try { const {error}=await db.from('yab_error_reports').insert({word:String(word||'').slice(0,160)||null,reported_root:reported_root==null?null:String(reported_root).slice(0,160),details:details==null?null:String(details).slice(0,1000),is_read:false,category:category||'unclassified',counts_as_error:!['proper_noun','not_error','noun'].includes(category)}); if(error)throw error; return true; }
    catch(e){console.warn('ثبت گزارش ممکن نشد:',e.message||e);return false;}
  };
  // هر بار بازشدن صفحه در آمار روزانه ثبت می‌شود؛ به جست‌وجو وابسته نیست.
  try { db.rpc('yab_record_visit').then(({error})=>{if(error)console.debug('Yab visit counter unavailable:',error.message);}); } catch(e) {}
  try { db.channel('yab-corrections-live').on('postgres_changes',{event:'*',schema:'public',table:'yab_corrections'},()=>{
    window.yabCorrectionsReady=window.yabRefreshCorrections();
  }).subscribe(); } catch(e) {}
})();