'use strict';
import * as vscode from 'vscode';

/**
 * This class is used to store the configuration for the extension.
 * It handles the change of configuration and updates the variables accordingly.
 */
export class Config {
  public config: vscode.WorkspaceConfiguration;

  /**
   * These variables are used to store the opening and closing brackets
   */
  openingBrackets: string[] = ['{', '[', '('];
  /**
   * This variable is used to store the closing brackets map
   */
  closingBracketsMap: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')',
  };

  /**
   * This variable is used to store string elements
   */
  stringElements: string[] = ['"', "'", '`'];

  /**
   * This indexes the start of single line comments
   */
  singleLineCommentStart = ['//', '#'];

  /**
   * This indexes the start of multi line comments
   */
  multiLineCommentStart = ['/*'];

  /**
   * This indexes the end of multi line comments
   */
  multiLineCommentEnd = ['*/'];

  /**
   * List of language IDs to omit from highlighting.
   */
  omit: string[] = ['markdown', 'plaintext'];

  /**
   * This variable is used to store the closing brackets
   */
  closingBrackets = [']', '}', ')'];

  /**
   * Whether to highlight the whole line or just until the last character.
   * If true, the whole line will be highlighted.
   */
  wholeLine: boolean = true;

  /**
   * Whether to highlight the current line. It works independently of the wholeLine property.
   * If true, the current line will be highlighted twice.
   */
  accentCurrent: boolean = true;

  /**
   * Whether to show the border
   */
  showBorder: boolean = false;

  /**
   * This variable is used to store the background color of the highlight.
   * It can be a hex color code or an rgba color code.
   */
  background: number[] | string = '#97fdff13';

  /**
   * Color of the highlight.
   * It can be a hex color code or an rgba color code.
   * It is the parsed value of the background property.
   */
  backgroundColor: string = '#97fdff13';

  /**
   * This variable is used to store the background color of the highlight.
   * It can be a hex color code or an rgba color code.
   */
  border: number[] | string = 'red';

  /**
   * Color of the highlight.
   * It can be a hex color code or an rgba color code.
   * It is the parsed value of the background property.
   */
  borderColor: string = 'red';

  constructor(context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration('blockHighlighter');
    this.setup();
    // Register a configuration change listener
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('blockHighlighter')) {
          this.config = vscode.workspace.getConfiguration('blockHighlighter');
          this.setup();
        }
      }),
    );
  }

  setup() {
    this.openingBrackets = this.config.get('openingBrackets', ['{', '[', '(']);
    this.closingBracketsMap = this.config.get('closingBracketsMap', {
      '{': '}',
      '[': ']',
      '(': ')',
    });
    this.stringElements = this.config.get('stringElements', ['"', "'", '`']);
    this.singleLineCommentStart = this.config.get('singleLineCommentStart', [
      '//',
      '#',
    ]);
    this.multiLineCommentStart = this.config.get('multiLineCommentStart', [
      '/*',
    ]);
    this.multiLineCommentEnd = this.config.get('multiLineCommentEnd', ['*/']);
    this.omit = this.config.get('omit', ['markdown', 'plaintext']);
    this.closingBrackets = Object.values(this.closingBracketsMap);
    this.wholeLine = this.config.get('isWholeLine', true);
    this.accentCurrent = this.config.get('accentCurrentLine', true);
    this.showBorder = this.config.get('showBorder', false);
    this.background = this.config.get<string | number[]>(
      'background',
      '#97fdff13',
    );
    this.backgroundColor =
      typeof this.background === 'string'
        ? this.background
        : `rgba(${this.background.join(',')})`;
    this.border = this.config.get<string | number[]>('border', '#97fdff13');
    this.borderColor =
      typeof this.border === 'string'
        ? this.border
        : `rgba(${this.border.join(',')})`;
  }

  public get(key: string): any {
    return this.config.get(key);
  }
}
