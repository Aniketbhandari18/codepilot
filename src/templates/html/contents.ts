export const fileContents = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello, World!</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1 class="title">Hello World!</h1>
    <p id="currentTime"></p>
    <script src="script.js"></script>
  </body>
</html>
`,

  "script.js": `const timer = document.getElementById("currentTime");

setInterval(() => {
  timer.innerText = new Date().toLocaleString();
}, 1000);
`,

  "style.css": `body {
  padding: 25px;
}

.title {
  color: #5c6ac4;
}
`,

  "package.json": `{
  "scripts": {
    "start": "servor --reload"
  },
  "dependencies": {
    "servor": "^4.0.2"
  }
}
`,
};
