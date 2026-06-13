import { Files } from "@/types";
import {
  eslintConfigMjs,
  globalsCss,
  iconSvg,
  layoutTsx,
  nextConfigTs,
  nextEnvDTs,
  nextSvg,
  packageJson,
  pageTsx,
  postCssConfigMjs,
  tsConfigJson,
  vercelSvg,
} from "./contents";

export const nextjsFiles: Files = [
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "vercel.svg",
        type: "file",
        content: vercelSvg,
      },
      {
        name: "next.svg",
        type: "file",
        content: nextSvg,
      },
    ],
  },
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "app",
        type: "folder",
        children: [
          {
            name: "globals.css",
            type: "file",
            content: globalsCss,
          },
          {
            name: "icon.svg",
            type: "file",
            content: iconSvg,
          },
          {
            name: "layout.tsx",
            type: "file",
            content: layoutTsx,
          },
          {
            name: "page.tsx",
            type: "file",
            content: pageTsx,
          },
        ],
      },
    ],
  },
  {
    name: "eslint.config.mjs",
    type: "file",
    content: eslintConfigMjs,
  },
  {
    name: "next-env.d.ts",
    type: "file",
    content: nextEnvDTs,
  },
  {
    name: "next.config.ts",
    type: "file",
    content: nextConfigTs,
  },
  {
    name: "package.json",
    type: "file",
    content: packageJson,
  },
  {
    name: "postcss.config.mjs",
    type: "file",
    content: postCssConfigMjs,
  },
  {
    name: "tsconfig.json",
    type: "file",
    content: tsConfigJson,
  },
];
