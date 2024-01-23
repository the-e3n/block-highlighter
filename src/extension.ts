'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let highlightDecoration: vscode.TextEditorDecorationType;
let currentDecoration: vscode.TextEditorDecorationType;
let openingBrackets: string[];
let closingBracketsMap: Record<string, string>;
let closingBrackets: string[];

export function activate(context: vscode.ExtensionContext) {
  let config = vscode.workspace.getConfiguration('blockHighlighter');
  let omit: string[] = config.get('omit', ['markdown', 'plaintext']);

  const activeEditor = vscode.window.activeTextEditor;
  if (
    activeEditor?.document.languageId &&
    omit &&
    omit.includes(activeEditor.document.languageId)
  ) {
    return;
  }

  const configOpeningBrackets = config.get('openingBrackets', ['{', '[', '(']);
  const configClosingBrackets = config.get('closingBrackets', {
    '{': '}',
    '[': ']',
    '(': ')',
  });
  openingBrackets = configOpeningBrackets;
  closingBracketsMap = configClosingBrackets;
  closingBrackets = Object.values(configClosingBrackets);

  if (activeEditor) {
    const range = findBrackets(activeEditor, activeEditor.document);
    if (range) {
      highlightRange(activeEditor, range);
    } else {
      unhighlightAll();
    }
  }

  vscode.window.onDidChangeTextEditorSelection((event) => {
    const range = findBrackets(event.textEditor, event.textEditor.document);
    if (range) {
      highlightRange(event.textEditor, range);
    } else {
      unhighlightAll();
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}

function findBottom(
  editor: vscode.TextEditor,
  document: vscode.TextDocument,
  stack: {
    char: string;
    pos: vscode.Position;
  }[] = [],
) {
  let lineIndex = stack[0] ? stack[0].pos.line : editor.selection.active.line;

  for (let i = lineIndex; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;
    const textLength = lineText.length;
    let j =
      stack[0] && i === stack[0].pos.line ? stack[0].pos.character + 1 : 0;
    for (; j < textLength; j++) {
      const char = lineText[j];

      if (openingBrackets.includes(char)) {
        stack.push({
          char,
          pos: new vscode.Position(i, j),
        });
      } else if (closingBrackets.includes(char)) {
        const last = stack.pop();
        if (!last) {
          return;
        }

        if (closingBracketsMap[last.char] === char && stack.length === 0) {
          return new vscode.Range(last.pos, new vscode.Position(i, j));
        }
      }
    }
  }
}

function findTop(editor: vscode.TextEditor, document: vscode.TextDocument) {
  const stack: {
    char: string;
    pos: vscode.Position;
  }[] = [];

  let lineIndex = editor.selection.active.line;

  for (let i = lineIndex; i >= 0; i--) {
    const line = document.lineAt(i);
    const lineText = line.text;
    const textLength = lineText.length;

    for (let j = textLength - 1; j >= 0; j--) {
      const char = lineText[j];

      if (closingBrackets.includes(char)) {
        stack.push({
          char,
          pos: new vscode.Position(i, j),
        });
      } else if (openingBrackets.includes(char)) {
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

function findBrackets(
  editor: vscode.TextEditor,
  document: vscode.TextDocument,
) {
  const top = findTop(editor, document);
  if (!top) {
    return undefined;
  }
  const bottom = findBottom(editor, document, [top]);

  if (!top || !bottom) {
    return;
  }

  return new vscode.Range(top.pos, bottom.end);
}

function highlightRange(editor: vscode.TextEditor, range: vscode.Range) {
  if (highlightDecoration) {
    highlightDecoration.dispose();
  }
  if (currentDecoration) {
    currentDecoration.dispose();
  }
  // Hard BG color
  let config = vscode.workspace.getConfiguration('blockHighlighter');
  let wholeLine: boolean = config.get('isWholeLine', true);
  let accentCurrent: boolean = config.get('accentCurrentLine', true);
  let preferThemeColor: boolean = config.get('preferThemeColor', true);
  let background: number[] | string = config.get(
    'background',
    [10, 253, 255, 0.05],
  );
  const highlightColor = new vscode.ThemeColor('blockHighlighter.highlight');

  let backgroundColor =
    typeof background === 'string'
      ? background
      : `rgba(${background.join(',')})`;

  highlightDecoration = vscode.window.createTextEditorDecorationType(<
    vscode.DecorationRenderOptions
  >{
    backgroundColor: preferThemeColor ? highlightColor : backgroundColor,
    isWholeLine: wholeLine,
  });
  currentDecoration = vscode.window.createTextEditorDecorationType(<
    vscode.DecorationRenderOptions
  >{
    backgroundColor: preferThemeColor ? highlightColor : backgroundColor,
    isWholeLine: wholeLine,
  });

  editor.setDecorations(highlightDecoration, [range]);
  if (accentCurrent) {
    editor.setDecorations(currentDecoration, [editor.selection]);
  }
  //console.log("Highlighting called on " + rgbaStr);
}

function unhighlightAll() {
  if (highlightDecoration) {
    highlightDecoration.dispose();
  }
  if (currentDecoration) {
    currentDecoration.dispose();
  }
}
