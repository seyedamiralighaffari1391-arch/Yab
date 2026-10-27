/* یاب — موتور مستقل ریشه‌یابی و هم‌خانواده‌سازی
 * منطق صرفی و داده‌های مرتبط در این فایل نگهداری می‌شوند.
 * app-core.js فقط رابط کاربری و هماهنگی بخش‌ها را مدیریت می‌کند.
 */
(function (global) {
  // ادغام حروف هم‌جنس (مثلاً ا + ا → آ)
  function applyIdgham(word) {
    const SKIP = /[\u064B-\u0650\u0652\u0670]/;
    const SHADDA = '\u0651';
    const ALEF = 'اأإآٱ', WAW = 'وؤ', YEH = 'يىی';
    const getBase = c => { if (ALEF.includes(c)) return 'alef'; if (WAW.includes(c)) return 'waw'; if (YEH.includes(c)) return 'yeh'; return null; };
    let result = '', i = 0;
    while (i < word.length) {
      const ch = word[i];
      if (SKIP.test(ch) || ch === SHADDA) { result += ch; i++; continue; }
      let j = i + 1;
      while (j < word.length && SKIP.test(word[j])) j++;
      if (j < word.length) {
        const b1 = getBase(ch), b2 = getBase(word[j]);
        if (b1 && b1 === b2) {
          if (b1 === 'alef') result += 'آ';
          else if (b1 === 'waw') result += 'و';
          else if (b1 === 'yeh') result += 'ي';
          i = j + 1; continue;
        }
      }
      result += ch; i++;
    }
    return result;
  }

  // اصلاح افعال معتل (مثل قال → قول)
  function correctWeakForm(root, form) {
    const weakLetters = new Set(['و', 'ی', 'ي', 'ا', 'أ', 'إ', 'آ', 'ٱ']);
    const isWeakChar = c => weakLetters.has(c);
    const norm = c => { if (c === 'أ' || c === 'إ' || c === 'آ' || c === 'ٱ') return 'ا'; if (c === 'ی') return 'ي'; return c; };
    const [f, a, l] = root.split('').map(norm);
    const firstW = isWeakChar(f), midW = isWeakChar(a), lastW = isWeakChar(l);
    if (!firstW && !midW && !lastW) return form;
    let result = form;
    const DIA = '[\\u064B-\\u065F\\u0670]';
    if (firstW && !midW && !lastW) {
      const wk = f;
      try { const re1 = new RegExp('^([یتنأ])(' + DIA + '*)' + wk + 'ْ([\\u0621-\\u064A])(' + DIA + '?)(.*)$'); if (re1.test(result)) result = result.replace(re1, '$1$2$3ِ$5'); } catch(e){}
      try { const re2 = new RegExp('^ا(' + DIA + '*)' + wk + 'ْ([\\u0621-\\u064A])(' + DIA + '*)(.*)$'); if (re2.test(result)) result = result.replace(re2, '$2ِ$4'); } catch(e){}
    }
    if (!firstW && !midW && lastW) {
      if (result.length >= 2) { const last = result[result.length - 1]; const prev = result[result.length - 2]; if (/[\u064B-\u065F]/.test(last) && isWeakChar(prev)) result = result.slice(0, -1); }
      if (result.length >= 2) { const last = result[result.length - 1]; const prev = result[result.length - 2]; if (last === prev && isWeakChar(last)) result = result.slice(0, -1); }
    }
    return result;
  }

  // کلمات رایج برای هر ریشه — به‌صورت دستی اضافه شده
  const COMMON_WORDS_BY_ROOT = {
    "سلم": ["مُسْلِم","مُسْلِمَة","مُسْلِمُون","مُسْلِمِين","مُسْلِمَات","تَسْلِيم","إِسْلَام","إِسْلَامِيّ","إِسْلَامِيَّة","مُسَالَمَة","مُسَالِم","سَلَام","سَلَامَة","سَلَامِيّ","سَلِيم","سَلِيمَة","سَالِم","سَالِمَة","أَسْلَمَ","يُسْلِمُ","سَلَّمَ","يُسَلِّمُ","تَسَلَّمَ","اِسْتِسْلَام","مُسْتَسْلِم","سِلْم","سِلْمِيّ","سَلَم","سُلَّم","سَلَالِم"],
    "علم": ["عِلْم","عِلْمِيّ","عِلْمِيَّة","عُلُوم","عَالِم","عَالِمَة","عَالِمُون","عُلَمَاء","عَلِيم","عَلَّام","مُعَلِّم","مُعَلِّمَة","مُتَعَلِّم","تَعْلِيم","تَعْلِيمِيّ","تَعَلُّم","مَعْلُوم","مَعْلُومَة","مَعْلُومَات","أَعْلَام","عَلَامَة","عَلَّمَ","يُعَلِّمُ","تَعَلَّمَ","اِسْتِعْلَام","مُسْتَعْلِم","مَعْلَم","مَعَالِم"],
    "كتب": ["كِتَاب","كِتَابَة","كِتَابِيّ","كُتُب","كَاتِب","كَاتِبَة","كُتَّاب","مَكْتُوب","مَكْتُوبَة","مَكْتَب","مَكْتَبَة","كَتَبَ","يَكْتُبُ","اُكْتُبْ","مُكَاتَبَة","اِسْتِكْتَاب","كُتَيِّب"],
    "درس": ["دَرْس","دُرُوس","دَرَسَ","يَدْرُسُ","دَارِس","دَارِسَة","مَدْرُوس","مَدْرَسَة","مَدَارِس","دِرَاسَة","دِرَاسِيّ","مُدَرِّس","مُدَرِّسَة","تَدْرِيس"],
    "فتح": ["فَتْح","فُتُوح","فَاتِح","فَاتِحَة","مَفْتُوح","مَفْتُوحَة","مَفَاتِيح","مِفْتَاح","فَتَحَ","يَفْتَحُ","اِفْتَحْ","فَتَّاح","تَفْتِيح","اِفْتِتَاح","اِسْتِفْتَاح"],
    "تهم": ["تُهْمَة","تُهَم","تُهْمَات","تُهْمِيّ","مُتَّهَم","مُتَّهَمَة","اِتِّهَام","اِتِّهَامَات","اِتِّهَامِيّ"],
    "وهم": ["وَهْم","وُهُوم","أَوْهَام","وَهْمِيّ","وَاهِم","مَوْهُوم","تَوْهِيم","اِتِّهَام","مُتَّهَم","تَوْهُّم","مُتَوَهِّم"]
  };

  // از روی کلمه و ریشه، الگوش رو حساب می‌کنه (مثلاً مَفعول)
  function computePattern(word, root) {
    const diacriticRe = /[\u064B-\u065F\u0670]/;
    const letters = [];
    let i = 0;
    while (i < word.length) {
      if (diacriticRe.test(word[i])) { i++; continue; }
      const c = word[i]; let dia = ''; i++;
      while (i < word.length && diacriticRe.test(word[i])) { dia += word[i]; i++; }
      letters.push({ char: c, dia });
    }
    const normCh = c => c.replace(/[أإآٱ]/, 'ا').replace(/[ئيىی]/, 'ي').replace(/[ؤ]/, 'و').replace(/ة/, 'ه').replace(/ک/, 'ك');
    const rNorm = root.split('').map(normCh);
    const positions = []; let ri = 0;
    for (let k = 0; k < letters.length && ri < 3; k++) {
      if (normCh(letters[k].char) === rNorm[ri]) { positions.push(k); ri++; }
    }
    if (positions.length !== 3) return null;
    let pat = '';
    for (let k = 0; k < letters.length; k++) {
      const idx = positions.indexOf(k);
      pat += (idx === 0 ? 'ف' : idx === 1 ? 'ع' : idx === 2 ? 'ل' : letters[k].char) + letters[k].dia;
    }
    return pat;
  }

  global.YabMorphologySupport = { applyIdgham, correctWeakForm, computePattern, COMMON_WORDS_BY_ROOT };

})(window);

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


