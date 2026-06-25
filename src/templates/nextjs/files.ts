import { Files } from "@/types";
import { fileContents } from "./contents";

export const nextjsFiles: Files = [
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "next.svg",
        type: "file",
        content: fileContents["next.svg"],
      },
      {
        name: "vercel.svg",
        type: "file",
        content: fileContents["vercel.svg"],
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
            content: fileContents["globals.css"],
          },
          {
            name: "icon.svg",
            type: "file",
            content: fileContents["icon.svg"],
          },
          {
            name: "layout.tsx",
            type: "file",
            content: fileContents["layout.tsx"],
          },
          {
            name: "page.tsx",
            type: "file",
            content: fileContents["page.tsx"],
          },
        ],
      },
    ],
  },
  {
    name: ".eslintrc.json",
    type: "file",
    content: fileContents[".eslintrc.json"],
  },
  {
    name: ".gitignore",
    type: "file",
    content: fileContents[".gitignore"],
  },
  {
    name: "README.md",
    type: "file",
    content: fileContents["README.md"],
  },
  {
    name: "next.config.mjs",
    type: "file",
    content: fileContents["next.config.mjs"],
  },
  {
    name: "package.json",
    type: "file",
    content: fileContents["package.json"],
  },
  {
    name: "postcss.config.js",
    type: "file",
    content: fileContents["postcss.config.js"],
  },
  {
    name: "tailwind.config.ts",
    type: "file",
    content: fileContents["tailwind.config.ts"],
  },
  {
    name: "tsconfig.json",
    type: "file",
    content: fileContents["tsconfig.json"],
  },
];
