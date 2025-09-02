import { useCallback } from 'react';
import { getSurahNumber, calculateGlobalAyahNumber, fetchTafsir } from '../utils/tafsirUtils';

// Improved language detection function with English-first approach
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
    
    // South Asian scripts
    hi: /[\u0900-\u097F]/,
    bn: /[\u0980-\u09FF]/,
    ta: /[\u0B80-\u0BFF]/,
    te: /[\u0C00-\u0C7F]/,
    ml: /[\u0D00-\u0D7F]/,
    kn: /[\u0C80-\u0CFF]/,
    gu: /[\u0A80-\u0AFF]/,
    pa: /[\u0A00-\u0A7F]/,
    or: /[\u0B00-\u0B7F]/,
    as: /[\u0980-\u09FF]/,
    mr: /[\u0900-\u097F]/,
    ne: /[\u0900-\u097F]/,
    si: /[\u0D80-\u0DFF]/,
    my: /[\u1000-\u109F]/,
    km: /[\u1780-\u17FF]/,
    lo: /[\u0E80-\u0EFF]/,
    
    // East Asian scripts
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af]/,
    th: /[\u0E00-\u0E7F]/,
    
    // European scripts
    ru: /[\u0400-\u04FF]/,
    be: /[\u0400-\u04FF]/,
    uk: /[\u0400-\u04FF]/,
    bg: /[\u0400-\u04FF]/,
    sr: /[\u0400-\u04FF]/,
    mk: /[\u0400-\u04FF]/,
    
    // Georgian and Armenian
    ka: /[\u10A0-\u10FF]/,
    hy: /[\u0530-\u058F]/,
    
    // Central Asian scripts
    kk: /[\u0400-\u04FF]/,
    ky: /[\u0400-\u04FF]/,
    uz: /[\u0400-\u04FF]/,
    tk: /[\u0400-\u04FF]/,
    tg: /[\u0400-\u04FF]/,
    mn: /[\u1800-\u18AF]/,
    
    // African scripts
    am: /[\u1200-\u137F]/,
    ti: /[\u1200-\u137F]/,
    om: /[\u1200-\u137F]/,
  };

  // Check for script-based detection
  for (const [lang, pattern] of Object.entries(scriptPatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Enhanced word-based detection for Latin script languages
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/).filter(word => word.length > 2);
  
  if (words.length > 0) {
    // First check for common English words to avoid false positives
    const englishCommonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'when', 'where', 'why', 'how', 'who', 'which', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there', 'then', 'also', 'back', 'even', 'still', 'well', 'way', 'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able'];
    
    const englishMatches = words.filter(word => englishCommonWords.includes(word)).length;
    const englishScore = englishMatches / Math.min(words.length, 20);
    
    // If English score is high enough, return English
    if (englishScore > 0.3) {
      return 'en';
    }

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
      af: ['wat', 'met', 'een', 'vir', 'is', 'hoe', 'meer', 'van', 'en', 'hul', 'hierdie', 'hierdie', 'is', 'het', 'doen', 'sê'],
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

    if (maxScore > 0.4) {
      return detectedLang;
    }
  }

  // Default to English
  return 'en';
};

// Function to validate and clean AI responses
const validateAndCleanResponse = (response: string): string => {
  if (!response || typeof response !== 'string') {
    return '';
  }
  
  let cleanedResponse = response.trim();
  
  // Remove any incomplete sentences at the end
  const sentences = cleanedResponse.split(/[.!?]+/);
  const lastSentence = sentences[sentences.length - 1].trim();
  
  // If the last sentence is incomplete (less than 3 words or doesn't end with punctuation), remove it
  if (lastSentence.split(' ').length < 3 || !/[.!?]$/.test(cleanedResponse)) {
    // Find the last complete sentence
    const lastCompleteIndex = cleanedResponse.lastIndexOf('.');
    if (lastCompleteIndex > 0) {
      cleanedResponse = cleanedResponse.substring(0, lastCompleteIndex + 1);
    }
  }
  
  // Remove any fragmented text patterns
  cleanedResponse = cleanedResponse.replace(/\s*\.{2,}\s*/g, '.'); // Remove multiple dots
  cleanedResponse = cleanedResponse.replace(/\s*[a-z]\s*$/gi, ''); // Remove single letters at end
  cleanedResponse = cleanedResponse.replace(/\s+$/g, ''); // Remove trailing whitespace
  
  return cleanedResponse;
};

