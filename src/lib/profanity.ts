const ENGLISH_BAD_WORDS = [
  'fuck', 'fucking', "tfo", 'fucker', 'fuckers', 'motherfucker', 'motherfucking', 'wtf',
  'shit', 'shitty', 'shithead', 'shitheads', 'bullshit', 'crap', 'piss', 'pissed',
  'bitch', 'bitches', 'sonofabitch', 'bastard', 'bastards', 'asshole', 'assholes',
  'dumbass', 'jackass', 'badass', 'moron', 'idiot', 'idiotic', 'stupid', 'stupidity',
  'retard', 'retarded', 'jerk', 'loser', 'trash', 'garbage', 'pathetic', 'lame',
  'scumbag', 'scum', 'douche', 'douchebag', 'wanker', 'prick', 'twat', 'arse', 'arsehole',
  'slut', 'sluts', 'whore', 'whores', 'damn', 'dammit', 'bloody', 'screwyou', 'shutup',
  'fool', 'clown', 'weirdo', 'psycho', 'lunatic', 'nasty', 'filthy', 'dirtydog',
  'pig', 'pigs', 'dog', 'dogs', 'ugly', 'disgusting', 'creep', 'creepy', 'toxic',
  'pieceofshit', 'pieceofcrap', 'garbagehuman', 'numbnuts', 'dipshit', 'dirtbag',
  'bonehead', 'airhead', 'meathead', 'buffoon', 'imbecile', 'nitwit', 'dimwit',
  'blockhead', 'knucklehead', 'halfwit', 'coward', 'spineless', 'worthless', 'useless',
  'savage', 'beast', 'rat', 'vermin', 'lowlife', 'filth', 'trashcan', 'nobody',
] as const;

const FRENCH_BAD_WORDS = [
  'putain', 'put1', 'ptn', 'merde', 'bordel', 'fdp', 'filsdepute', 'fils de pute',
  'connard', 'connasse', 'con', 'conne', 'groscon', 'salecon', 'imbecile', 'debile',
  'abruti', 'abrutie', 'idiot', 'idiote', 'cretin', 'cretine', 'attarde', 'attardee',
  'salope', 'salaud', 'ordure', 'pourriture', 'charogne', 'encule', 'enculer', 'encules',
  'nique', 'niquer', 'nique ta mere', 'ntm', 'ta gueule', 'tg', 'ferme ta gueule',
  'pute', 'putes', 'putasse', 'catin', 'poufiasse', 'chienne', 'chien', 'porc', 'cochon',
  'raclure', 'dechet', 'nul', 'nulle', 'minable', 'lache', 'faible', 'moche', 'affreux',
  'sale', 'sale type', 'sale mec', 'sale meuf', 'enfoire', 'enfoiree', 'batard', 'batarde',
  'batards', 'tasde merde', 'sous merde', 'pauvre type', 'pauvre con', 'victime',
  'clochard', 'clodo', 'gland', 'glandu', 'bouffon', 'clown', 'tarte', 'tocard', 'teube',
  'teube', 'trouduc', 'trou de balle', 'baltringue', 'blaireau', 'boulet', 'casse toi',
  'degage', 'va te faire', 'ferme la', 'abrutis', 'debiles', 'imbeciles', 'cretins',
  'salopard', 'salope va', 'ordurier', 'honteux', 'pitoyable', 'misereux', 'pourri',
] as const;

