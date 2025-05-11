import * as vscode from 'vscode';
/**
 * An highlighter based on ident of the file and tab size
 */
export class IndentHighlighter {
  lineTable = new Map();
  TAB_SIZE = 4;
  subscriptions: vscode.Disposable[] = [];
  private disposable: vscode.Disposable;

  constructor() {
    vscode.window.onDidChangeActiveTextEditor(
      this.changeActive,
      this,
      this.subscriptions,
    );
    this.disposable = vscode.Disposable.from(...this.subscriptions);
  }

  public getRange(editor: vscode.TextEditor) {
    let topLine = this.findTop(editor);
    let botLine = this.findBot(editor, topLine);
    let HLRange: vscode.Range;
    // Handle Significant Whitespace
    botLine = this.pruneTrailingWhitespace(editor, botLine);

    // If top level statement that doesn't start a block the entire file is in it's context
    // if(editor.document.lineAt(editor.selection.active).firstNonWhitespaceCharacterIndex === 0
    if (
      this.getIndentLevel(
        editor,
        editor.document.lineAt(editor.selection.active),
      ) === 0 &&
      !editor.document.lineAt(editor.selection.active).isEmptyOrWhitespace
    ) {
      // Do nothing for now
      return null;
    } else {
      HLRange = new vscode.Range(
        topLine.lineNumber + 1,
        0,
        botLine.lineNumber - 1,
        Number.MAX_VALUE,
      );
      return HLRange;
    }
  }

  findTop(editor: vscode.TextEditor) {
    let line: vscode.TextLine = editor.document.lineAt(editor.selection.active);
    //If whitespace selected process closest non whitespace above it
    while (line.isEmptyOrWhitespace && line.lineNumber > 0) {
      line = editor.document.lineAt(line.lineNumber - 1);
    }
    if (
      line.lineNumber < editor.document.lineCount - 1 &&
      !line.isEmptyOrWhitespace
    ) {
      let nextLine = editor.document.lineAt(line.lineNumber + 1);
      // Find first non whitespace line
      while (
        nextLine.isEmptyOrWhitespace &&
        nextLine.lineNumber < editor.document.lineCount - 1
      ) {
        nextLine = editor.document.lineAt(nextLine.lineNumber + 1);
      }
    }
    let indentLevel = NaN;
    while (line.lineNumber > 0) {
      if (!line.isEmptyOrWhitespace) {
        let nextLevel = this.getIndentLevel(editor, line);
        if (Number.isNaN(indentLevel)) {
          indentLevel = nextLevel;
        }
        if (nextLevel === 0) {
          return line;
        }
        if (nextLevel < indentLevel) {
          return line;
        }
      }
      line = editor.document.lineAt(line.lineNumber - 1);
    }
    return line;
  }

  findBot(editor: vscode.TextEditor, topLine: vscode.TextLine) {
    let line: vscode.TextLine = editor.document.lineAt(topLine.lineNumber + 1);
    let baseLevel = this.getIndentLevel(
      editor,
      editor.document.lineAt(editor.selection.active),
    );
    while (line.lineNumber < editor.document.lineCount - 1) {
      if (!line.isEmptyOrWhitespace) {
        let nextLevel = this.getIndentLevel(editor, line);
        if (nextLevel < baseLevel || nextLevel === 0) {
          //if(nextLevel <= this.getIndentLevel(editor, topLine)){
          return line;
        }
      }
      line = editor.document.lineAt(line.lineNumber + 1);
    }
    return line;
  }

  /**
   * Parses a line to get the indentation level manually
   * Assumes line is already non-whitespace
   * @param line Line to parse
   * @returns Number of space-equivalents in the line
   */
  getIndentLevel(editor: vscode.TextEditor, line: vscode.TextLine) {
    let indentLevel = line.firstNonWhitespaceCharacterIndex;
    let lineText = line.text;
    for (var i = 0; i < indentLevel; i++) {
      if (lineText.charAt(i) === '\t') {
        indentLevel += this.TAB_SIZE - 1;
      }
    }
    this.lineTable.set(line, indentLevel);
    return indentLevel;
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
    this.TAB_SIZE = tabs;
    console.log('Tab size of current document: ' + this.TAB_SIZE);
  }

  changeActive() {
    console.log('Active Window Changed');
    this.setCurrentDocumentTabSize();
  }

  dispose() {
    this.disposable.dispose();
  }
}
