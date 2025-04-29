# Change Log

All notable changes to the "block-highlighter"
extension will be documented in this file.

Check
[Keep a Changelog](http://keepachangelog.com/) for
recommendations on how to structure this file.

## [v0.0.1 Released]

Initial Release

## [v0.0.2]

- Change method of highlighting from tabs to block

## [v0.0.3]

- Update readme and gif

## [v1.0.0]

- Change the parser to highlight based on the current block instead of the endOf line character
- Add support for multiple languages using language specific configuration

## [v1.0.1]

- Updated the readme to include the new features
- Fixed a bug where the extension would not follow the background color set by the user (#1).

## [v1.1.0]

- Added support for highlighting in JSX/TSX files
- Highlighting now works on react in both single and multi-line components
- Added support for highlighting in React Native files

## [v1.2.0]

- Changed the bundling method to use esbuild instead of default tsc
- Added Basic Telemetry to track the number of users and config used.
- Fixed a issue where the parser was giving error due to isReact flag not being updated on file change
- Added Support for VSCode Web Version due to change in bundling method

## [v1.2.1]

- FIX: Issue where bracket inside strings were considered and leading to unexpected behavior

## [v1.2.2]

- ADD: Support for web version of vscode
- ADD: Telemetry Notice in README

## [v1.2.3]

- FIX: Issue where the extension would not work in the web version of vscode due to dependency on process

## [v1.2.4]

- ADD: Functionality to ignore single line and multi line comments
- FIX: Issue where if a comment includes a ' quote it broke the highlighting

## [v1.2.5]

- ADD: Code Tree shaking to reduce the size of the extension
- ADD: Node Polyfill to support the web version of vscode
- FIX: Issue where the extension would not activate if there were no active editors open at startup
- FIX: Issue where the multiline comment syntax was used in the single line
