'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';

// Comprehensive language detection function supporting 130+ languages
const detectLanguage = (text: string): string => {
  // If text is very short, default to English
  if (text.length < 10) {
    return 'en';
  }

  // Check if text is predominantly English (common words, punctuation, etc.)
  const englishPattern = /^[a-zA-Z\s\.,!?'"()-]+$/;
  if (englishPattern.test(text)) {
    return 'en';
  }

  // Check if text contains mostly English words with some special characters
  const englishWords = text.toLowerCase().match(/[a-z]+/g) || [];
  const totalWords = text.split(/\s+/).filter(word => word.length > 0).length;
  if (totalWords > 0 && englishWords.length / totalWords > 0.7) {
    return 'en';
  }

  // Unicode script-based detection for non-Latin scripts
  const scriptPatterns = {
    // Arabic and related scripts
    ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
    fa: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
    ur: /[\u0600-\u06FF].*[\u0627\u0628\u067E\u062A\u0679]/,
    ku: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
    ps: /[\u0600-\u06FF].*[\u067E\u0686\u0698\u06A9\u06AF\u06CC]/,
    sd: /[\u0600-\u06FF].*[\u0633\u0646\u0688\u06CC]/,
    ug: /[\u0600-\u06FF].*[\u0626\u06C7\u0649\u063A\u06C7\u0631]/,
    ckb: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
    
    // Hebrew and Yiddish
    he: /[\u0590-\u05FF]/,
    yi: /[\u0590-\u05FF]/,
    
    // South Asian scripts - more conservative detection
    hi: /[\u0900-\u097F]{3,}/, // Require at least 3 Devanagari characters
    bn: /[\u0980-\u09FF]{3,}/, // Require at least 3 Bengali characters
    ta: /[\u0B80-\u0BFF]{3,}/, // Require at least 3 Tamil characters
    te: /[\u0C00-\u0C7F]{3,}/, // Require at least 3 Telugu characters
    ml: /[\u0D00-\u0D7F]{3,}/, // Require at least 3 Malayalam characters
    kn: /[\u0C80-\u0CFF]{3,}/, // Require at least 3 Kannada characters
    gu: /[\u0A80-\u0AFF]{3,}/, // Require at least 3 Gujarati characters
    pa: /[\u0A00-\u0A7F]{3,}/, // Require at least 3 Gurmukhi characters
    or: /[\u0B00-\u0B7F]{3,}/, // Require at least 3 Odia characters
    as: /[\u0980-\u09FF]{3,}/, // Require at least 3 Assamese characters (same as Bengali)
    mr: /[\u0900-\u097F]{3,}/, // Require at least 3 Marathi characters (same as Devanagari)
    ne: /[\u0900-\u097F]{3,}/, // Require at least 3 Nepali characters (same as Devanagari)
    si: /[\u0D80-\u0DFF]{3,}/, // Require at least 3 Sinhala characters
    my: /[\u1000-\u109F]{3,}/, // Require at least 3 Myanmar characters
    km: /[\u1780-\u17FF]{3,}/, // Require at least 3 Khmer characters
    lo: /[\u0E80-\u0EFF]{3,}/, // Require at least 3 Lao characters
    
    // East Asian scripts - more conservative detection
    zh: /[\u4e00-\u9fff]{2,}/, // Require at least 2 Chinese characters
    ja: /[\u3040-\u309f\u30a0-\u30ff]{2,}/, // Require at least 2 Japanese characters
    ko: /[\uac00-\ud7af]{2,}/, // Require at least 2 Korean characters
    th: /[\u0E00-\u0E7F]{3,}/, // Require at least 3 Thai characters
    
    // European scripts - more conservative detection
    ru: /[\u0400-\u04FF]{3,}/, // Require at least 3 Cyrillic characters
    be: /[\u0400-\u04FF]{3,}/, // Require at least 3 Belarusian characters
    uk: /[\u0400-\u04FF]{3,}/, // Require at least 3 Ukrainian characters
    bg: /[\u0400-\u04FF]{3,}/, // Require at least 3 Bulgarian characters
    sr: /[\u0400-\u04FF]{3,}/, // Require at least 3 Serbian characters
    mk: /[\u0400-\u04FF]{3,}/, // Require at least 3 Macedonian characters
    
    // Georgian and Armenian - more conservative detection
    ka: /[\u10A0-\u10FF]{3,}/, // Require at least 3 Georgian characters
    hy: /[\u0530-\u058F]{3,}/, // Require at least 3 Armenian characters
    
    // Central Asian scripts - more conservative detection
    kk: /[\u0400-\u04FF]{3,}/, // Require at least 3 Kazakh characters
    ky: /[\u0400-\u04FF]{3,}/, // Require at least 3 Kyrgyz characters
    uz: /[\u0400-\u04FF]{3,}/, // Require at least 3 Uzbek characters
    tk: /[\u0400-\u04FF]{3,}/, // Require at least 3 Turkmen characters
    tg: /[\u0400-\u04FF]{3,}/, // Require at least 3 Tajik characters
    mn: /[\u1800-\u18AF]{3,}/, // Require at least 3 Mongolian characters
    
    // African scripts - more conservative detection
    am: /[\u1200-\u137F]{3,}/, // Require at least 3 Amharic characters
    ti: /[\u1200-\u137F]{3,}/, // Require at least 3 Tigrinya characters
    om: /[\u1200-\u137F]{3,}/, // Require at least 3 Oromo characters
  };

  // Check for script-based detection first
  for (const [lang, pattern] of Object.entries(scriptPatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Enhanced word-based detection for Latin script languages
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/).filter(word => word.length > 2);
  
  if (words.length > 0) {
    const languageIndicators = {
      // Romance languages
      es: ['que', 'con', 'una', 'por', 'para', 'como', 'más', 'pero', 'sus', 'les', 'del', 'las', 'los', 'este', 'esta', 'son', 'están', 'tienen', 'hacer', 'decir'],
      fr: ['que', 'des', 'les', 'une', 'sur', 'avec', 'son', 'dans', 'pour', 'tout', 'est', 'pas', 'nous', 'vous', 'leur', 'être', 'avoir', 'faire', 'dire', 'cette'],
      it: ['che', 'con', 'una', 'per', 'sono', 'come', 'più', 'dalla', 'anche', 'loro', 'questo', 'questa', 'della', 'essere', 'avere', 'fare', 'dire', 'questo'],
      pt: ['que', 'com', 'uma', 'para', 'são', 'como', 'mais', 'pela', 'seus', 'tem', 'não', 'está', 'muito', 'ser', 'ter', 'fazer', 'dizer', 'este', 'essa'],
      ro: ['ce', 'cu', 'o', 'pentru', 'sunt', 'cum', 'mai', 'din', 'și', 'lor', 'acest', 'această', 'este', 'a', 'avea', 'face', 'spune'],
      ca: ['que', 'amb', 'una', 'per', 'són', 'com', 'més', 'de', 'i', 'llur', 'aquest', 'aquesta', 'és', 'tenir', 'fer', 'dir'],
      gl: ['que', 'coa', 'unha', 'para', 'son', 'como', 'máis', 'de', 'e', 'seu', 'este', 'esta', 'é', 'ter', 'facer', 'dicir'],
      
      // Germanic languages
      de: ['der', 'die', 'und', 'den', 'das', 'von', 'ist', 'mit', 'auf', 'für', 'sich', 'nicht', 'ein', 'eine', 'auch', 'sein', 'haben', 'machen', 'sagen'],
      nl: ['dat', 'met', 'een', 'voor', 'zijn', 'hoe', 'meer', 'van', 'en', 'hun', 'dit', 'deze', 'is', 'hebben', 'doen', 'zeggen'],
      sv: ['som', 'med', 'en', 'för', 'är', 'hur', 'mer', 'av', 'och', 'deras', 'detta', 'denna', 'är', 'ha', 'göra', 'säga'],
      da: ['som', 'med', 'en', 'for', 'er', 'hvordan', 'mere', 'af', 'og', 'deres', 'dette', 'denne', 'er', 'have', 'gøre', 'sige'],
      no: ['som', 'med', 'en', 'for', 'er', 'hvordan', 'mer', 'av', 'og', 'deres', 'dette', 'denne', 'er', 'ha', 'gjøre', 'si'],
      is: ['sem', 'með', 'einn', 'fyrir', 'er', 'hvernig', 'meira', 'af', 'og', 'þeirra', 'þetta', 'þessi', 'er', 'hafa', 'gera', 'segja'],
      fi: ['joka', 'kanssa', 'yksi', 'varten', 'on', 'miten', 'enemmän', 'ja', 'sekä', 'heidän', 'tämä', 'tämä', 'on', 'olla', 'tehdä', 'sanoa'],
      
      // Slavic languages
      pl: ['który', 'z', 'jeden', 'dla', 'jest', 'jak', 'więcej', 'z', 'i', 'ich', 'ten', 'ta', 'jest', 'mieć', 'robić', 'mówić'],
      cs: ['který', 's', 'jeden', 'pro', 'je', 'jak', 'více', 'z', 'a', 'jejich', 'tento', 'tato', 'je', 'mít', 'dělat', 'říkat'],
      sk: ['ktorý', 's', 'jeden', 'pre', 'je', 'ako', 'viac', 'z', 'a', 'ich', 'tento', 'táto', 'je', 'mať', 'robiť', 'hovoriť'],
      hu: ['amely', 'val', 'egy', 'számára', 'van', 'hogyan', 'több', 'a', 'és', 'azok', 'ez', 'ez', 'van', 'van', 'csinálni', 'mondani'],
      hr: ['koji', 's', 'jedan', 'za', 'je', 'kako', 'više', 'od', 'i', 'njihov', 'ovaj', 'ova', 'je', 'imati', 'raditi', 'reći'],
      sr: ['који', 'с', 'један', 'за', 'је', 'како', 'више', 'од', 'и', 'њихов', 'овај', 'ова', 'је', 'имати', 'радити', 'рећи'],
      bs: ['koji', 's', 'jedan', 'za', 'je', 'kako', 'više', 'od', 'i', 'njihov', 'ovaj', 'ova', 'je', 'imati', 'raditi', 'reći'],
      sl: ['ki', 'z', 'eden', 'za', 'je', 'kako', 'več', 'od', 'in', 'njihov', 'ta', 'ta', 'je', 'imeti', 'delati', 'reči'],
      mk: ['кој', 'со', 'еден', 'за', 'е', 'како', 'повеќе', 'од', 'и', 'нивниот', 'овој', 'оваа', 'е', 'има', 'прави', 'кажува'],
      sq: ['që', 'me', 'një', 'për', 'është', 'si', 'më', 'nga', 'dhe', 'tyre', 'ky', 'kjo', 'është', 'ka', 'bën', 'thotë'],
      el: ['που', 'με', 'ένα', 'για', 'είναι', 'πώς', 'περισσότερο', 'από', 'και', 'τους', 'αυτό', 'αυτή', 'είναι', 'έχει', 'κάνει', 'λέει'],
      
      // Asian languages
      id: ['yang', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dalam', 'dengan', 'dari', 'akan', 'sudah', 'bisa', 'tidak', 'adalah', 'ada', 'membuat', 'mengatakan'],
      ms: ['yang', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dalam', 'dengan', 'dari', 'akan', 'sudah', 'bisa', 'tidak', 'adalah', 'ada', 'membuat', 'mengatakan'],
      jv: ['sing', 'lan', 'iki', 'iku', 'kanggo', 'ing', 'jero', 'karo', 'saka', 'bakal', 'wis', 'bisa', 'ora', 'iku', 'ana', 'gawe', 'ngomong'],
      su: ['anu', 'jeung', 'ieu', 'eta', 'pikeun', 'di', 'jero', 'jeung', 'ti', 'bakal', 'geus', 'bisa', 'henteu', 'eta', 'aya', 'nyieun', 'ngomong'],
      ceb: ['nga', 'ug', 'kini', 'kana', 'para', 'sa', 'sa', 'ug', 'gikan', 'mahimong', 'na', 'makahimo', 'dili', 'kana', 'naa', 'buhat', 'ingon'],
      tl: ['na', 'at', 'ito', 'iyan', 'para', 'sa', 'sa', 'at', 'mula', 'maaari', 'na', 'maaari', 'hindi', 'ito', 'may', 'gawin', 'sabihin'],
      
      // Southeast Asian languages
      tr: ['bir', 'bu', 've', 'de', 'da', 'ile', 'için', 'var', 'olan', 'gibi', 'çok', 'daha', 'ama', 'ne', 'nasıl', 'olmak', 'sahip', 'yapmak', 'söylemek'],
      vi: ['của', 'và', 'có', 'trong', 'với', 'để', 'được', 'cho', 'từ', 'này', 'đó', 'là', 'cũng', 'rất', 'như', 'là', 'có', 'làm', 'nói'],
      th: ['ที่', 'และ', 'มี', 'ใน', 'กับ', 'เพื่อ', 'ได้', 'ให้', 'จาก', 'นี้', 'นั้น', 'เป็น', 'ก็', 'มาก', 'เหมือน', 'เป็น', 'มี', 'ทำ', 'พูด'],
      km: ['ដែល', 'និង', 'មាន', 'ក្នុង', 'ជាមួយ', 'សម្រាប់', 'បាន', 'ឱ្យ', 'ពី', 'នេះ', 'នោះ', 'ជា', 'ក៏', 'ច្រើន', 'ដូច', 'ជា', 'មាន', 'ធ្វើ', 'និយាយ'],
      lo: ['ທີ່', 'ແລະ', 'ມີ', 'ໃນ', 'ກັບ', 'ສຳລັບ', 'ໄດ້', 'ໃຫ້', 'ຈາກ', 'ນີ້', 'ນັ້ນ', 'ເປັນ', 'ກໍ', 'ຫຼາຍ', 'ຄື', 'ເປັນ', 'ມີ', 'ເຮັດ', 'ເວົ້າ'],
      my: ['သော', 'နှင့်', 'ရှိ', 'အတွင်း', 'နှင့်အတူ', 'အတွက်', 'ရ', 'ပေး', 'မှ', 'ဤ', 'ထို', 'ဖြစ်', 'လည်း', 'များ', 'ကဲ့သို့', 'ဖြစ်', 'ရှိ', 'လုပ်', 'ပြော'],
      
      // African languages
      sw: ['ambayo', 'na', 'hii', 'ile', 'kwa', 'katika', 'na', 'kwa', 'kutoka', 'hii', 'ile', 'ni', 'pia', 'sana', 'kama', 'kuwa', 'kuwa', 'kufanya', 'kusema'],
      ha: ['wanda', 'da', 'wannan', 'wancan', 'ga', 'a', 'da', 'da', 'daga', 'wannan', 'wancan', 'ne', 'kuma', 'sosai', 'kamar', 'zama', 'da', 'yi', 'ce'],
      yo: ['ti', 'ati', 'eyi', 'iyen', 'fun', 'ni', 'pẹlu', 'pẹlu', 'lati', 'eyi', 'iyen', 'jẹ', 'tun', 'gan', 'bi', 'jẹ', 'ní', 'ṣe', 'sọ'],
      ig: ['nke', 'na', 'nke', 'nke', 'maka', 'na', 'na', 'na', 'site', 'nke', 'nke', 'bụ', 'kwa', 'nke', 'dị', 'bụ', 'nwere', 'mee', 'kwuo'],
      am: ['የሚሆን', 'እና', 'ይህ', 'ያ', 'ለ', 'ውስጥ', 'እና', 'እና', 'ከ', 'ይህ', 'ያ', 'ነው', 'ም', 'በጣም', 'እንደ', 'ሆን', 'አለው', 'ያድርግ', 'ንገር'],
      so: ['kaas', 'iyo', 'kani', 'kaas', 'u', 'ku', 'iyo', 'iyo', 'ka', 'kani', 'kaas', 'waa', 'sidoo', 'aad', 'sida', 'ah', 'leeyahay', 'samee', 'sheeg'],
      
      // Other languages
      af: ['wat', 'met', 'een', 'vir', 'is', 'hoe', 'meer', 'van', 'en', 'har', 'dit', 'dit', 'is', 'hawwe', 'dwaan', 'sizze'],
      zu: ['okuthi', 'futhi', 'lena', 'leyo', 'uku', 'ngaphakathi', 'futhi', 'futhi', 'kusuka', 'lena', 'leyo', 'kukhona', 'futhi', 'kakhulu', 'njenga', 'ukuba', 'ukuba', 'ukwenza', 'ukusho'],
      xh: ['okuthi', 'kunye', 'le', 'leyo', 'uku', 'ngaphakathi', 'kunye', 'kunye', 'ukusuka', 'le', 'leyo', 'kukhona', 'kunye', 'kakhulu', 'njenga', 'ukuba', 'ukuba', 'ukwenza', 'ukuthetha'],
      st: ['e', 'le', 'ena', 'eona', 'bakeng', 'ka', 'le', 'le', 'ho', 'ena', 'eona', 'ke', 'le', 'haholo', 'joalo', 'ho', 'ho', 'ho', 'ho'],
      tn: ['e', 'le', 'eno', 'eono', 'go', 'ka', 'le', 'le', 'go', 'eno', 'eono', 'ke', 'le', 'that', 'jaaka', 'go', 'go', 'go', 'go'],
      ss: ['le', 'ne', 'leli', 'lelo', 'ku', 'ku', 'ne', 'ne', 'ku', 'leli', 'lelo', 'kukhona', 'ne', 'kakhulu', 'njenga', 'kuba', 'kuba', 'kwenta', 'kusho'],
      ve: ['tshi', 'na', 'tshi', 'tsho', 'tsha', 'tsha', 'na', 'na', 'tsha', 'tshi', 'tsho', 'ndi', 'na', 'nga', 'sa', 'vha', 'vha', 'vha', 'vha'],
      ts: ['loko', 'na', 'leri', 'lero', 'ku', 'ku', 'na', 'na', 'ku', 'leri', 'lero', 'ku', 'na', 'swinene', 'swa', 'ku', 'ku', 'ku', 'ku'],
      nr: ['okuthi', 'kanye', 'le', 'leyo', 'uku', 'ngaphakathi', 'kanye', 'kanye', 'ukusuka', 'le', 'leyo', 'kukhona', 'kanye', 'kakhulu', 'njenga', 'ukuba', 'ukuba', 'ukwenza', 'ukuthetha'],
      rw: ['ubwo', 'na', 'iyi', 'iyo', 'ku', 'mu', 'na', 'na', 'kuva', 'iyi', 'iyo', 'ni', 'kandi', 'cyane', 'nk', 'kuba', 'kuba', 'gukora', 'kuvuga'],
      rn: ['ubwo', 'na', 'iyi', 'iyo', 'ku', 'mu', 'na', 'na', 'kuva', 'iyi', 'iyo', 'ni', 'kandi', 'cyane', 'nk', 'kuba', 'kuba', 'gukora', 'kuvuga'],
      lg: ['ekyo', 'ne', 'kino', 'ekyo', 'oku', 'mu', 'ne', 'ne', 'okuva', 'kino', 'ekyo', 'kiri', 'ne', 'nyo', 'nga', 'okuba', 'okuba', 'okukola', 'okugamba'],
      ak: ['a', 'ne', 'yi', 'yi', 'ma', 'mu', 'ne', 'ne', 'fi', 'yi', 'yi', 'yɛ', 'ne', 'pii', 'te', 'yɛ', 'wɔ', 'yɛ', 'ka'],
      tw: ['a', 'ne', 'yi', 'yi', 'ma', 'mu', 'ne', 'ne', 'fi', 'yi', 'yi', 'yɛ', 'ne', 'pii', 'te', 'yɛ', 'wɔ', 'yɛ', 'ka'],
      ff: ['ɗo', 'e', 'go', 'ɗo', 'ɓe', 'ɗo', 'e', 'e', 'ɓe', 'ɗo', 'ɗo', 'ɗo', 'e', 'ɗo', 'ɗo', 'ɗo', 'ɗo', 'ɗo', 'ɗo'],
      wo: ['ku', 'ak', 'li', 'li', 'ngal', 'ci', 'ak', 'ak', 'ci', 'li', 'li', 'dafa', 'ak', 'gën', 'ci', 'dafa', 'am', 'def', 'wax'],
      bm: ['min', 'fɛ', 'kelen', 'fɛ', 'bɛ', 'kɔnɔ', 'fɛ', 'fɛ', 'fɛ', 'min', 'min', 'bɛ', 'fɛ', 'cam', 'kɛ', 'bɛ', 'bɛ', 'kɛ', 'fɔ'],
      dyu: ['min', 'fɛ', 'kelen', 'fɛ', 'bɛ', 'kɔnɔ', 'fɛ', 'fɛ', 'fɛ', 'min', 'min', 'bɛ', 'fɛ', 'cam', 'kɛ', 'bɛ', 'bɛ', 'kɛ', 'fɔ'],
      ee: ['si', 'kple', 'e', 'e', 'na', 'le', 'kple', 'kple', 'tso', 'e', 'e', 'le', 'kple', 'gã', 'bĩ', 'le', 'le', 'wɔ', 'gblɔ'],
      gaa: ['ke', 'kɛ', 'ke', 'ke', 'ma', 'le', 'kɛ', 'kɛ', 'le', 'ke', 'ke', 'le', 'kɛ', 'gã', 'bĩ', 'le', 'le', 'wɔ', 'gblɔ'],
      ti: ['ዘ', 'ከ', 'ሓ', 'ን', 'ዘ', 'ከ', 'ከ', 'ከ', 'ከ', 'ዘ', 'ዘ', 'ዘ', 'ከ', 'ዘ', 'ዘ', 'ዘ', 'ዘ', 'ዘ', 'ዘ'],
      om: ['kan', 'fi', 'tokko', 'fi', 'kan', 'keessa', 'fi', 'fi', 'irraa', 'kan', 'kan', 'dha', 'fi', 'baay', 'akka', 'dha', 'qaba', 'gochuu', 'jedhu'],
      
      // Pacific languages
      mi: ['ko', 'me', 'tetahi', 'mo', 'he', 'pehea', 'atu', 'mai', 'me', 'o', 'tenei', 'tenei', 'he', 'whai', 'mahi', 'korero'],
      sm: ['o', 'ma', 'se', 'mo', 'o', 'faapefea', 'sili', 'mai', 'ma', 'o', 'lenei', 'lenei', 'o', 'maua', 'faia', 'fai'],
      to: ['oku', 'mo', 'e', 'ki', 'oku', 'pehea', 'atu', 'mai', 'mo', 'ona', 'eni', 'eni', 'oku', 'ma', 'faia', 'tala'],
      fj: ['o', 'kei', 'e', 'vei', 'o', 'vaka', 'levu', 'mai', 'kei', 'ona', 'o', 'o', 'o', 'tiko', 'cakava', 'vosa'],
      haw: ['ka', 'me', 'kekahi', 'no', 'he', 'pehea', 'oi', 'mai', 'me', 'ona', 'keia', 'keia', 'he', 'loaa', 'hana', 'olelo'],
      
      // Other languages
      eo: ['kiu', 'kun', 'unu', 'por', 'estas', 'kiel', 'pli', 'de', 'kaj', 'ilia', 'tiu', 'tiu', 'estas', 'havi', 'fari', 'diri'],
      la: ['qui', 'cum', 'unus', 'pro', 'est', 'quomodo', 'plus', 'de', 'et', 'eorum', 'hic', 'haec', 'est', 'habere', 'facere', 'dicere'],
      hmn: ['uas', 'thiab', 'ib', 'rau', 'yog', 'li cas', 'ntau', 'los', 'thiab', 'lawv', 'no', 'no', 'yog', 'muaj', 'ua', 'hais'],
      co: ['chì', 'cù', 'unu', 'per', 'hè', 'cum', 'più', 'da', 'è', 'so', 'questu', 'questa', 'hè', 'avè', 'fà', 'dì'],
      fy: ['dy', 'mei', 'ien', 'foar', 'is', 'hoe', 'mear', 'fan', 'en', 'har', 'dit', 'dit', 'is', 'hawwe', 'dwaan', 'sizze'],
      ht: ['ki', 'ak', 'yon', 'pou', 'se', 'kijan', 'plis', 'soti', 'ak', 'yo', 'sa', 'sa', 'se', 'gen', 'fè', 'di'],
      lb: ['deen', 'mat', 'een', 'fir', 'ass', 'wéi', 'méi', 'vun', 'an', 'hir', 'dëst', 'dëst', 'ass', 'hunn', 'maachen', 'soen'],
      mg: ['izay', 'sy', 'iray', 'ho', 'dia', 'ahoana', 'be', 'avy', 'sy', 'izy', 'ity', 'ity', 'dia', 'manana', 'manao', 'miteny'],
      ny: ['yomwe', 'ndi', 'chimodzi', 'cha', 'ndi', 'bwanji', 'kwambiri', 'kuchokera', 'ndi', 'awo', 'ichi', 'ichi', 'ndi', 'kukhala', 'chita', 'nena'],
      sn: ['iyo', 'uye', 'imwe', 'ye', 'iri', 'sei', 'zvikuru', 'kubva', 'uye', 'avo', 'ichi', 'ichi', 'iri', 'kuva', 'ita', 'taura'],
      be: ['які', 'з', 'адзін', 'для', 'ёсць', 'як', 'больш', 'з', 'і', 'іх', 'гэты', 'гэта', 'ёсць', 'мець', 'рабіць', 'гаварыць'],
      uk: ['який', 'з', 'один', 'для', 'є', 'як', 'більше', 'з', 'і', 'їх', 'цей', 'ця', 'є', 'мати', 'робити', 'говорити'],
    };

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      const matches = words.filter(word => indicators.includes(word)).length;
      const score = matches / Math.min(words.length, 20); // Normalize by text length
      
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    if (maxScore > 0.1) {
      return detectedLang;
    }
  }

  // Default to English
  return 'en';
};

// Validate and sanitize language code
const validateLanguageCode = (lang: string): string => {
  const supportedLanguages = ['en', 'ar', 'ur', 'hi', 'bn', 'id', 'ms', 'tr', 'fa', 'es', 'fr', 'de', 'ru', 'zh', 'ja', 'ko', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'or', 'as', 'mr', 'ne', 'si', 'my', 'km', 'lo', 'th', 'vi', 'sw', 'ha', 'yo', 'ig', 'am', 'so'];
  return supportedLanguages.includes(lang) ? lang : 'en';
};



interface SuggestedQuestionsProps {
  userQuestion: string;
  onQuestionClick: (question: string) => void;
  isVisible: boolean;
  currentLanguage?: string;
  translatedQuestions?: string[];
  onQuestionsGenerated?: (questions: string[]) => void; // Callback to notify parent of new questions
  isTextLarge?: boolean; // Text size state from parent
}

interface AIQuestionResponse {
  success: boolean;
  questions: string[];
  error?: string;
}

export default function SuggestedQuestions({ 
  userQuestion, 
  onQuestionClick, 
  isVisible,
  currentLanguage = 'en',
  translatedQuestions,
  onQuestionsGenerated,
  isTextLarge = false
}: SuggestedQuestionsProps) {
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [questionCache, setQuestionCache] = useState<Map<string, string[]>>(new Map());

  // Generate AI-powered suggested questions
  const generateAISuggestedQuestions = useCallback(async (question: string) => {
    if (!question || question.trim().length === 0) {
      // No user question provided, skipping AI generation
      return;
    }

    // Detect language from user question
    const detectedLanguage = detectLanguage(question);
    
    // Validate and sanitize the detected language
    const safeLanguage = validateLanguageCode(detectedLanguage);

    // Check cache first
    const cacheKey = `${question.toLowerCase().trim()}_${safeLanguage}`;
    const cachedQuestions = questionCache.get(cacheKey);
    
    if (cachedQuestions && cachedQuestions.length > 0) {
      setAiGeneratedQuestions(cachedQuestions);
      return;
    }

    setIsGeneratingQuestions(true);
    setGenerationError('');

    try {
      const response = await fetch('/api/suggested-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userQuestion: question,
          language: safeLanguage 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status}`);
      }

      const data: AIQuestionResponse = await response.json();
      
      if (data.success && data.questions && data.questions.length > 0) {
        
        // Check if any questions contain unexpected language/translation messages
        const unexpectedMessages = [
          'The provided text is already in', 'There\'s nothing to translate',
          'already in', 'nothing to translate', 'preserving', 'religious accuracy',
          'islamic terms', 'translation', 'translate', 'translating', 'translated',
          'bangla', 'bengali', 'arabic', 'urdu', 'hindi', 'persian', 'turkish',
          'indonesian', 'malay', 'chinese', 'japanese', 'korean', 'russian',
          'spanish', 'french', 'german', 'portuguese', 'italian', 'dutch',
          'swedish', 'danish', 'norwegian', 'finnish', 'polish', 'czech',
          'slovak', 'hungarian', 'romanian', 'bulgarian', 'croatian', 'serbian',
          'bosnian', 'slovenian', 'macedonian', 'albanian', 'greek', 'georgian',
          'armenian', 'hebrew', 'yiddish', 'kurdish', 'pashto', 'sindhi',
          'uyghur', 'mongolian', 'thai', 'vietnamese', 'khmer', 'lao',
          'myanmar', 'tamil', 'telugu', 'malayalam', 'kannada', 'gujarati',
          'punjabi', 'odia', 'assamese', 'marathi', 'nepali', 'sinhala',
          'swahili', 'hausa', 'yoruba', 'igbo', 'amharic', 'somali',
          'afrikaans', 'zulu', 'xhosa', 'sotho', 'tswana', 'swati', 'venda',
          'tsonga', 'ndebele', 'kinyarwanda', 'kirundi', 'luganda', 'akan',
          'twi', 'fulah', 'wolof', 'bambara', 'dyula', 'ewe', 'ga', 'tigrinya',
          'oromo', 'quechua', 'guarani', 'nahuatl', 'aymara', 'maori', 'samoan',
          'tongan', 'fijian', 'hawaiian', 'esperanto', 'latin', 'javanese',
          'sundanese', 'cebuano', 'filipino', 'hmong', 'corsican', 'frisian',
          'haitian', 'luxembourgish', 'malagasy', 'chichewa', 'shona',
          'belarusian', 'ukrainian', 'catalan', 'galician', 'basque',
          'icelandic', 'maltese', 'irish', 'welsh', 'latvian', 'lithuanian',
          'estonian'
        ];
        
        const hasUnexpectedMessage = data.questions.some(q => 
          unexpectedMessages.some(msg => q.toLowerCase().includes(msg.toLowerCase()))
        );
        
        if (hasUnexpectedMessage) {
          const filteredQuestions = data.questions.filter(q => 
            !unexpectedMessages.some(msg => q.toLowerCase().includes(msg.toLowerCase()))
          );
          
          if (filteredQuestions.length > 0) {
            setAiGeneratedQuestions(filteredQuestions);
            setQuestionCache(prev => new Map(prev).set(cacheKey, filteredQuestions));
            onQuestionsGenerated?.(filteredQuestions);
          } else {
            throw new Error(`All generated questions contained unexpected content for language: ${safeLanguage}`);
          }
        } else {
          setAiGeneratedQuestions(data.questions);
          setQuestionCache(prev => new Map(prev).set(cacheKey, data.questions));
          onQuestionsGenerated?.(data.questions);
        }
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('translation') || 
        error.message.includes('unexpected content') ||
        error.message.includes('language') ||
        /(Bengali|Arabic|Urdu|Hindi|Persian|Turkish|Indonesian|Malay|Chinese|Japanese|Korean|Russian|Spanish|French|German|Portuguese|Italian|Dutch|Swedish|Danish|Norwegian|Finnish|Polish|Czech|Slovak|Hungarian|Romanian|Bulgarian|Croatian|Serbian|Bosnian|Slovenian|Macedonian|Albanian|Greek|Georgian|Armenian|Hebrew|Yiddish|Kurdish|Pashto|Sindhi|Uyghur|Mongolian|Thai|Vietnamese|Khmer|Lao|Myanmar|Tamil|Telugu|Malayalam|Kannada|Gujarati|Punjabi|Odia|Assamese|Marathi|Nepali|Sinhala|Swahili|Hausa|Yoruba|Igbo|Amharic|Somali|Afrikaans|Zulu|Xhosa|Sotho|Tswana|Swati|Venda|Tsonga|Ndebele|Kinyarwanda|Kirundi|Luganda|Akan|Twi|Fulah|Wolof|Bambara|Dyula|Ewe|Ga|Tigrinya|Oromo|Quechua|Guarani|Nahuatl|Aymara|Maori|Samoan|Tongan|Fijian|Hawaiian|Esperanto|Latin|Javanese|Sundanese|Cebuano|Filipino|Hmong|Corsican|Frisian|Haitian|Luxembourgish|Malagasy|Chichewa|Shona|Belarusian|Ukrainian|Catalan|Galician|Basque|Icelandic|Maltese|Irish|Welsh|Latvian|Lithuanian|Estonian)/i.test(error.message)
      )) {
        try {
          const fallbackResponse = await fetch('/api/suggested-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userQuestion: question,
              language: safeLanguage 
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData: AIQuestionResponse = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.questions && fallbackData.questions.length > 0) {
              setAiGeneratedQuestions(fallbackData.questions);
              setQuestionCache(prev => new Map(prev).set(`${question.toLowerCase().trim()}_${safeLanguage}`, fallbackData.questions));
              onQuestionsGenerated?.(fallbackData.questions);
              return;
            }
          }
        } catch (fallbackError) {
          // Fallback failed
        }
        
        setAiGeneratedQuestions([]);
        setGenerationError('Failed to generate questions in the requested language');
      }
      
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate questions');
      setAiGeneratedQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [questionCache, onQuestionsGenerated]);

  // Generate questions when user question changes
  useEffect(() => {
    if (isVisible && userQuestion && userQuestion.trim().length > 0) {
      generateAISuggestedQuestions(userQuestion);
    }
  }, [isVisible, userQuestion, generateAISuggestedQuestions]);



  // Determine which questions to show based on current language and available translations
  const relevantQuestions = (() => {
    if (currentLanguage !== 'en' && translatedQuestions && translatedQuestions.length > 0) {
      return translatedQuestions;
    }
    
    if (currentLanguage === 'en' && translatedQuestions && translatedQuestions.length > 0) {
      return translatedQuestions;
    }
    
    if (aiGeneratedQuestions && aiGeneratedQuestions.length > 0) {
      return aiGeneratedQuestions;
    }
    
    return [];
  })();
  
  // Show appropriate message when no questions are available
  const hasQuestions = relevantQuestions && relevantQuestions.length > 0;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-0 mb-12 sm:mb-0"
      >
        {/* Suggested Questions Container */}
        <div className="rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Suggested questions
              </h3>
              {isGeneratingQuestions && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-t-emerald-400 rounded-full"
                />
              )}
            </div>
          </div>
          
          {/* Questions List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 pb-16 sm:pb-8 lg:pb-8">
            {isGeneratingQuestions ? (
              // Loading state
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-t-emerald-400 rounded-full"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Generating relevant questions...
                  </span>
                </div>
              </div>
            ) : generationError ? (
              // Error state
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <div className="text-red-500 dark:text-red-400 text-sm">
                  <p>Failed to generate questions</p>
                  <button 
                    onClick={() => generateAISuggestedQuestions(userQuestion)}
                    className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-xs hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : hasQuestions ? (
              // Questions list
              relevantQuestions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer group select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Add visual feedback
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                      target.style.transform = '';
                    }, 100);
                    
                    // Execute the click handler
                    onQuestionClick(question);
                  }}
                  onMouseDown={(e) => {
                    // Don't prevent default to ensure click events work properly
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    // Ensure touch events work properly
                    e.stopPropagation();
                  }}
                  style={{ 
                    pointerEvents: 'auto',
                    touchAction: 'manipulation'
                  }}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <p 
                      className={`flex-1 text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200 pr-2 break-words cursor-pointer ${
                        isTextLarge ? 'text-base' : 'text-sm'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onQuestionClick(question);
                      }}
                    >
                      {question}
                    </p>
                    <button 
                      className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 mt-0.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Add visual feedback
                        const target = e.currentTarget as HTMLElement;
                        target.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                          target.style.transform = '';
                        }, 100);
                        
                        // Execute the click handler
                        onQuestionClick(question);
                      }}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              // No questions state
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {currentLanguage === 'en' 
                    ? 'No suggested questions available yet. Questions will appear after you ask a question.'
                    : 'No suggested questions available yet. Questions will appear after you ask a question.'
                  }
                </span>
              </div>
            )}
            {/* Extra bottom spacing for mobile to prevent last question cutoff */}
            <div className="h-16 sm:h-8 lg:h-8"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
