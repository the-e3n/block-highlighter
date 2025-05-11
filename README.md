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

## Block Highlighter (TS/JS,JSX/TSX/HTML/PYTHON) README

Highlights the current block of code that contains the
cursor.

[Download 🔗](https://marketplace.visualstudio.com/items?itemName=the-e3n.block-highlighter)

😤 No more looking for where brackets are or where this block ends

🌈 Imagine this: Your cursor becomes the magic wand, and the code around it comes to life with vibrant highlights! 💡⚡️ Whether you're debugging, exploring, or just admiring your masterpiece, this extension adds a touch of brilliance to your coding experience.

## 🚀 Features:

- Dynamic highlighting based on cursor position
- Customizable color for that personal touch
- Effortless integration with your existing VSCode setup
- Support for JSX/TSX , React Native files, HTML, Python
- No more squinting at brackets or scrolling up and down to find the start and end of a block
- Zero configuration needed for most languages

### EXAMPLES

![Color is 10 red, 253 green, 255 blue, 0.04 alpha](usage.gif 'Example')
![Color is 10 red, 253 green, 255 blue, 0.04 alpha](react-usage.gif 'Example')

## Extension Settings

This extension contributes the following settings:

- `blockHighlighter.background`: Change the highlight
  color. Format: HEX code with alpha `#ffffffaa` or RGBA notation as `[10,253,255,0.05]` or CSS colors like `blue` ,Default: `#97fdff13`
- `blockHighlighter.omit`: Array of languages that will
  not be parsed by this extension. Default: `["plain","markdown"]`
- `blockHighlighter.isWholeLine`: Option to highlight
  the entire line or only the text. Default: `true`
- `blockHighlighter.accentCurrentLine`: Option to
  choose to accent the current line more intensely
  than the rest of the block. Default: `true`
- `blockHighlighter.openingBrackets`:Starting token/character that the extension will consider as start of the block. Default:
  `["{","[","("]`
- `blockHighlighter.closingBrackets`: Map of starting tokens to Ending token/character that the extension will consider as end of the block. Default: `{"{": "}","[": "]","(": ")"}`
- `blockHighlighter.singleLineComment`: Array of
  single line comment tokens that will be ignored by the extension. Default: `["//","#"]`
- `blockHighlighter.multiLineCommentStart`: Array of
  multi line comment tokens that will be ignored by the extension. Default: `["/*"]`
- `blockHighlighter.multiLineCommentEnd`: Array of
  multi line comment tokens that will be ignored by the extension. Default: `["*/"]`
- `blockHighlighter.stringLiterals`: Array of string
  literal tokens whose pairs will be ignored by the extension. Default: `` ['"', "'", '`'] ``
- `blockHighlighter.showBorder`: Option to Show the border around left side of the block
- `blockHighlighter.showBorder`: Option to change the border. Default `false`
  color. Format: HEX code with alpha `#ffffffaa` or RGBA notation as `[10,253,255,0.05]` or CSS colors like `blue` ,Default: `red`

## Supported Languages

- JavaScript like languages `(JS,TS,C,Java,C++ etc where {,},[,],(,) are used as block delimiters)`
- React (JSX/TSX) `(Highlighting is based on the Current selected component)`
- React Native `(Same as React)`
- HTML tags will be highlighted `(Same as React)`
- Python like languages which follows indentation block delimiters. For now `python`,` yaml`, `haskell` are supported
- Any other language that has some form of block delimiters
- The extension is language agnostic and will work with any language that has some form of block delimiters. The default settings should work for most languages, but you can customize the settings to suit your needs.
- XML - The extension will not work with these languages for now. If you want support for these languages, please raise an issue on github and I will try to add support for them.

## Changelog

For the changelog, please refer to the [CHANGELOG.md](CHANGELOG.md) file

## Known Issues

- None, Currently but if you find any please let me know by raising an issue on github

## Basic Telemetry Collection

This extension collects basic telemetry provided by VSCode to track the number of users and the configuration used. This data is used to improve the extension and provide better support to the users. No personal data is collected. You can opt-out of telemetry by disabling it in vscode settings. You can also get your data or ask to delete it by contacting me through github.
