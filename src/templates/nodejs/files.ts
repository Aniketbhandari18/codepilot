import { Files } from "@/types";
import { fileContents } from "./contents";

export const nodejsFiles: Files = [
  {
    name: ".gitignore",
    type: "file",
    content: fileContents[".gitignore"],
  },
  {
    name: "index.js",
    type: "file",
    content: fileContents["index.js"],
  },
  {
    name: "package.json",
    type: "file",
    content: fileContents["package.json"],
  },
];
