import { createMemorySource } from "@ucdjs/pipelines-core/sources";

export const colorsSource = createMemorySource({
  id: "colors",
  files: {
    "1.0.0": [
      {
        path: "data/colors.txt",
        content: `FF0000; Red
00FF00; Green
0000FF; Blue
FFFF00; Yellow
FF00FF; Magenta
00FFFF; Cyan`,
      },
    ],
  },
});

export const sizesSource = createMemorySource({
  id: "sizes",
  files: {
    "1.0.0": [
      {
        path: "data/sizes.txt",
        content: `XS; Extra Small
SM; Small
MD; Medium
LG; Large
XL; Extra Large
XXL; Double Extra Large`,
      },
    ],
  },
});

export const planetsSource = createMemorySource({
  id: "planets",
  files: {
    "1.0.0": [
      {
        path: "data/planets.txt",
        content: `1; Mercury
2; Venus
3; Earth
4; Mars
5; Jupiter
6; Saturn
7; Uranus
8; Neptune`,
      },
    ],
  },
});

export const sequencesSource = createMemorySource({
  id: "sequences",
  files: {
    "1.0.0": [
      {
        path: "data/sequences.txt",
        content: `0041 0308; A_DIAERESIS
006F 0308; O_DIAERESIS`,
      },
    ],
  },
});

export const ucdSource = createMemorySource({
  id: "test-data",
  files: {
    "16.0.0": [
      {
        path: "ucd/UnicodeData.txt",
        content: `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0042;LATIN CAPITAL LETTER B;Lu;0;L;;;;;N;;;;0062;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041
0062;LATIN SMALL LETTER B;Ll;0;L;;;;;N;;;0042;;0042`,
      },
      {
        path: "ucd/Blocks.txt",
        content: `0000..007F; Basic Latin
0080..00FF; Latin-1 Supplement`,
      },
      {
        path: "ucd/Scripts.txt",
        content: `0000..007F; Latin
0080..00FF; Latin`,
      },
      {
        path: "ucd/LineBreak.txt",
        content: `0000..0008; CM
0009; BA
000A; LF`,
      },
      {
        path: "ucd/PropList.txt",
        content: `0000..001F; Control
007F..009F; Control`,
      },
      {
        path: "ucd/Sequences.txt",
        content: `0041 0308; A_WITH_DIAERESIS
0061 0308; a_WITH_DIAERESIS`,
      },
    ],
    "15.1.0": [
      {
        path: "ucd/UnicodeData.txt",
        content: `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041`,
      },
      {
        path: "ucd/Blocks.txt",
        content: `0000..007F; Basic Latin`,
      },
    ],
    "15.0.0": [
      {
        path: "ucd/UnicodeData.txt",
        content: `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041`,
      },
      {
        path: "ucd/Blocks.txt",
        content: `0000..007F; Basic Latin`,
      },
    ],
  },
});

export const emojiSource = createMemorySource({
  id: "emoji-data",
  files: {
    "16.0.0": [
      {
        path: "emoji/emoji-data.txt",
        content: `231A..231B; Emoji
23E9..23EC; Emoji`,
      },
      {
        path: "emoji/emoji-sequences.txt",
        content: `231A..231B; Emoji; Watch
23E9..23EC; Emoji; Arrow`,
      },
    ],
  },
});

export const allSources = [colorsSource, sizesSource, planetsSource, sequencesSource];
