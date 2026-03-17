import { createMemorySource } from "@ucdjs/pipelines-core/sources";

export const sharedSource = createMemorySource({
  id: "shared-data",
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
      {
        path: "data/sizes.txt",
        content: `XS; Extra Small
SM; Small
MD; Medium
LG; Large
XL; Extra Large
XXL; Double Extra Large`,
      },
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
