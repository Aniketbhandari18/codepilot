import { Files } from "@/types";
import { fileContents } from "./contents";

export const reactFiles: Files = [
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "vite.svg",
        type: "file",
        content: fileContents["vite.svg"],
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
            content: fileContents["react.svg"],
          },
        ],
      },
      {
        name: "App.css",
        type: "file",
        content: fileContents["App.css"],
      },
      {
        name: "App.tsx",
        type: "file",
        content: fileContents["App.tsx"],
      },
      {
        name: "index.css",
        type: "file",
        content: fileContents["index.css"],
      },
      {
        name: "main.tsx",
        type: "file",
        content: fileContents["main.tsx"],
      },
    ],
  },
  {
    name: ".gitignore",
    type: "file",
    content: fileContents[".gitignore"],
  },
  {
    name: "eslint.config.js",
    type: "file",
    content: fileContents["eslint.config.js"],
  },
  {
    name: "index.html",
    type: "file",
    content: fileContents["index.html"],
  },
  {
    name: "package.json",
    type: "file",
    content: fileContents["package.json"],
  },
  {
    name: "README.md",
    type: "file",
    content: fileContents["README.md"],
  },
  {
    name: "tsconfig.app.json",
    type: "file",
    content: fileContents["tsconfig.app.json"],
  },
  {
    name: "tsconfig.json",
    type: "file",
    content: fileContents["tsconfig.json"],
  },
  {
    name: "tsconfig.node.json",
    type: "file",
    content: fileContents["tsconfig.node.json"],
  },
  {
    name: "vite.config.ts",
    type: "file",
    content: fileContents["vite.config.ts"],
  },
];
