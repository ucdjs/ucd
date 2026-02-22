import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export interface UnicodeBlock {
  id: string;
  name: string;
  startCodepoint: number;
  endCodepoint: number;
  start: string;
  end: string;
  characterCount: number;
}

// Common Unicode blocks data
// This can be replaced with an API call when the endpoint is available
const COMMON_BLOCKS: Omit<UnicodeBlock, "characterCount">[] = [
  { id: "basic-latin", name: "Basic Latin", startCodepoint: 0x0000, endCodepoint: 0x007F, start: "0000", end: "007F" },
  { id: "latin-1-supplement", name: "Latin-1 Supplement", startCodepoint: 0x0080, endCodepoint: 0x00FF, start: "0080", end: "00FF" },
  { id: "latin-extended-a", name: "Latin Extended-A", startCodepoint: 0x0100, endCodepoint: 0x017F, start: "0100", end: "017F" },
  { id: "latin-extended-b", name: "Latin Extended-B", startCodepoint: 0x0180, endCodepoint: 0x024F, start: "0180", end: "024F" },
  { id: "ipa-extensions", name: "IPA Extensions", startCodepoint: 0x0250, endCodepoint: 0x02AF, start: "0250", end: "02AF" },
  { id: "spacing-modifier-letters", name: "Spacing Modifier Letters", startCodepoint: 0x02B0, endCodepoint: 0x02FF, start: "02B0", end: "02FF" },
  { id: "combining-diacritical-marks", name: "Combining Diacritical Marks", startCodepoint: 0x0300, endCodepoint: 0x036F, start: "0300", end: "036F" },
  { id: "greek-and-coptic", name: "Greek and Coptic", startCodepoint: 0x0370, endCodepoint: 0x03FF, start: "0370", end: "03FF" },
  { id: "cyrillic", name: "Cyrillic", startCodepoint: 0x0400, endCodepoint: 0x04FF, start: "0400", end: "04FF" },
  { id: "cyrillic-supplement", name: "Cyrillic Supplement", startCodepoint: 0x0500, endCodepoint: 0x052F, start: "0500", end: "052F" },
  { id: "armenian", name: "Armenian", startCodepoint: 0x0530, endCodepoint: 0x058F, start: "0530", end: "058F" },
  { id: "hebrew", name: "Hebrew", startCodepoint: 0x0590, endCodepoint: 0x05FF, start: "0590", end: "05FF" },
  { id: "arabic", name: "Arabic", startCodepoint: 0x0600, endCodepoint: 0x06FF, start: "0600", end: "06FF" },
  { id: "syriac", name: "Syriac", startCodepoint: 0x0700, endCodepoint: 0x074F, start: "0700", end: "074F" },
  { id: "thaana", name: "Thaana", startCodepoint: 0x0780, endCodepoint: 0x07BF, start: "0780", end: "07BF" },
  { id: "devanagari", name: "Devanagari", startCodepoint: 0x0900, endCodepoint: 0x097F, start: "0900", end: "097F" },
  { id: "bengali", name: "Bengali", startCodepoint: 0x0980, endCodepoint: 0x09FF, start: "0980", end: "09FF" },
  { id: "gurmukhi", name: "Gurmukhi", startCodepoint: 0x0A00, endCodepoint: 0x0A7F, start: "0A00", end: "0A7F" },
  { id: "gujarati", name: "Gujarati", startCodepoint: 0x0A80, endCodepoint: 0x0AFF, start: "0A80", end: "0AFF" },
  { id: "oriya", name: "Oriya", startCodepoint: 0x0B00, endCodepoint: 0x0B7F, start: "0B00", end: "0B7F" },
  { id: "tamil", name: "Tamil", startCodepoint: 0x0B80, endCodepoint: 0x0BFF, start: "0B80", end: "0BFF" },
  { id: "telugu", name: "Telugu", startCodepoint: 0x0C00, endCodepoint: 0x0C7F, start: "0C00", end: "0C7F" },
  { id: "kannada", name: "Kannada", startCodepoint: 0x0C80, endCodepoint: 0x0CFF, start: "0C80", end: "0CFF" },
  { id: "malayalam", name: "Malayalam", startCodepoint: 0x0D00, endCodepoint: 0x0D7F, start: "0D00", end: "0D7F" },
  { id: "sinhala", name: "Sinhala", startCodepoint: 0x0D80, endCodepoint: 0x0DFF, start: "0D80", end: "0DFF" },
  { id: "thai", name: "Thai", startCodepoint: 0x0E00, endCodepoint: 0x0E7F, start: "0E00", end: "0E7F" },
  { id: "lao", name: "Lao", startCodepoint: 0x0E80, endCodepoint: 0x0EFF, start: "0E80", end: "0EFF" },
  { id: "tibetan", name: "Tibetan", startCodepoint: 0x0F00, endCodepoint: 0x0FFF, start: "0F00", end: "0FFF" },
  { id: "myanmar", name: "Myanmar", startCodepoint: 0x1000, endCodepoint: 0x109F, start: "1000", end: "109F" },
  { id: "georgian", name: "Georgian", startCodepoint: 0x10A0, endCodepoint: 0x10FF, start: "10A0", end: "10FF" },
  { id: "hangul-jamo", name: "Hangul Jamo", startCodepoint: 0x1100, endCodepoint: 0x11FF, start: "1100", end: "11FF" },
  { id: "ethiopic", name: "Ethiopic", startCodepoint: 0x1200, endCodepoint: 0x137F, start: "1200", end: "137F" },
  { id: "cherokee", name: "Cherokee", startCodepoint: 0x13A0, endCodepoint: 0x13FF, start: "13A0", end: "13FF" },
  { id: "unified-canadian-aboriginal-syllabics", name: "Unified Canadian Aboriginal Syllabics", startCodepoint: 0x1400, endCodepoint: 0x167F, start: "1400", end: "167F" },
  { id: "ogham", name: "Ogham", startCodepoint: 0x1680, endCodepoint: 0x169F, start: "1680", end: "169F" },
  { id: "runic", name: "Runic", startCodepoint: 0x16A0, endCodepoint: 0x16FF, start: "16A0", end: "16FF" },
  { id: "tagalog", name: "Tagalog", startCodepoint: 0x1700, endCodepoint: 0x171F, start: "1700", end: "171F" },
  { id: "khmer", name: "Khmer", startCodepoint: 0x1780, endCodepoint: 0x17FF, start: "1780", end: "17FF" },
  { id: "mongolian", name: "Mongolian", startCodepoint: 0x1800, endCodepoint: 0x18AF, start: "1800", end: "18AF" },
  { id: "limbu", name: "Limbu", startCodepoint: 0x1900, endCodepoint: 0x194F, start: "1900", end: "194F" },
  { id: "tai-le", name: "Tai Le", startCodepoint: 0x1950, endCodepoint: 0x197F, start: "1950", end: "197F" },
  { id: "khmer-symbols", name: "Khmer Symbols", startCodepoint: 0x19E0, endCodepoint: 0x19FF, start: "19E0", end: "19FF" },
  { id: "phonetic-extensions", name: "Phonetic Extensions", startCodepoint: 0x1D00, endCodepoint: 0x1D7F, start: "1D00", end: "1D7F" },
  { id: "latin-extended-additional", name: "Latin Extended Additional", startCodepoint: 0x1E00, endCodepoint: 0x1EFF, start: "1E00", end: "1EFF" },
  { id: "greek-extended", name: "Greek Extended", startCodepoint: 0x1F00, endCodepoint: 0x1FFF, start: "1F00", end: "1FFF" },
  { id: "general-punctuation", name: "General Punctuation", startCodepoint: 0x2000, endCodepoint: 0x206F, start: "2000", end: "206F" },
  { id: "superscripts-and-subscripts", name: "Superscripts and Subscripts", startCodepoint: 0x2070, endCodepoint: 0x209F, start: "2070", end: "209F" },
  { id: "currency-symbols", name: "Currency Symbols", startCodepoint: 0x20A0, endCodepoint: 0x20CF, start: "20A0", end: "20CF" },
  { id: "combining-diacritical-marks-for-symbols", name: "Combining Diacritical Marks for Symbols", startCodepoint: 0x20D0, endCodepoint: 0x20FF, start: "20D0", end: "20FF" },
  { id: "letterlike-symbols", name: "Letterlike Symbols", startCodepoint: 0x2100, endCodepoint: 0x214F, start: "2100", end: "214F" },
  { id: "number-forms", name: "Number Forms", startCodepoint: 0x2150, endCodepoint: 0x218F, start: "2150", end: "218F" },
  { id: "arrows", name: "Arrows", startCodepoint: 0x2190, endCodepoint: 0x21FF, start: "2190", end: "21FF" },
  { id: "mathematical-operators", name: "Mathematical Operators", startCodepoint: 0x2200, endCodepoint: 0x22FF, start: "2200", end: "22FF" },
  { id: "miscellaneous-technical", name: "Miscellaneous Technical", startCodepoint: 0x2300, endCodepoint: 0x23FF, start: "2300", end: "23FF" },
  { id: "control-pictures", name: "Control Pictures", startCodepoint: 0x2400, endCodepoint: 0x243F, start: "2400", end: "243F" },
  { id: "optical-character-recognition", name: "Optical Character Recognition", startCodepoint: 0x2440, endCodepoint: 0x245F, start: "2440", end: "245F" },
  { id: "enclosed-alphanumerics", name: "Enclosed Alphanumerics", startCodepoint: 0x2460, endCodepoint: 0x24FF, start: "2460", end: "24FF" },
  { id: "box-drawing", name: "Box Drawing", startCodepoint: 0x2500, endCodepoint: 0x257F, start: "2500", end: "257F" },
  { id: "block-elements", name: "Block Elements", startCodepoint: 0x2580, endCodepoint: 0x259F, start: "2580", end: "259F" },
  { id: "geometric-shapes", name: "Geometric Shapes", startCodepoint: 0x25A0, endCodepoint: 0x25FF, start: "25A0", end: "25FF" },
  { id: "miscellaneous-symbols", name: "Miscellaneous Symbols", startCodepoint: 0x2600, endCodepoint: 0x26FF, start: "2600", end: "26FF" },
  { id: "dingbats", name: "Dingbats", startCodepoint: 0x2700, endCodepoint: 0x27BF, start: "2700", end: "27BF" },
  { id: "miscellaneous-mathematical-symbols-a", name: "Miscellaneous Mathematical Symbols-A", startCodepoint: 0x27C0, endCodepoint: 0x27EF, start: "27C0", end: "27EF" },
  { id: "supplemental-arrows-a", name: "Supplemental Arrows-A", startCodepoint: 0x27F0, endCodepoint: 0x27FF, start: "27F0", end: "27FF" },
  { id: "braille-patterns", name: "Braille Patterns", startCodepoint: 0x2800, endCodepoint: 0x28FF, start: "2800", end: "28FF" },
  { id: "supplemental-arrows-b", name: "Supplemental Arrows-B", startCodepoint: 0x2900, endCodepoint: 0x297F, start: "2900", end: "297F" },
  { id: "miscellaneous-mathematical-symbols-b", name: "Miscellaneous Mathematical Symbols-B", startCodepoint: 0x2980, endCodepoint: 0x29FF, start: "2980", end: "29FF" },
  { id: "supplemental-mathematical-operators", name: "Supplemental Mathematical Operators", startCodepoint: 0x2A00, endCodepoint: 0x2AFF, start: "2A00", end: "2AFF" },
  { id: "miscellaneous-symbols-and-arrows", name: "Miscellaneous Symbols and Arrows", startCodepoint: 0x2B00, endCodepoint: 0x2BFF, start: "2B00", end: "2BFF" },
  { id: "cjk-radicals-supplement", name: "CJK Radicals Supplement", startCodepoint: 0x2E80, endCodepoint: 0x2EFF, start: "2E80", end: "2EFF" },
  { id: "kangxi-radicals", name: "Kangxi Radicals", startCodepoint: 0x2F00, endCodepoint: 0x2FDF, start: "2F00", end: "2FDF" },
  { id: "cjk-unified-ideographs-extension-a", name: "CJK Unified Ideographs Extension A", startCodepoint: 0x3400, endCodepoint: 0x4DBF, start: "3400", end: "4DBF" },
  { id: "cjk-unified-ideographs", name: "CJK Unified Ideographs", startCodepoint: 0x4E00, endCodepoint: 0x9FFF, start: "4E00", end: "9FFF" },
  { id: "yi-syllables", name: "Yi Syllables", startCodepoint: 0xA000, endCodepoint: 0xA48F, start: "A000", end: "A48F" },
  { id: "yi-radicals", name: "Yi Radicals", startCodepoint: 0xA490, endCodepoint: 0xA4CF, start: "A490", end: "A4CF" },
  { id: "hangul-syllables", name: "Hangul Syllables", startCodepoint: 0xAC00, endCodepoint: 0xD7AF, start: "AC00", end: "D7AF" },
  { id: "high-surrogates", name: "High Surrogates", startCodepoint: 0xD800, endCodepoint: 0xDB7F, start: "D800", end: "DB7F" },
  { id: "high-private-use-surrogates", name: "High Private Use Surrogates", startCodepoint: 0xDB80, endCodepoint: 0xDBFF, start: "DB80", end: "DBFF" },
  { id: "low-surrogates", name: "Low Surrogates", startCodepoint: 0xDC00, endCodepoint: 0xDFFF, start: "DC00", end: "DFFF" },
  { id: "private-use-area", name: "Private Use Area", startCodepoint: 0xE000, endCodepoint: 0xF8FF, start: "E000", end: "F8FF" },
  { id: "cjk-compatibility-ideographs", name: "CJK Compatibility Ideographs", startCodepoint: 0xF900, endCodepoint: 0xFAFF, start: "F900", end: "FAFF" },
  { id: "alphabetic-presentation-forms", name: "Alphabetic Presentation Forms", startCodepoint: 0xFB00, endCodepoint: 0xFB4F, start: "FB00", end: "FB4F" },
  { id: "arabic-presentation-forms-a", name: "Arabic Presentation Forms-A", startCodepoint: 0xFB50, endCodepoint: 0xFDFF, start: "FB50", end: "FDFF" },
  { id: "combining-half-marks", name: "Combining Half Marks", startCodepoint: 0xFE20, endCodepoint: 0xFE2F, start: "FE20", end: "FE2F" },
  { id: "cjk-compatibility-forms", name: "CJK Compatibility Forms", startCodepoint: 0xFE30, endCodepoint: 0xFE4F, start: "FE30", end: "FE4F" },
  { id: "small-form-variants", name: "Small Form Variants", startCodepoint: 0xFE50, endCodepoint: 0xFE6F, start: "FE50", end: "FE6F" },
  { id: "arabic-presentation-forms-b", name: "Arabic Presentation Forms-B", startCodepoint: 0xFE70, endCodepoint: 0xFEFF, start: "FE70", end: "FEFF" },
  { id: "halfwidth-and-fullwidth-forms", name: "Halfwidth and Fullwidth Forms", startCodepoint: 0xFF00, endCodepoint: 0xFFEF, start: "FF00", end: "FFEF" },
  { id: "specials", name: "Specials", startCodepoint: 0xFFF0, endCodepoint: 0xFFFF, start: "FFF0", end: "FFFF" },
];

