import { Files } from "@/types";
import { fileContents } from "./contents";

export const htmlFiles: Files = [
  {
    name: "index.html",
    type: "file",
    content: fileContents["index.html"],
  },
  {
    name: "style.css",
    type: "file",
    content: fileContents["style.css"],
  },
  {
    name: "script.js",
    type: "file",
    content: fileContents["script.js"],
  },
  {
    name: "package.json",
    type: "file",
    content: fileContents["package.json"],
  },
];
