import { Files } from "@/types";

export const react: Files = [
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "vite.svg",
        type: "file",
        content: "this is public/vite.svg",
      },
    ],
  },
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "assets",
        type: "folder",
        children: [
          {
            name: "react.svg",
            type: "file",
            content: "this is src/assets/react.svg",
          },
        ],
      },
      {
        name: "App.css",
        type: "file",
        content: "this is src/App.css",
      },
      {
        name: "App.tsx",
        type: "file",
        content: "this is src/App.tsx",
      },
      {
        name: "index.css",
        type: "file",
        content: "this is src/index.css",
      },
      {
        name: "main.tsx",
        type: "file",
        content: "this is src/main.tsx",
      },
    ],
  },
  {
    name: "eslint.config.js",
    type: "file",
    content: "this is eslint.config.js",
  },
  {
    name: "index.html",
    type: "file",
    content: "this is index.html",
  },
  {
    name: "package.json",
    type: "file",
    content: "this is package.json",
  },
  {
    name: "tsconfig.app.json",
    type: "file",
    content: "this is tsconfig.app.json",
  },
  {
    name: "tsconfig.json",
    type: "file",
    content: "this is tsconfig.json",
  },
  {
    name: "tsconfig.node.json",
    type: "file",
    content: "this is tsconfig.node.json",
  },
  {
    name: "vite.config.ts",
    type: "file",
    content: "this is vite.config.ts",
  },
];
