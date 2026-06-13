import { Files } from "@/types";

export const nodejs: Files = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "index.ts",
        type: "file",
        content: "this is src/index.ts",
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    content: "this is package.json",
  },
];