const ARABIC_BAD_WORDS = [
  'لعنة', 'ملعون', 'ملعونة', 'تباً', 'تبا', 'تب', 'وسخ', 'قذر', 'نجس', 'حقير', 'حقيرة',
  'منحط', 'تافه', 'غبي', 'غبية', 'احمق', 'أحمق', 'حمقاء', 'معتوه', 'مجنون', 'مخبول',
  'كلب', 'كلبة', 'حمار', 'حمارة', 'خنزير', 'خنزيرة', 'قرد', 'قردة', 'بقري', 'حيوان',
  'نذل', 'سافل', 'وقح', 'وقحة', 'ساقط', 'ساقطة', 'تافه', 'زبالة', 'نفاية', 'نكرة',
  'قحبة', 'قحبه', 'شرموطة', 'شرموط', 'عاهرة', 'زانية', 'ابن زنا', 'ابن حرام',
  'ابن كلب', 'ابن حمار', 'كسول', 'فاشل', 'غشاش', 'كذاب', 'كذابة', 'خاين', 'خائنة',
  'جبان', 'جبانة', 'مقرف', 'مقرفة', 'مريض', 'مريضة', 'تفو', 'تفو عليك', 'يلعن',
  'يلعنك', 'اللعنة عليك', 'اخرس', 'اسكت', 'تفاهة', 'قبيح', 'قبيحة', 'فظيع', 'حقود',
  'حاقد', 'معفن', 'متعفن', 'وساخة', 'قذارة', 'رديء', 'منبوذ', 'سخيف', 'حمقى',
  'غبيان', 'أغبياء', 'أوساخ', 'سافلين', 'حقارة', 'احتقار', 'رخيص', 'ساقطين',
] as const;

const DARIJA_LATIN_BAD_WORDS = [
  'zbel', 'zbelk', 'zbelha', 'zamel', 'zemel', 'zaml', 'hmar', 'hmar', '7mar', '7mara',
  'kalb', 'klb', 'kelb', '9lawi', 'qlawi', '9wad', 'qwad', '7chouma', 'wakhra', 'w9',
  'khra', 'khria', 'tkharbi9', 'mklakh', 'mkelkha', 'm3a9ed', 'm3e9ed', 'ilias jbilou',
  'ma7gor', 'm9awed', 'mqawed', 'm9wada', 'mqwada', 'm9wda', '9hab', '9ahba', 'qa7ba',
  '9a7ba', 'qahba', '9wada', 'qawad', 'wld l97ba', 'weld l97ba', 'wld 97ba', 'bnadm zbel',
  'sir t9awed', 'sir tqawed', 'sir t9awed 3lia', 'sir t9wd', 'tkawed', 't9awed', 't9wida',
  'm9wd', 'mqwd', 'makaynch l3a9el', 'hamaj', 'mouskh', 'mskhot', 'mskhout', 'zebi',
  'zeb', 'zebbi', 'zbbi', 'zb', 'sir t9ra', 'sir t9wed', 'mkhour', 'm7gor', 'baghi t9wd',
  'safi hmar', 'ya hmar', 'ya kalb', 'ya zbel', 'ya 9wad', 'hmar kbiiir', 'm3fen',
  'm3foun', 'khanz', 'khanez', 'mazbal', 'm9ruf', 'mqruf', '7mar dialk', 'zbel dialk',
  'wld lkalb', 'wld l7ram', 'bghal', 'bghla', 'hmar 3lik', 'tfo 3lik', 'skt', 'skot',
] as const;

const DARIJA_ARABIC_BAD_WORDS = [
  'زبل', 'زبلة', 'زبال', 'حمار', 'حمارة', 'كلب', 'كلبة', 'قحبة', 'قحبه', 'شرموطة',
  'شرموط', 'عاهرة', 'ولد الحرام', 'بنادم زبل', 'يا زبل', 'يا حمار', 'يا كلب', 'يا قحبة',
  'يا شرموطة', 'تفو عليك', 'تفو', 'خرا', 'خرا عليك', 'وسخ', 'موسخ', 'مقرف', 'مقرفة',
  'مخنز', 'خنز', 'حقير', 'منحط', 'نذل', 'وضيع', 'تافه', 'غبي', 'أحمق', 'ابله',
  'معتوه', 'سافل', 'وقح', 'مزبلة', 'نفاية', 'واطي', 'ساقط', 'ولد الكلب', 'ولد القحبة',
  'ولد الزنا', 'يا ابن الكلب', 'يا ابن الحرام', 'يا حيوان', 'حيوان', 'يا بغل', 'بغل',
  'يا خنزير', 'خنزير', 'قذر', 'قذارة', 'سخيف', 'مخبول', 'مجنون', 'بلا عقل', 'مكلخ',
  'مكلخة', 'حمار كبير', 'زبل كبير', 'زفت', 'ملعون', 'لعنة عليك', 'يلعن', 'يلعنك',
  'يا قواد', 'قواد', 'مقود', 'سير تقود', 'تقود', 'يا متخلف', 'متخلف', 'زب', 'زبي',
] as const;

