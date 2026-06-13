import { Files } from "@/types";

export const nextjs: Files = [
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "vercel.svg",
        type: "file",
        content: "this is public/vercel.svg",
      },
      {
        name: "next.svg",
        type: "file",
        content: "this is public/next.svg",
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
            content: "this is src/app/globals.css",
          },
          {
            name: "icon.svg",
            type: "file",
            content: "this is src/app/icon.svg",
          },
          {
            name: "layout.tsx",
            type: "file",
            content: "this is src/app/layout.tsx",
          },
          {
            name: "page.tsx",
            type: "file",
            content: "this is src/app/page.tsx",
          },
        ],
      },
    ],
  },
  {
    name: "eslint.config.mjs",
    type: "file",
    content: "this is eslint.config.mjs",
  },
  {
    name: "next-env.d.ts",
    type: "file",
    content: "this is next-env.d.ts",
  },
  {
    name: "next.config.ts",
    type: "file",
    content: "this is next.config.ts",
  },
  {
    name: "package.json",
    type: "file",
    content: "this is package.json",
  },
  {
    name: "postcss.config.mjs",
    type: "file",
    content: "this is postcss.config.mjs",
  },
  {
    name: "tsconfig.json",
    type: "file",
    content: "this is tsconfig.json",
  },
];
