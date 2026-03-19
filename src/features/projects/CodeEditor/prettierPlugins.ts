import typescriptPlugin from "prettier/plugins/typescript";
import babelPlugin from "prettier/plugins/babel";
import estreePlugin from "prettier/plugins/estree";
import htmlPlugin from "prettier/plugins/html";
import cssPlugin from "prettier/plugins/postcss";
import markdownPlugin from "prettier/plugins/markdown";

export const prettierPlugins = [
  typescriptPlugin,
  babelPlugin,
  estreePlugin,
  htmlPlugin,
  cssPlugin,
  markdownPlugin,
];
