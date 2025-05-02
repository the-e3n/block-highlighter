import traverse, { Node } from '@babel/traverse';
import { createHash } from 'crypto';
import * as vscode from 'vscode';
import { Config } from './config';
import { logger } from './utils';
import { parse } from '@babel/parser';

export class BlockHighlighter {
  /**
   * This variable is used to store the decoration type for the highlighted block
   */
  highlightDecoration: vscode.TextEditorDecorationType | null = null;

  /**
   * This variable is used to store the decoration type for the current line
   * It allows us to accentuate the current line
   */
  currentDecoration: vscode.TextEditorDecorationType | null = null;

  /**
   * This variable is used to check if the current file is a React file or not
   */
  isReact: boolean = false;
  /**
   * This variable is used to store the JSX nodes
   */
  JSXNodes: Node[] = [];
  /**
   * This stores the config of the extension
   */
  config: Config;

  /**
   * This variable is used to store the hash of the code
   */
  hash: string = '';
  constructor(config: Config) {
    this.config = config;
  }
  /**
   * This function is used to highlight the block of code
   * It finds the block of code and highlights it
   */
  highlight() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;
    if (
      ['javascriptreact', 'typescriptreact'].includes(
        activeEditor.document.languageId,
      )
    ) {
      this.isReact = true; // Flag to indicate if the document is a React file.
    }
    if (
      activeEditor?.document.languageId &&
      this.config.omit &&
      this.config.omit.includes(activeEditor.document.languageId)
    ) {
      return;
    }
    if (activeEditor) {
      const range = this.findBrackets(activeEditor);
      if (range) {
        this.highlightRange(activeEditor, range);
      } else {
        this.unhighlightAll();
      }
    } else {
      this.unhighlightAll();
    }
  }
  /**
   * This function is used to find the block of code to highlight
   * Returns the range of the block of code
   */
  findBrackets(editor: vscode.TextEditor) {
    const start = performance.now();
    const ranges = this.isReact ? this.findJSXBlock(editor) : [];

    const top = this.findTop(editor);
    if (!top) {
      return undefined;
    }
    const bottom = this.findBottom(editor, [top]);

    if (!top || !bottom) {
      return;
    }
    const allRanges = [
      new vscode.Range(top.pos, bottom.end),
      ...(ranges ? ranges : []),
    ];

    const currentRange = allRanges.reduce((smallest, current) => {
      if (!smallest) return current;
      const smallestSize =
        smallest.end.character -
        smallest.start.character +
        (smallest.end.line - smallest.start.line) * Number.MAX_SAFE_INTEGER;
      if (!current) return smallest;
      const currentSize =
        current.end.character -
        current.start.character +
        (current.end.line - current.start.line) * Number.MAX_SAFE_INTEGER;
      return currentSize < smallestSize ? current : smallest;
    }, allRanges[0]);

    const end = performance.now();
    const delta = end - start;
    console.debug(`[Block Highlighter] Found range in ${delta.toFixed(4)}ms.`);

    return currentRange;
  }
  /**
   * This function is used to find the top of the block of code
   * It finds the first opening bracket and returns its position
   */
  findTop(editor: vscode.TextEditor) {
    const document = editor.document;
    const stack: {
      char: string;
      pos: vscode.Position;
    }[] = [];

    let lineIndex = editor.selection.active.line;
    const stringStack: string[] = [];
    let insideMultilineComment = false;
    for (let i = lineIndex; i >= 0; i--) {
      const line = document.lineAt(i);
      const lineText = line.text;
      const trimmedLineText = lineText.trim();

      // Skip empty lines and single line comments
      if (
        trimmedLineText === '' ||
        this.config.singleLineCommentStart.some((c) =>
          trimmedLineText.startsWith(c),
        )
      ) {
        continue;
      }
      // Toggle the inside multiline comment flag
      if (
        this.config.multiLineCommentStart.some((c) =>
          trimmedLineText.startsWith(c),
        )
      ) {
        // For multi-line comments syntax but it is in the same line
        if (
          this.config.multiLineCommentEnd.some((c) =>
            trimmedLineText.endsWith(c),
          )
        ) {
          continue;
        }
        insideMultilineComment = !insideMultilineComment;
        continue;
      }
      // Toggle the inside multiline comment flag
      if (
        this.config.multiLineCommentEnd.some((c) =>
          trimmedLineText.startsWith(c),
        )
      ) {
        insideMultilineComment = !insideMultilineComment;
        continue;
      }
      if (insideMultilineComment) continue; // Skip lines inside multiline comments

      const textLength = lineText.length;

      for (let j = textLength - 1; j >= 0; j--) {
        const char = lineText[j];

        if (this.config.stringElements.includes(char)) {
          const last = stringStack[stringStack.length - 1];
          if (last === char) {
            stringStack.pop();
          } else if (last !== char) {
            stringStack.push(char);
          }
        }
        if (stringStack.length > 0) continue;

        if (this.config.closingBrackets.includes(char)) {
          stack.push({
            char,
            pos: new vscode.Position(i, j),
          });
        } else if (this.config.openingBrackets.includes(char)) {
          const last = stack.pop();
          if (!last) {
            return {
              char,
              pos: new vscode.Position(i, j),
            };
          }
        }
      }
    }
  }
  /**
   * This function is used to find the bottom of the block of code
   * It finds the first closing bracket and returns its position
   */
  findBottom(
    editor: vscode.TextEditor,
    stack: {
      char: string;
      pos: vscode.Position;
    }[] = [],
  ) {
    const document = editor.document;
    let lineIndex = stack[0] ? stack[0].pos.line : editor.selection.active.line;

    const stringStack: string[] = [];
    let insideMultilineComment = false;
    for (let i = lineIndex; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const lineText = line.text;
      const textLength = lineText.length;
      let j =
        stack[0] && i === stack[0].pos.line ? stack[0].pos.character + 1 : 0;
      const trimmedLineText = lineText.trim();

      // Skip empty lines and single line comments
      if (
        trimmedLineText === '' ||
        this.config.singleLineCommentStart.some((c) =>
          trimmedLineText.startsWith(c),
        )
      ) {
        continue;
      }
      // Toggle the inside multiline comment flag
      if (
        this.config.multiLineCommentStart.some((c) =>
          trimmedLineText.startsWith(c),
        )
      ) {
        // For multi-line comments syntax but it is in the same line
        if (
          this.config.multiLineCommentEnd.some((c) =>
            trimmedLineText.endsWith(c),
          )
        ) {
          continue;
        }
        insideMultilineComment = !insideMultilineComment;
        continue;
      }
      // Toggle the inside multiline comment flag
      if (
        this.config.multiLineCommentEnd.some((c) =>
          trimmedLineText.startsWith(c),
        )
      ) {
        insideMultilineComment = !insideMultilineComment;
        continue;
      }
      if (insideMultilineComment) continue; // Skip lines inside multiline comments

      for (; j < textLength; j++) {
        const char = lineText[j];
        if (this.config.stringElements.includes(char)) {
          const last = stringStack[stringStack.length - 1];
          if (last === char) {
            stringStack.pop();
          } else if (last !== char) {
            stringStack.push(char);
          }
        }
        if (stringStack.length > 0) continue;

        if (this.config.openingBrackets.includes(char)) {
          stack.push({
            char,
            pos: new vscode.Position(i, j),
          });
        } else if (this.config.closingBrackets.includes(char)) {
          const last = stack.pop();
          if (!last) {
            return;
          }

          if (
            this.config.closingBracketsMap[last.char] === char &&
            stack.length === 0
          ) {
            return new vscode.Range(last.pos, new vscode.Position(i, j));
          }
        }
      }
    }
  }
  /**
   * This function is used to find the JSX block of code
   * It finds the first opening bracket and returns its position
   */
  findJSXBlock(editor: vscode.TextEditor) {
    const document = editor.document;

    try {
      const blocks = this.parseJSXElementsFromCode(document);
      let selection = editor.selection;
      const ranges = blocks.map((block) => {
        if (!block.loc) return null;
        const start = new vscode.Position(
          block.loc.start.line - 1,
          block.loc.start.column,
        );
        const end = new vscode.Position(
          block.loc.end.line - 1,
          block.loc.end.column,
        );
        return new vscode.Range(start, end);
      });
      const containingRanges = ranges.filter(
        (range) => range && range.contains(selection),
      );

      if (containingRanges.length === 0) {
        return null; // No range contains the cursor
      }

      // Find the smallest range
      return containingRanges;
    } catch (error) {
      return null;
    }
  }
  /**
   * This function is used to parse the JSX elements from the code
   * It uses Babel parser to parse the code and find the JSX elements
   */
  parseJSXElementsFromCode(document: vscode.TextDocument) {
    const code = document.getText();
    const newHash = this.hashString(code);
    if (this.hash === newHash) {
      return this.JSXNodes;
    }
    this.hash = newHash;
    this.JSXNodes = [];

    try {
      const ast = parse(code, {
        allowAwaitOutsideFunction: true,
        allowImportExportEverywhere: true,
        strictMode: false,
        plugins: [
          'jsx',
          'typescript',
          'decimal',
          'classProperties',
          'bigInt',
          'dynamicImport',
          'optionalChaining',
          'nullishCoalescingOperator',
          'decorators',
          'exportDefaultFrom',
          'optionalChaining',
          'objectRestSpread',
          'jsonStrings',
          'functionBind',
          'importMeta',
        ],
        allowReturnOutsideFunction: true,
        attachComment: false,
        errorRecovery: true,
      });
      traverse(ast, {
        JSXElement: (path) => {
          this.JSXNodes.push(path.node);
        },
      });
    } catch (error) {
      logger.logError('error-in-parseJSXElementsFromCode', { error });
      console.debug(`[-] Error in parseJSXElementsFromCode: ${error}`);
    }
    return this.JSXNodes;
  }
  /**
   * This function is used to highlight the block of code
   * It uses the decoration type to highlight the block of code
   */
  highlightRange(editor: vscode.TextEditor, range: vscode.Range) {
    if (this.highlightDecoration) {
      this.highlightDecoration.dispose();
    }
    if (this.currentDecoration) {
      this.currentDecoration.dispose();
    }

    this.highlightDecoration = vscode.window.createTextEditorDecorationType(<
      vscode.DecorationRenderOptions
    >{
      backgroundColor: this.config.backgroundColor,
      isWholeLine: this.config.wholeLine,
      ...(this.config.showBorder && {
        borderStyle: 'none none none solid',
        borderWidth: '0    0     0     1px',
        borderColor: `transparent transparent transparent ${this.config.borderColor}`,
      }),
    });
    this.currentDecoration = vscode.window.createTextEditorDecorationType(<
      vscode.DecorationRenderOptions
    >{
      backgroundColor: this.config.backgroundColor,
      isWholeLine: this.config.wholeLine,
    });

    editor.setDecorations(this.highlightDecoration, [range]);
    if (this.config.accentCurrent) {
      editor.setDecorations(this.currentDecoration, [editor.selection]);
    }
  }
  /**
   * This function gets the md5 hash of the input string
   * It is used to check if the code has changed or not
   */
  hashString(inputString: string) {
    return createHash('md5').update(inputString).digest('hex');
  }
  /**
   * This function is used to unhighlight all the blocks of code
   */
  unhighlightAll() {
    if (this.highlightDecoration) {
      this.highlightDecoration.dispose();
    }
    if (this.currentDecoration) {
      this.currentDecoration.dispose();
    }
  }
}
