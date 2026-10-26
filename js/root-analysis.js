/* یاب: ماژول مستقل ریشه‌یابی؛ منطق اصلی از نسخه فعلی پروژه استخراج شده است. */
(function (global) {
  function create(deps) {
    const {
      normalize, VALID_ROOTS, PATTERNS_BY_LENGTH, tryPattern,
      customDB, MULTI_ROOT_WORDS, storage
    } = deps;

    const PREFIXES = ['ال','لل','كال','فال','بال','وال','است','مست','تست','يست','نست','ست','سأ','سن','سي','س','ف','و','ي','ل','ب','ك','ت','ن','ا','أ','إ','م','مت','مس','ت','ی'].sort((a,b)=>b.length-a.length);
    const SUFFIXES = ['هايي','هاي','ها','ان','ات','ون','ين','ان','ين','ة','ه','ي','نا','هم','هن','كما','هما','يها','تها','تم','تن','ت','كن','كم','ها','ی','یها','ا'].sort((a,b)=>b.length-a.length);

    function extractRootFromStem(stem) {
    if (stem.length < 3) return null;
    let candidates = [];
    (PATTERNS_BY_LENGTH[stem.length] || []).forEach(pat => {
      let r = tryPattern(pat, stem);
      if (r && r.length === 3) candidates.push(r);
    });
    let best = candidates.find(r => VALID_ROOTS.has(r));
    if (!best && candidates.length) best = candidates.find(r => r[0] === stem[0]) || candidates[0];
    return best || null;
  }

    function correctWeakRoot(r) {
    if (VALID_ROOTS.has(r)) return r;
    let weaks = ['و', 'ي', 'ی', 'ا'];
    let chars = r.split('');
    for (let i = 0; i < chars.length; i++) {
      if (weaks.includes(chars[i])) {
        for (let sub of weaks) {
          if (sub === chars[i]) continue;
          let tmp = [...chars]; tmp[i] = sub;
          let nr = tmp.join('');
          if (VALID_ROOTS.has(nr)) return nr;
        }
      }
    }
    return r;
  }

    function morphologicalAnalysis(word) {
    let n = normalize(word);
    if (!n || n.length < 2) return null;
    let r = extractRootFromStem(n);
    if (r) return correctWeakRoot(r);
    let candidates = [];
    for (let p of PREFIXES) if (n.startsWith(p)) { let s = n.slice(p.length); if (s.length>=3) { let rr = extractRootFromStem(s); if (rr) candidates.push(rr); } }
    for (let s of SUFFIXES) if (n.endsWith(s)) { let stem = n.slice(0, -s.length); if (stem.length>=3) { let rr = extractRootFromStem(stem); if (rr) candidates.push(rr); } }
    for (let p of PREFIXES) if (n.startsWith(p)) { let after = n.slice(p.length); for (let s of SUFFIXES) if (after.endsWith(s)) { let stem = after.slice(0, -s.length); if (stem.length>=3) { let rr = extractRootFromStem(stem); if (rr) candidates.push(rr); } } }
    if (candidates.length) { let best = candidates.find(rr => VALID_ROOTS.has(rr)); if (!best) best = correctWeakRoot(candidates[0]); return best; }
    if (n.length===2 && /^[\u0600-\u06FF]+$/.test(n)) { let d = n[0]+n[1]+n[1]; return d; }
    return null;
  }

    function getOnlineCorrection(word) {
    const n = normalize(word);
    return (window.yabCorrectionRows || []).find(x => normalize(x.word || '') === n) || null;
  }

    function splitCorrectionRoots(value) {
    return [...new Set(String(value || '').split(/[,،؛;|\/\s]+/).map(x => normalize(x)).filter(x => x.length === 3))];
  }

    function findRoot(word) {
    let n = normalize(word);
    if (!n || n.length < 2) return null;
    // اصلاح‌های مدیر بر داده‌های محلی و الگوریتم اولویت دارند؛ اسم خاص عمداً ریشه نمی‌گیرد.
    const onlineCorrection = getOnlineCorrection(n);
    if (onlineCorrection) {
      const type = onlineCorrection.correction_type || 'single_root';
      if (type === 'proper_noun' || type === 'multi_root') return null;
      const corrected = normalize(onlineCorrection.corrected_root || '');
      if ((type === 'single_root' || type === 'noun') && corrected.length === 3) return corrected;
    }
    if (customDB[n] && VALID_ROOTS.has(customDB[n]) && customDB[n].length===3) return customDB[n];
    let r = morphologicalAnalysis(n);
    if (r && r.length===3) { if (VALID_ROOTS.has(r)) { customDB[n] = r; storage.setItem('yab_morph_custom_v2', JSON.stringify(customDB)); } return r; }
    return null;
  }

    function findMultiRoots(word) {
    const n = normalize(word);
    const onlineCorrection = getOnlineCorrection(n);
    if (onlineCorrection) {
      if ((onlineCorrection.correction_type || 'single_root') !== 'multi_root') return null;
      const roots = splitCorrectionRoots(onlineCorrection.corrected_root);
      return roots.length > 1 ? roots : null;
    }
    if (!MULTI_ROOT_WORDS[n]) return null;
    const unique = [...new Set(MULTI_ROOT_WORDS[n].filter(r => r && r.length === 3))];
    return unique.length ? unique : null;
  }
    return {
      extractRootFromStem,
      correctWeakRoot,
      morphologicalAnalysis,
      getOnlineCorrection,
      splitCorrectionRoots,
      findRoot,
      findMultiRoots
    };
  }
  global.YabRootAnalysis = { create };
})(window);
