<p align="center">
  <img src="icon.jpeg" alt="drawing" width="50" />
</p>

## Block Highlighter (TS,JS) README

Highlights the current block of code that contains the
cursor.

[Download 🔗](https://marketplace.visualstudio.com/items?itemName=the-e3n.block-highlighter)

😤 No more looking for where brackets are and where this block ends

🌈 Imagine this: Your cursor becomes the magic wand, and the code around it comes to life with vibrant highlights! 💡⚡️ Whether you're debugging, exploring, or just admiring your masterpiece, this extension adds a touch of brilliance to your coding experience.

## 🚀 Features:

- Dynamic highlighting based on cursor position

- Customizable color for that personal touch

- Effortless integration with your existing VSCode setup

![Color is 10 red, 253 green, 255 blue, 0.04 alpha](usage.gif 'Example')

## Extension Settings

This extension contributes the following settings:

- `blockHighlighter.background`: Change the highlight
  color. Format: `#ffffffaa` or `[10,253,255,0.05]`
- `blockHighlighter.omit`: Array of languages that will
  not be parsed by this extension
- `blockHighlighter.isWholeLine`: Option to highlight
  the entire line or only the text
- `blockHighlighter.accentCurrentLine`: Option to
  choose to accent the current line more intensely
  than the rest of the block
- `blockHighlighter.startingToken`:Starting token/character that the extension will consider as start of the block. Default: `{`
- `blockHighlighter.endingToken`: Ending token/character that the extension will consider as end of the block. Default: `}`
- `blockHighlighter.lineTerminationToken`: Line Termination Token token/character that the extension will consider as end of the line. Default: `;`

## Known Issues

- None, Currently but if you find any please let me know by raising an issue on github
