<p align="center">
  <img src="https://img.shields.io/visual-studio-marketplace/v/the-e3n.block-highlighter" alt="Version" />
  <img src="https://img.shields.io/visual-studio-marketplace/d/the-e3n.block-highlighter" alt="Downloads" />
  <img src="https://img.shields.io/github/license/the-e3n/block-highlighter" alt="License" />
  <img src="https://img.shields.io/github/issues/the-e3n/block-highlighter" alt="Issues" />
  <img src="https://img.shields.io/visual-studio-marketplace/stars/the-e3n.block-highlighter" alt="Rating" />
</p>
<p align="center">
  <img src="icon.jpeg" alt="drawing" width="50" />
</p>

## Block Highlighter (TS/JS,JSX/TSX) README

Highlights the current block of code that contains the
cursor.

[Download 🔗](https://marketplace.visualstudio.com/items?itemName=the-e3n.block-highlighter)

😤 No more looking for where brackets are and where this block ends

🌈 Imagine this: Your cursor becomes the magic wand, and the code around it comes to life with vibrant highlights! 💡⚡️ Whether you're debugging, exploring, or just admiring your masterpiece, this extension adds a touch of brilliance to your coding experience.

## 🚀 Features:

- Dynamic highlighting based on cursor position

- Customizable color for that personal touch

- Effortless integration with your existing VSCode setup
- Support for JSX/TSX and React Native files
- No more squinting at brackets or scrolling up and down to find the start and end of a block
- Zero configuration needed for most languages

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
- `blockHighlighter.openingBrackets`:Starting token/character that the extension will consider as start of the block. Default:
  `["{","[","("]`
- `blockHighlighter.closingBrackets`: Map of starting tokens to Ending token/character that the extension will consider as end of the block. Default: `{"{": "}","[": "]","(": ")"}`

## Supported Languages

- JavaScript like languages `(JS,TS,C,Java,C=++ etc where {,},[,],(,) are used as block delimiters)`
- JSX/TSX `(Highlighting is based on the Current selected component)`
- React Native `(Same as JSX/TSX)`

## Changelog

For the changelog, please refer to the [CHANGELOG.md](CHANGELOG.md) file

## Known Issues

- None, Currently but if you find any please let me know by raising an issue on github