export const LATIN_BAD_WORDS = [...ENGLISH_BAD_WORDS, ...FRENCH_BAD_WORDS, ...DARIJA_LATIN_BAD_WORDS] as const;
export const ARABIC_SCRIPT_BAD_WORDS = [...ARABIC_BAD_WORDS, ...DARIJA_ARABIC_BAD_WORDS] as const;

export const ALL_BAD_WORDS = [
  ...ENGLISH_BAD_WORDS,
  ...FRENCH_BAD_WORDS,
  ...ARABIC_BAD_WORDS,
  ...DARIJA_LATIN_BAD_WORDS,
  ...DARIJA_ARABIC_BAD_WORDS,
] as const;

type DetectResult = {
  hasBadWord: boolean;
  matches: string[];
  firstMatch: string | null;
};

type DetectFieldsResult = DetectResult & {
  offendingFields: string[];
};

const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_WORD_SEPARATOR_RE = /[^\p{L}\p{N}]+/gu;

function normalizeForMatching(text: string, toLower: boolean): string {
  const normalized = text
    .normalize('NFKC')
    .replace(ARABIC_DIACRITICS_RE, ' ')
    .replace(NON_WORD_SEPARATOR_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return toLower ? normalized.toLowerCase() : normalized;
}

function isWordChar(char: string): boolean {
  return /[\p{L}\p{N}]/u.test(char);
}

function addMatchesFromTerms(normalizedText: string, terms: readonly string[], bag: Set<string>): void {
  for (const rawTerm of terms) {
    const term = normalizeForMatching(rawTerm, true);
    if (!term) continue;

    let start = 0;
    while (start < normalizedText.length) {
      const idx = normalizedText.indexOf(term, start);
      if (idx === -1) break;

      const leftBoundary = idx === 0 || !isWordChar(normalizedText[idx - 1]);
      const rightIndex = idx + term.length;
      const rightBoundary = rightIndex === normalizedText.length || !isWordChar(normalizedText[rightIndex]);

      if (leftBoundary && rightBoundary) {
        bag.add(rawTerm);
        break;
      }
      start = idx + 1;
    }
  }
}

function detectInTextInternal(text: string): DetectResult {
  if (!text || !text.trim()) {
    return { hasBadWord: false, matches: [], firstMatch: null };
  }

  const latinNormalizedText = normalizeForMatching(text, true);
  const arabicNormalizedText = normalizeForMatching(text, false);
  const matches = new Set<string>();

  addMatchesFromTerms(latinNormalizedText, LATIN_BAD_WORDS, matches);
  addMatchesFromTerms(arabicNormalizedText, ARABIC_SCRIPT_BAD_WORDS, matches);

  const uniqueMatches = [...matches];
  return {
    hasBadWord: uniqueMatches.length > 0,
    matches: uniqueMatches,
    firstMatch: uniqueMatches[0] ?? null,
  };
}

export function detectBadWords(text: string): DetectResult {
  return detectInTextInternal(text);
}

export function hasBadWord(text: string): boolean {
  return detectInTextInternal(text).hasBadWord;
}

export function detectBadWordsInFields(
  payload: Record<string, unknown>,
  fieldNames?: string[],
): DetectFieldsResult {
  const entries = fieldNames
    ? fieldNames.map((field) => [field, payload[field]] as const)
    : Object.entries(payload);

  const offendingFields = new Set<string>();
  const matches = new Set<string>();

  for (const [field, value] of entries) {
    if (typeof value !== 'string') continue;
    const result = detectInTextInternal(value);
    if (!result.hasBadWord) continue;

    offendingFields.add(field);
    for (const match of result.matches) matches.add(match);
  }

  const uniqueMatches = [...matches];
  return {
    hasBadWord: uniqueMatches.length > 0,
    matches: uniqueMatches,
    firstMatch: uniqueMatches[0] ?? null,
    offendingFields: [...offendingFields],
  };
}
