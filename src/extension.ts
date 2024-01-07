'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let highlightDecoration: vscode.TextEditorDecorationType;
let currentDecoration: vscode.TextEditorDecorationType;
let omitLanguages: string[];
let startingToken: string;
let endingToken: string;
let lineTerminationToken: string;

var TAB_SIZE = 4;

// Table never gets deallocated, potential leak
var lineTable = new Map(); // Line dict
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  let config = vscode.workspace.getConfiguration('blockHighlighter');
  omitLanguages = config.get('omit', ['plaintext']);
  startingToken = config.get('startingToken', '{');
  endingToken = config.get('endingToken', '}');
  lineTerminationToken = config.get('lineTerminationToken', ';');

  let blockHighlighter = new BlockHL();
  let blockHighlighterController = new BHLController(blockHighlighter);

  blockHighlighter.updateLine();
  context.subscriptions.push(blockHighlighter);
  context.subscriptions.push(blockHighlighterController);
}

// this method is called when your extension is deactivated
export function deactivate() {}

class BlockHL {
  public updateLine() {
    var start = new Date().getTime(); // Timing

    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Omit languages
    if (omitLanguages.indexOf(editor.document.languageId) > -1) {
      return;
    }

    // Handle Single Line
    if (editor.selection.isSingleLine) {
      let topLine = this.findTop(editor);
      let botLine = this.findBot(editor, topLine);
      let HLRange: vscode.Range;

      // Handle Significant Whitespace
      // TODO: Add config setting for this instead of hardcoding in python
      if (editor.document.languageId === 'python') {
        botLine = this.pruneTrailingWhitespace(editor, botLine);
      }

      // If top level statement that doesn't start a block the entire file is in it's context
      // if(editor.document.lineAt(editor.selection.active).firstNonWhitespaceCharacterIndex === 0

      // Do nothing for now
      this.unhighlightAll(editor);
      HLRange = new vscode.Range(
        topLine.lineNumber,
        topLine.text.length - 1,
        botLine.lineNumber,
        Number.MAX_VALUE,
      );
      this.highlightRange(editor, HLRange);
    }
    // Handle Multiple Lines
    // Right now just doesn't highlight anything
    else {
      this.unhighlightAll(editor);
    }

    // Timing
    var end = new Date().getTime();

    //#region [rgba(255, 255, 255, 0.1)] Timing Output
    console.log('Update Time: '.concat(String(end - start)));

    //#endregion
  }

  findTop(editor: vscode.TextEditor) {
    let line: vscode.TextLine = editor.document.lineAt(editor.selection.active);
    let lineIndex = line.lineNumber;
    let enclosedRange = 1;
    if (
      line.text.endsWith(endingToken) ||
      line.text.endsWith(`${endingToken}${lineTerminationToken}`)
    ) {
      lineIndex--;
    }

    while (lineIndex > 0) {
      const currentLine = editor.document.lineAt(lineIndex);
      if (
        currentLine.text.endsWith(`${startingToken}${endingToken}`) ||
        currentLine.text.endsWith(
          `${startingToken}${endingToken}${lineTerminationToken}`,
        )
      ) {
        lineIndex--;
        continue;
      }
      if (
        currentLine.text.endsWith(endingToken) ||
        currentLine.text.endsWith(`${endingToken}${lineTerminationToken}`)
      ) {
        enclosedRange++;
        lineIndex--;
        continue;
      }
      if (currentLine.text.endsWith(startingToken)) {
        enclosedRange--;
      }
      if (enclosedRange === 0) {
        break;
      }
      lineIndex--;
    }

    return editor.document.lineAt(lineIndex);
  }