export const fetchBlocks = createServerFn({ method: "GET" })
  .inputValidator((data: { version: string }) => data)
  .handler(async ({ data: _ }) => {
    // TODO: Replace with actual API call when endpoint exists
    // For now, return the common blocks with calculated character counts
    const blocks = COMMON_BLOCKS.map((block) => ({
      ...block,
      characterCount: block.endCodepoint - block.startCodepoint + 1,
    }));

    return blocks;
  });

export const fetchBlock = createServerFn({ method: "GET" })
  .inputValidator((data: { version: string; id: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call when endpoint exists
    const block = COMMON_BLOCKS.find((b) => b.id === data.id);

    if (!block) {
      throw new Error(`Block not found: ${data.id}`);
    }

    return {
      ...block,
      characterCount: block.endCodepoint - block.startCodepoint + 1,
    };
  });

export function blocksQueryOptions(version: string) {
  return queryOptions({
    queryKey: ["blocks", version],
    queryFn: () => fetchBlocks({ data: { version } }),
    staleTime: 1000 * 60 * 60,
  });
}

export function blockQueryOptions(version: string, id: string) {
  return queryOptions({
    queryKey: ["block", version, id],
    queryFn: () => fetchBlock({ data: { version, id } }),
    staleTime: 1000 * 60 * 60,
  });
}