/* یاب: ماژول مستقل تولید هم‌خانواده‌ها؛ الگوها و قواعد نسخه اصلی حفظ شده‌اند. */
(function (global) {
  function create(deps) {
    const { correctWeakForm, applyIdgham, computePattern, COMMON_WORDS_BY_ROOT, customDB } = deps;
    return function generateFamily(root, cnt=24) {
    if (!root || root.length !== 3) return [];
    cnt = Math.max(1, Math.min(255, parseInt(cnt) || 24));
    const [f, a, l] = root.split('');

    const ARABIC_FAMILY_PATTERNS = [
      "فَعَلَ","فَعِلَ","فَعُلَ","فَعَّلَ","فَاعَلَ","أَفْعَلَ","تَفَعَّلَ","تَفَاعَلَ",
      "اِنْفَعَلَ","اِفْتَعَلَ","اِفْعَلَّ","اِسْتَفْعَلَ",
      "فَعَلَتْ","فَعَلَتَا","فَعَلُوا","فَعَلْنَ","فَعَلْتُ","فَعَلْنَا","فَعَلْتَ","فَعَلْتِ","فَعَلْتُمَا","فَعَلْتُمْ","فَعَلْتُنَّ",
      "فَعَّلَتْ","فَعَّلُوا","فَعَّلْتُ","فَعَّلْنَا","فَعَّلْتَ","فَعَّلْتِ",
      "فَاعَلَتْ","فَاعَلُوا","فَاعَلْتُ","فَاعَلْنَا",
      "أَفْعَلَتْ","أَفْعَلُوا","أَفْعَلْتُ","أَفْعَلْنَا",
      "تَفَعَّلَتْ","تَفَعَّلُوا","تَفَعَّلْتُ","تَفَعَّلْنَا",
      "تَفَاعَلَتْ","تَفَاعَلُوا","تَفَاعَلْتُ","تَفَاعَلْنَا",
      "اِنْفَعَلَتْ","اِنْفَعَلُوا","اِنْفَعَلْتُ",
      "اِفْتَعَلَتْ","اِفْتَعَلُوا","اِفْتَعَلْتُ",
      "اِسْتَفْعَلَتْ","اِسْتَفْعَلُوا","اِسْتَفْعَلْتُ","اِسْتَفْعَلْنَا",
      "يَفْعُلُ","يَفْعِلُ","يَفْعَلُ","يُفَعِّلُ","يُفَاعِلُ","يُفْعِلُ",
      "يَتَفَعَّلُ","يَتَفَاعَلُ","يَنْفَعِلُ","يَفْتَعِلُ","يَفْعَلُّ","يَسْتَفْعِلُ",
      "يَفْعُلَانِ","يَفْعُلُونَ","يَفْعُلْنَ","تَفْعُلُ","تَفْعُلَانِ","تَفْعُلُونَ","تَفْعُلِينَ","تَفْعُلْنَ",
      "أَفْعُلُ","نَفْعُلُ",
      "يُفَعِّلُونَ","تُفَعِّلُ","تُفَعِّلِينَ","أُفَعِّلُ","نُفَعِّلُ",
      "يُفَاعِلُونَ","تُفَاعِلُ","أُفَاعِلُ","نُفَاعِلُ",
      "يُفْعِلُونَ","تُفْعِلُ","أُفْعِلُ","نُفْعِلُ",
      "يَتَفَعَّلُونَ","تَتَفَعَّلُ","أَتَفَعَّلُ","نَتَفَعَّلُ",
      "يَتَفَاعَلُونَ","تَتَفَاعَلُ","أَتَفَاعَلُ","نَتَفَاعَلُ",
      "يَنْفَعِلُونَ","تَنْفَعِلُ","أَنْفَعِلُ","نَنْفَعِلُ",
      "يَفْتَعِلُونَ","تَفْتَعِلُ","أَفْتَعِلُ","نَفْتَعِلُ",
      "يَسْتَفْعِلُونَ","تَسْتَفْعِلُ","أَسْتَفْعِلُ","نَسْتَفْعِلُ",
      "سَيَفْعُلُ","سَيَفْعِلُ","سَيَفْعَلُ","سَيُفَعِّلُ","سَيُفَاعِلُ","سَيُفْعِلُ",
      "سَيَتَفَعَّلُ","سَيَتَفَاعَلُ","سَيَنْفَعِلُ","سَيَفْتَعِلُ","سَيَسْتَفْعِلُ",
      "سَتَفْعُلُ","سَتَفْعُلِينَ","سَتَفْعُلُونَ","سَأَفْعُلُ","سَنَفْعُلُ",
      "سَيُفَعِّلُونَ","سَتُفَعِّلُ","سَأُفَعِّلُ","سَنُفَعِّلُ",
      "سَيُفَاعِلُونَ","سَتُفَاعِلُ","سَأُفَاعِلُ","سَنُفَاعِلُ",
      "سَيُفْعِلُونَ","سَتُفْعِلُ","سَأُفْعِلُ","سَنُفْعِلُ",
      "سَيَتَفَعَّلُونَ","سَتَتَفَعَّلُ","سَأَتَفَعَّلُ","سَنَتَفَعَّلُ",
      "سَيَتَفَاعَلُونَ","سَتَتَفَاعَلُ","سَأَتَفَاعَلُ","سَنَتَفَاعَلُ",
      "سَيَسْتَفْعِلُونَ","سَتَسْتَفْعِلُ","سَأَسْتَفْعِلُ","سَنَسْتَفْعِلُ",
      "فَاعِل","فَاعِلَة","فَاعِلَان","فَاعِلَتَان","فَاعِلَات","فَاعِلُون","فَاعِلِين",
      "مُفَعِّل","مُفَعِّلَة","مُفَعِّلُون","مُفَعِّلِين","مُفَعِّلَات",
      "مُفَاعِل","مُفَاعِلَة","مُفَاعِلُون","مُفَاعِلِين",
      "مُفْعِل","مُفْعِلَة",
      "مُتَفَعِّل","مُتَفَعِّلَة","مُتَفَعِّلُون","مُتَفَعِّلِين",
      "مُتَفَاعِل","مُتَفَاعِلَة","مُتَفَاعِلُون","مُتَفَاعِلِين",
      "مُنْفَعِل","مُنْفَعِلَة","مُنْفَعِلُون","مُنْفَعِلِين",
      "مُفْتَعِل","مُفْتَعِلَة","مُفْتَعِلُون","مُفْتَعِلِين",
      "مُسْتَفْعِل","مُسْتَفْعِلَة","مُسْتَفْعِلُون","مُسْتَفْعِلِين",
      "مَفْعُول","مَفْعُولَة","مَفْعُولَان","مَفْعُولَتَان","مَفْعُولَات","مَفْعُولُون","مَفْعُولِين",
      "مُفَعَّل","مُفَعَّلَة","مُفَعَّلُون","مُفَعَّلِين",
      "مُفَاعَل","مُفَاعَلَة",
      "مُفْعَل","مُفْعَلَة",
      "مُتَفَعَّل","مُتَفَعَّلَة",
      "مُتَفَاعَل","مُتَفَاعَلَة",
      "مُنْفَعَل","مُنْفَعَلَة",
      "مُفْتَعَل","مُفْتَعَلَة",
      "مُسْتَفْعَل","مُسْتَفْعَلَة",
      "فَعَّال","فَعَّالَة","فَعَّالَان","فَعَّالَات","فَعَّالُون","فَعَّالِين",
      "فَعِيل","فَعِيلَة","فَعِيلَان","فَعِيلَتَان","فَعِيلَات","فَعِيلُون","فَعِيلِين",
      "فَعُول","فَعُولَة","فَعُولَان","فَعُولَات",
      "أَفْعَل","فَعْلَاء","فُعْلَى","فَعْلَى",
      "فَعْل","فِعْل","فُعْل","فَعَل",
      "فِعَالَة","فَعَالَة","فُعُولَة","فَعُولَة","فَعِيلَة",
      "تَفْعِيل","تَفْعِيلَة","تَفْعِيلَات",
      "تَفَعُّل","تَفَعُّلَات",
      "تَفَاعُل","تَفَاعُلَات",
      "إِفْعَال","إِفْعَالَات","إِفْعَالِيَّة",
      "مُفَاعَلَة","مُفَاعَلَات",
      "اِنْفِعَال","اِنْفِعَالَات",
      "اِفْتِعَال","اِفْتِعَالَات",
      "اِفْعِلَال",
      "اِسْتِفْعَال","اِسْتِفْعَالَات",
      "فَعَال","فِعَال","فُعَال","فُعُول",
      "أَفْعَال","أَفَاعِل",
      "فُعَّال","فُعَّالَة","فُعَلَاء",
      "فَعَلَة","فَعْلَة","فِعْلَة","فُعْلَة",
      "فَعَلَات","فَعْلَات","فِعْلَات","فُعْلَات",
      "مَفْعَل","مَفْعِل","مَفْعَلَة",
      "مِفْعَل","مِفْعَال","مِفْعَلَة",
      "مَفَاعِل","مَفَاعِيل","فَوَاعِل",
      "فَعَائِل","فَعَالِيل",
      "فُعْلَان","فِعْلَان","فَعَلَان","فَعْلَان",
      "فُعْلَانَة","فَعْلَانَة",
      "فِعْلِيّ","فَعْلِيّ","فَعَلِيّ","فَعَّالِيّ","فُعْلَوِيّ",
      "فِعْلِيَّة","فَعْلِيَّة","فَعَلِيَّة","فَعَّالِيَّة",
      "فِعْلِيَّات","فَعْلِيَّات","فَعَلِيَّات",
      "فِعْلِيّون","فِعْلِيّين","فَعْلِيّون","فَعْلِيّين",
      "فُعَيْل","فُعَيِّل","فُعَيِّلَة","فُعَيِّلَات",
      "فُعَيْعِل","فُعَيْعِيل",
      "مَفْعَلَة","مَفْعِلَة","مَفْعَلِيَّة",
      "مِفْعَال","مِفْعَالَة",
      "الْفَاعِل","الْمَفْعُول","الْفَعْل","الْفِعْل","الْفُعْل",
      "الْفَعَّال","الْفَعِيل","الْفَعُول","الْفَاعِلَة","الْمَفْعُولَة",
      "الْمُفَعِّل","الْمُفَاعِل","الْمُفْعِل","الْمُتَفَعِّل","الْمُتَفَاعِل",
      "الْمُسْتَفْعِل","الْمُنْفَعِل","الْمُفْتَعِل","الْمَفْعَل","الْمَفْعِل",
      "الْفُعُول","الْفِعَال","الْفَعَال","الْفُعَّال","الْفُعَلَاء","الْأَفْعَال",
      "الْفِعْلِيّ","الْفَعْلِيّ","الْفَعَلِيّ","الْفِعْلِيَّة","الْفَعْلِيَّة","الْفَعَلِيَّة",
      "فُعْلُل","فُعْلُلَة","فُعْلَل","فُعْلَلَة",
      "فِعْلِل","فِعْلِلَة","فَعْلَل","فَعْلَلَة",
      "فِعْلِيل","فِعْلِيلَة","فُعْلُول","فُعْلُولَة",
      "فَعُولَاء","فَعِيلَاء"
    ];

    function normalizeSkeleton(s) {
      return s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .replace(/[أإآٱٲٳٵ]/g, 'ا').replace(/[ئيىی]/g, 'ي')
        .replace(/[ؤ]/g, 'و').replace(/ة/g, 'ه').replace(/ک/g, 'ك');
    }

    const result = [];
    // هدف، تولید صورت‌های صرفی تا تعداد درخواستی است؛ صحت لغت‌نامه‌ای شرط نیست.
    // پس صورت‌های مشابه یا تکراری را حذف نمی‌کنیم و تعداد دقیق قابل تولید می‌ماند.
    const addWord = (w, pat) => {
      if (!w) return;
      const wCorrected = correctWeakForm(root, w);
      const w2 = applyIdgham(wCorrected);
      result.push({ word: w2, pattern: pat || computePattern(w2, root) });
    };

    const commonList = COMMON_WORDS_BY_ROOT[root] || [];
    for (const w of commonList) { addWord(w, null); if (result.length >= cnt) return result.slice(0, cnt); }
    for (const [w, r] of Object.entries(customDB)) { if (r === root) addWord(w, null); if (result.length >= cnt) return result.slice(0, cnt); }

    function applyPattern(pattern) {
      let out = '';
      for (const ch of pattern) {
        if (ch === 'ف') out += f;
        else if (ch === 'ع') out += a;
        else if (ch === 'ل') out += l;
        else out += ch;
      }
      return out;
    }

    for (const pat of ARABIC_FAMILY_PATTERNS) { addWord(applyPattern(pat), pat); if (result.length >= cnt) return result.slice(0, cnt); }
    return result.slice(0, cnt);
  };
  }
  global.YabFamilyGenerator = { create };
})(window);
