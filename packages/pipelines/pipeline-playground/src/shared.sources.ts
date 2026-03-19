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

/**
 * All sources combined — convenient for pipelines that process multiple files.
 */
export const allSources = [colorsSource, sizesSource, planetsSource, sequencesSource];