  findBot(editor: vscode.TextEditor, topLine: vscode.TextLine) {
    let line: vscode.TextLine = editor.document.lineAt(topLine.lineNumber + 1);
    let lineIndex = line.lineNumber;
    let enclosedRange = 1;
    while (lineIndex < editor.document.lineCount - 1) {
      const currentLine = editor.document.lineAt(lineIndex);
      if (
        currentLine.text.endsWith(`${startingToken}${endingToken}`) ||
        currentLine.text.endsWith(
          `${startingToken}${endingToken}${lineTerminationToken}`,
        )
      ) {
        lineIndex++;
        continue;
      }

      if (currentLine.text.endsWith(startingToken)) {
        enclosedRange++;
        lineIndex++;
        continue;
      }
      if (
        currentLine.text.endsWith(endingToken) ||
        currentLine.text.endsWith(`${endingToken}${lineTerminationToken}`)
      ) {
        enclosedRange--;
      }
      if (enclosedRange === 0) {
        break;
      }
      lineIndex++;
    }

    return editor.document.lineAt(lineIndex);
  }

  /**
   * Parses a line to get the indentation level manually
   * Assumes line is already non-whitespace
   * @param line Line to parse
   * @returns Number of space-equivalents in the line
   */
  getIndentLevel(editor: vscode.TextEditor, line: vscode.TextLine) {
    // Delete Cache block?
    //if(lineTable.has(line)){
    //   return lineTable.get(line);
    // }else{
    let indentLevel = line.firstNonWhitespaceCharacterIndex;
    let lineText = line.text;
    for (var i = 0; i < indentLevel; i++) {
      if (lineText.charAt(i) === '\t') {
        indentLevel += TAB_SIZE - 1;
      }
    }
    lineTable.set(line, indentLevel);
    return indentLevel;

    // Cache block end
    // }
  }

  freeCurrentLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    lineTable.delete(editor.document.lineAt(editor.selection.active));
  }

  pruneTrailingWhitespace(editor: vscode.TextEditor, bot: vscode.TextLine) {
    if (editor.document.lineCount < 2) {
      return bot;
    }
    let newBot = editor.document.lineAt(bot.lineNumber - 1);
    while (newBot.isEmptyOrWhitespace) {
      newBot = editor.document.lineAt(newBot.lineNumber - 1);
    }
    // Up 1 for highlighting range clipping
    newBot = editor.document.lineAt(newBot.lineNumber + 1);
    return newBot;
  }

  setCurrentDocumentTabSize() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let tabs: number;
    tabs = editor.options.tabSize as number;
    TAB_SIZE = tabs;
    console.log('Tab size of current document: ' + TAB_SIZE);
  }

  changeActive() {
    console.log('Active Window Changed');
    this.setCurrentDocumentTabSize();
  }

  highlightRange(editor: vscode.TextEditor, range: vscode.Range) {
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
    let background: string[] | string = config.get('background', [
      '10',
      '253',
      '255',
      '.05',
    ]);
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

  unhighlightAll(editor: vscode.TextEditor) {
    if (highlightDecoration) {
      highlightDecoration.dispose();
    }
    if (currentDecoration) {
      currentDecoration.dispose();
    }
  }

  dispose() {}
}

class BHLController {
  private _blockHL: BlockHL;
  private _disposable: vscode.Disposable;

  public constructor(blockHL: BlockHL) {
    this._blockHL = blockHL;

    let subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeActiveTextEditor(
      this._onChangeActive,
      this,
      subscriptions,
    );
    vscode.window.onDidChangeTextEditorSelection(
      this._onLineChange,
      this,
      subscriptions,
    );
    vscode.window.onDidChangeTextEditorOptions(
      this._onChangeOptions,
      this,
      subscriptions,
    );
    vscode.workspace.onDidChangeTextDocument(
      this._onChangeText,
      this,
      subscriptions,
    );

    this._disposable = vscode.Disposable.from(...subscriptions);
  }

  dispose() {
    this._disposable.dispose();
  }

  private _onChangeOptions() {
    this._blockHL.setCurrentDocumentTabSize();
  }

  private _onChangeText() {
    this._blockHL.freeCurrentLine();
  }

  private _onChangeActive() {
    this._blockHL.changeActive();
  }

  private _onLineChange() {
    this._blockHL.updateLine();
  }
}