export const useAIResponse = (isTextLarge: boolean = false) => {
  const generate_response_with_gemini = useCallback(async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      // Error calling Gemini API - silent fail for security
      throw new Error((error as Error).message || 'Failed to generate response');
    }
  }, []);

  const getPrompt = useCallback((content: string) => {
    const detectedLanguage = detectLanguage(content);
    const languageInstructions = detectedLanguage !== 'en' ? 
      `\n\n🚨 CRITICAL LANGUAGE REQUIREMENT - YOU MUST FOLLOW THIS EXACTLY: 
- You MUST respond in the SAME LANGUAGE as the user's question (${detectedLanguage})
- ALL your content must be in ${detectedLanguage} - introduction, explanations, conclusions, AND suggested questions
- Only the Quranic verse references and technical formatting should remain in English
- The suggested questions at the end must also be in ${detectedLanguage}
- Do NOT mix languages - keep everything consistent
- If you fail to follow this language requirement, your response will be rejected
- This is a strict requirement - no exceptions allowed` : '';

    return `You are an AI-powered Islamic Library with experience as a Quran Scholar/Researcher. Your task is to answer questions by providing authentic references from the Holy Quran.

🚨 CRITICAL: You must format your response exactly as follows AND follow the language requirement above:

Begin with a brief introduction to the topic in a flowing, narrative style. Keep your introduction concise but complete - avoid using bullet points, numbered lists, or any point-based formatting.

Include at least 2-3 relevant Quranic verses in this EXACT format:
"Complete verse text here" [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

After each verse, provide your AI-generated explanation and interpretation in a natural, flowing paragraph format. Make sure each explanation is complete and properly ends before moving to the next verse. The authentic tafsir will be automatically fetched and displayed.

End with practical guidance or conclusion in a narrative style.

After your main response, provide exactly 5 relevant follow-up questions in the same language as the user's question. Each question must be:
- Complete and grammatically correct
- On a separate line
- Related to the user's original question
- Specific and thought-provoking
- Properly formatted without any numbering or bullet points

CRITICAL FORMAT REQUIREMENTS:
- Use EXACTLY this format for ayah references: [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})
- Replace {Surah No.} and {Ayah No.} with actual numbers
- Use proper surah names like: Al-Fatiha, Al-Baqarah, Aal-Imran, An-Nisa, Al-Ma'idah, etc.
- Include the full verse text in quotes before each reference
- After each verse reference, provide your AI-generated explanation and interpretation in paragraph form
- The authentic tafsir from Islamic scholars will be automatically displayed
- Write in a natural, flowing narrative style without bullet points or numbered lists
- Ensure ALL text is complete and properly formatted - no incomplete sentences or fragmented thoughts

CRITICAL AI EXPLANATION REQUIREMENTS:
- Your AI explanation MUST directly connect the specific ayah to the user's question
- Explain how the verse answers or relates to what the user asked
- Provide context and interpretation that makes the connection clear
- Show the relevance of the verse to the specific question being asked
- Make sure the explanation bridges the gap between the verse and the user's inquiry
- Write in flowing paragraphs, not as separate points
- Ensure each explanation is complete and properly concluded

CRITICAL RESPONSE QUALITY REQUIREMENTS:
- Provide complete, coherent responses
- Avoid fragmented or incomplete sentences
- Ensure all explanations are properly finished
- Make sure suggested questions are complete and meaningful
- Do not cut off responses mid-sentence
- Maintain proper grammar and flow throughout
- Write in complete, well-formed sentences
- Avoid any text that appears to be cut off or incomplete

🚨 CRITICAL LANGUAGE CONSISTENCY REQUIREMENTS:
- The ENTIRE response must be in the SAME LANGUAGE as the user's question
- This includes: introduction, explanations, conclusions, AND suggested questions
- Do NOT mix languages - keep everything consistent
- Only Quranic references and technical formatting should remain in English
- If you write in English when the user asked in ${detectedLanguage}, your response will be rejected
- This is a strict requirement with no exceptions${languageInstructions}

Example format:
"Indeed, Allah is with those who are patient." [Al-Baqarah: 153](https://alquran.cloud/ayah?reference=2:153)

This verse directly addresses your question about patience by teaching us that Allah's divine support is guaranteed for those who remain steadfast. When you asked about how to handle difficult situations, this verse provides the answer: maintain patience and trust that Allah will be with you. This is not just about waiting passively, but about actively maintaining faith and trust in Allah's plan while facing your challenges.

Question: ${content}`;
  }, []);

  const formatResponse = useCallback(async (response: string) => {
    // First, validate that the response is complete and properly formatted
    const validatedResponse = validateAndCleanResponse(response);
    
    // Find all ayah references and prepare them with tafsir data
    const ayahRegex = /"([^"]+)"\s*\[(.*?)\:\s*(\d+)\]\((https?:\/\/[^\s)]+)\)/g;
    const ayahMatches: RegExpExecArray[] = [];
    let match;
    
    // Extract all matches
    while ((match = ayahRegex.exec(validatedResponse)) !== null) {
      ayahMatches.push(match);
    }
    
    // Process each ayah with tafsir data
    const ayahReplacements = await Promise.all(
      ayahMatches.map(async (match) => {
        const [, verseText, surahName, ayahNumber, url] = match;
        const surahNumber = getSurahNumber(surahName.trim());
        if (!surahNumber) {
          // Could not find surah number - using fallback value 1
        }
        const finalSurahNumber = surahNumber || 1;
        const ayahNum = parseInt(ayahNumber);
        const globalAyahNumber = calculateGlobalAyahNumber(finalSurahNumber, ayahNum);
        const ayahId = `ayah-${finalSurahNumber}-${ayahNum}-${Date.now()}`;
        
        // Fetch tafsir data
        const tafsirData = await fetchTafsir(finalSurahNumber, ayahNum);
        
        // Generate tafsir buttons and content
        let tafsirButtonsHTML = '';
        let tafsirContentHTML = '';
        
        if (tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0) {
          tafsirButtonsHTML = `
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 19.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300">Tafsir</span>
            </h4>
            <div class="flex flex-wrap gap-1.5 md:gap-2 flex-1">`;
          
          tafsirData.tafsirs.forEach((tafsir, index) => {
            const tafsirId = `tafsir-${ayahId}-${index}`;
            const formattedContent = tafsir.content
              .replace(/\n/g, '<br>')
              .replace(/##\s*(.*?)$/gm, '<h5 class="text-gray-800 dark:text-gray-200 mt-3 mb-2">$1</h5>')
              .replace(/\*\*(.*?)\*\*/g, '<span class="text-gray-700 dark:text-gray-300">$1</span>')
              .replace(/\*(.*?)\*/g, '<span class="text-gray-700 dark:text-gray-300 italic">$1</span>');
            
            tafsirButtonsHTML += `
              <button 
                data-tafsir-id="${tafsirId}"
                class="tafsir-toggle-btn px-2 md:px-3 py-1.5 md:py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1.5 md:space-x-2 text-left focus:outline-none rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600  hover: active:scale-95"
              >
                <div class="w-4 md:w-5 h-4 md:h-5 bg-gray-400 dark:bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-2.5 md:w-3 h-2.5 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">${tafsir.author}</div>
              </button>`;
              
            tafsirContentHTML += `
              <div id="${tafsirId}" class="tafsir-content w-full mt-4" style="display: none;">
                <div class="bg-transparent rounded-xl border border-gray-200 dark:border-gray-700  overflow-hidden">
                  <div class="bg-gray-100 dark:bg-gray-900 px-3 md:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                      <h5 class="${isTextLarge ? 'text-base' : 'text-sm'} font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="${isTextLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm'}">${tafsir.author}</span>
                      </h5>
                      <button data-tafsir-id="${tafsirId}" class="tafsir-close-btn text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="p-3 md:p-4">
                    <div class="text-gray-700 dark:text-gray-300 leading-relaxed ${isTextLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm'} space-y-2 md:space-y-3">
                      ${formattedContent}
                    </div>
                  </div>
                </div>
              </div>`;
          });
          
          tafsirButtonsHTML += `
              </div>`;
        } else {
          tafsirButtonsHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 flex-1 flex flex-col justify-center">
              <svg class="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 19.477 5.754 20 7.5 20s3.332-.523 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.523 4.5 1.253v13C19.832 19.477 18.246 20 16.5 20c-1.746 0-3.332-.523-4.5-1.253" />
              </svg>
              <p class="text-sm font-medium">No tafsir available</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later</p>
            </div>`;
        }
        
        return {
          match: match[0],
          replacement: `<div class="stylish-ayah-reference mb-8 max-w-none w-full pt-5 pb-5" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}" data-surah-name="${surahName}" data-ayah-number="${ayahNumber}" data-surah-number="${surahNumber}">
            <div class="bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full ">
              <!-- Clean Header -->
              <div class="bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)]">${surahName}</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Verse ${ayahNumber}</p>
                    </div>
                  </div>
                  <span class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-mono rounded-lg">${finalSurahNumber}:${ayahNumber}</span>
                </div>
              </div>
              
              <!-- Verse Content -->
              <div class="p-4">
                <!-- Verse Text -->
                <div class="text-center mb-6">
                  <div class="relative">
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -left-4">"</div>
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -right-4">"</div>
                    <blockquote class="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] leading-relaxed font-medium tracking-wide px-6 py-2">
                      ${verseText}
                    </blockquote>
                  </div>
                </div>
                
                <!-- Audio Player and Tafsir Buttons -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <!-- Audio Player -->
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-h-[120px] md:min-h-[140px] flex flex-col justify-between shadow-sm">
                    <!-- Surah and Ayah Info Header -->
                    <div class="bg-gray-100 dark:bg-gray-900 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2 -mx-3 -mt-3 rounded-t-xl">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                          <div class="w-6 h-6 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
                            <svg class="w-3 h-3 text-white dark:text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div>
                            <div class="text-sm font-semibold text-gray-800 dark:text-gray-200">${surahName}</div>
                            <div class="text-xs text-gray-600 dark:text-gray-400">Ayah ${ayahNumber}</div>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">Surah ${finalSurahNumber}</div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Audio Controls -->
                    <div class="flex items-center space-x-3">
                      <button class="ayah-audio-play-btn play-state w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer" data-surah="${finalSurahNumber}" data-ayah="${ayahNumber}" type="button">
                        <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-800 dark:text-gray-200">Play recitation</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400">Alafasy</div>
                      </div>
                    </div>
                    
                    <!-- Full-Width Audio Waveform Progress Bar -->
                    <div class="mt-3">
                      <style>
                        @keyframes waveProgress {
                          0%, 100% { opacity: 0.8; transform: scaleY(1); }
                          50% { opacity: 1; transform: scaleY(1.1); }
                        }
                        @keyframes waveGlow {
                          0%, 100% { box-shadow: 0 0 4px rgba(107, 114, 128, 0.3); }
                          50% { box-shadow: 0 0 8px rgba(107, 114, 128, 0.5); }
                        }
                        .dark @keyframes waveGlow {
                          0%, 100% { box-shadow: 0 0 4px rgba(209, 213, 219, 0.3); }
                          50% { box-shadow: 0 0 8px rgba(209, 213, 219, 0.5); }
                        }
                      </style>
                      <div class="relative w-full h-8 flex items-end justify-between space-x-0.5 cursor-pointer" data-surah="${finalSurahNumber}" data-ayah="${ayahNumber}">
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="0"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="1"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="2"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="3"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="4"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="5"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="6"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="7"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="8"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="9"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="10"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="11"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="12"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="13"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="14"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="15"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="16"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="17"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="18"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="19"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="20"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="21"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="22"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="23"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="24"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="25"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="26"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="27"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="28"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="29"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="30"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="31"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="32"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="33"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="34"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="35"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="36"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="37"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="38"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="39"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="40"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="41"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="42"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="43"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="44"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="45"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="46"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="47"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="48"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="49"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Tafsir Buttons -->
                  <div class="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-h-[120px] md:min-h-[140px] flex flex-col justify-between ">
                    ${tafsirButtonsHTML}
                  </div>
                </div>
                
                <!-- Tafsir Content (Full Width Below) -->
                ${tafsirContentHTML}
                
                <!-- Source Button - Bottom Right Corner -->
                <div class="absolute bottom-3 right-3">
                  <a href="https://alquran.cloud/ayah?reference=${finalSurahNumber}:${ayahNumber}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md border border-gray-200 dark:border-gray-600 transition-all duration-200 text-xs font-medium">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Source
                  </a>
                </div>
              </div>
            </div>
          </div>`
        };
      })
    );
    
    // Apply all replacements
    let processedText = response;
    ayahReplacements.forEach(({ match, replacement }) => {
      processedText = processedText.replace(match, replacement);
    });
    
    // Continue with other formatting
    processedText = processedText
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
      
      // Format underlined text
      .replace(/\_\_([^_]+)\_\_/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500">$1</span>')
      
      // Format numbered lists with enhanced styling and spacing
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-6 flex items-start p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600  hover: transition-all duration-200"><span class="inline-flex items-center justify-center w-8 h-8 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-full text-sm font-bold mr-4 mt-0.5 flex-shrink-0 ">$1</span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$2</span></div>')
      
      // Format bullet points
      .replace(/^[-•]\s+(.+)$/gm, '<div class="mb-5 flex items-start p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600  hover: transition-all duration-200"><span class="w-3 h-3 bg-gray-600 dark:bg-gray-400 rounded-full mr-4 mt-3 flex-shrink-0 "></span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$1</span></div>')
      
      // Format specific Islamic terms with minimalistic underlines
      .replace(/Allah\s*\(SWT\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah (SWT)</span>')
      .replace(/Allah\s*SWT/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah SWT</span>')
      .replace(/Prophet Muhammad\s*\(PBUH\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Prophet Muhammad (PBUH)</span>')
      .replace(/Prophet Muhammad\s*PBUH/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Prophet Muhammad PBUH</span>')
      .replace(/\(peace be upon him\)/g, '<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">(peace be upon him)</span>')
      .replace(/Muhammad\s*\(PBUH\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Muhammad (PBUH)</span>')
      .replace(/Muhammad\s*PBUH/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Muhammad PBUH</span>')
      .replace(/Allah\s*\(Subhanahu wa Ta\'ala\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah (Subhanahu wa Ta\'ala)</span>')
      .replace(/Allah\s*Subhanahu wa Ta\'ala/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah Subhanahu wa Ta\'ala</span>')
      
      // Format Explanation headers with distinctive styling
      .replace(/^(Explanation):?\s*$/gmi, 
        '<div class="explanation-section mt-12 mb-8"><div class="flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-l-4 border-blue-500 dark:border-blue-400 "><div class="w-12 h-12 bg-blue-500 dark:bg-blue-400 rounded-xl flex items-center justify-center "><svg class="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><div><h3 class="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200 font-[var(--font-amiri)] tracking-wide">💡 Explanation</h3><p class="text-sm text-blue-600 dark:text-blue-400 mt-1">Understanding the meaning and context</p></div></div></div>')
      
      // Format Tafsir/Tafseer headers with simple styling (matching AI Explanation design)
      .replace(/^(Tafs[ie]r):?\s*$/gmi, 
        `<div class="tafsir-section mt-12 mb-8"><h3 class="${isTextLarge ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} font-bold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] tracking-wide border-b border-gray-300 dark:border-gray-600 pb-2">Tafsir</h3><p class="${isTextLarge ? 'text-base' : 'text-sm'} text-gray-600 dark:text-gray-400 mt-1">Detailed scholarly interpretation</p></div>`)
      
      // Format AI Explanation sections with simple styling
      .replace(/\[AI Explanation:\s*([\s\S]*?)\]/gi, 
        `<div class="ai-explanation-section mt-2 mb-4"><h4 class="${isTextLarge ? 'text-xl' : 'text-lg'} font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">AI Explanation</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed ${isTextLarge ? 'text-base' : 'text-sm'}">$1</div></div>`)
      
      // Format Authentic Tafsir sections with simple styling
      .replace(/\[Authentic Tafsir:\s*([\s\S]*?)\]/g, 
        `<br><br><div class="authentic-tafsir-section mt-6 mb-4"><h4 class="${isTextLarge ? 'text-xl' : 'text-lg'} font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">Authentic Tafsir</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed ${isTextLarge ? 'text-base' : 'text-sm'}">$1</div></div>`)
      
      // Format other common section headers with enhanced styling
      .replace(/^(Introduction|Additional Information|References|Conclusion):?\s*$/gmi, 
        '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-4 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format Quranic section headers with simple styling
      .replace(/Allah\s*\(SWT\)\s*says\s*in\s*the\s*(Glorious\s*)?Quran:?/gi, 
        '<div class="my-8 p-4 border-l-4 border-gray-300 dark:border-gray-600 pl-4"><h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Allah (SWT) says in the Glorious Quran:</h3></div>')
      
      // Clean up any remaining formatting markers
      .replace(/###\s*Quran GPT's Answer:?\s*/gi, '')
      .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
    
    return processedText;
  }, [isTextLarge]);

  const askQuran = useCallback(async (
    content: string,
    setIsProcessing: (processing: boolean) => void,
    setSummary: (summary: string) => void,
    setShowSummary: (show: boolean) => void,
    setError: (error: string) => void,
    setDisplayedContent: (content: string) => void,
    setCurrentLanguage: (lang: string) => void
  ) => {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    // Audio cleanup is now handled in ResponseSection component

    // Activate chat mode
    setIsProcessing(true);
    setSummary('');
    setShowSummary(false);
    setError('');

    const prompt = getPrompt(trimmedContent);
    const detectedLanguage = detectLanguage(trimmedContent);

    try {
      const response = await generate_response_with_gemini(prompt);
      
      const formattedResponse = await formatResponse(response);
      
      setSummary(formattedResponse);
      setDisplayedContent(formattedResponse);
      setCurrentLanguage(detectedLanguage);
      setShowSummary(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [getPrompt, generate_response_with_gemini, formatResponse]);

  return {
    askQuran,
    generate_response_with_gemini,
    formatResponse,
    getPrompt,
  };
};
