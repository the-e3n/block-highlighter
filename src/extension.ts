'use strict';
import { parse } from '@babel/parser';
import traverse, { Node } from '@babel/traverse';
import { createHash } from 'node:crypto';
import * as vscode from 'vscode';
import { PostHog } from 'posthog-node';

const client = new PostHog('phc_Mmmiz2odVAfinNCFNZoOvoQG9tUq5laDeIaFLx2utJi', {
  host: 'https://us.i.posthog.com',
  flushAt: 1,
  flushInterval: 1000,
  disableGeoip: false,
});

const logger = vscode.env.createTelemetryLogger({
  async sendEventData(eventName, data) {
    await trackEvent(eventName, data);
  },
  async sendErrorData(error, data) {
    await trackEvent('error', { error, data });
  },
  async flush() {
    await client.flush();
  },
});

/**
 * This variable is used to store the decoration type for the highlighted block
 */
let highlightDecoration: vscode.TextEditorDecorationType;
/**
 * This variable is used to store the decoration type for the current line
 * It allows us to accentuate the current line
 */
let currentDecoration: vscode.TextEditorDecorationType;
/**
 * These variables are used to store the opening and closing brackets
 */
let openingBrackets: string[];
/**
 * This variable is used to store the closing brackets map
 */
let closingBracketsMap: Record<string, string>;
/**
 * This variable is used to store the closing brackets
 */
let closingBrackets: string[];
/**
 * This variable is used to check if the current file is a React file or not
 */
let isReact: boolean = false;

/**
 * This variable is used to store string elements
 */
let stringElements: string[] = ['"', "'", '`'];

/**
 * This variable is used to store the JSX nodes
 */
let JSXNodes: Node[] = [];

/**
 * Activates the extension.
 *
 * @param context - The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
  context.globalState.setKeysForSync(['shownRatingMessage']);
  /**
   * Configuration object for the 'blockHighlighter' settings.
   */
  let config = vscode.workspace.getConfiguration('blockHighlighter');

  const shownRatingMessage = context.globalState.get(
    'shownRatingMessage',
    false,
  );

  if (!shownRatingMessage) {
    const rate = await vscode.window.showInformationMessage(
      'Welcome to Block Highlighter! 🎉',
      'Rate us on the VS Code Marketplace',
    );
    if (rate) {
      vscode.env.openExternal(
        vscode.Uri.parse(
          'https://marketplace.visualstudio.com/items?itemName=the-e3n.block-highlighter&ssr=false#review-details',
        ),
      );
    }
    context.globalState.update('shownRatingMessage', true);
  }

  if (vscode.env.isNewAppInstall) {
    logger.logUsage('new-install', {
      config,
    });
  }

  logger.logUsage('activated', {
    version: vscode.version,
    platform: process.platform,
    config,
  });
  // log to output channel

  /**
   * List of language IDs to omit from highlighting.
   */
  let omit: string[] = config.get('omit', ['markdown', 'plaintext']);

  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) return;
  if (
    activeEditor?.document.languageId &&
    omit &&
    omit.includes(activeEditor.document.languageId)
  ) {
    return;
  }
  if (
    ['javascriptreact', 'typescriptreact'].includes(
      activeEditor.document.languageId,
    )
  ) {
    isReact = true; // Flag to indicate if the document is a React file.
  }

  /**
   * List of opening brackets to highlight.
   */
  const configOpeningBrackets = config.get('openingBrackets', ['{', '[', '(']);

  /**
   * List of string elements to ignore.
   */
  const stringLiterals = config.get('stringLiterals', ['"', "'", '`']);

  /**
   * Map of opening brackets to their corresponding closing brackets.
   */
  const configClosingBrackets = config.get('closingBrackets', {
    '{': '}',
    '[': ']',
    '(': ')',
  });

  // Set global variables
  openingBrackets = configOpeningBrackets;
  closingBracketsMap = configClosingBrackets;
  closingBrackets = Object.values(configClosingBrackets);
  stringElements = stringLiterals;

  if (activeEditor) {
    const range = findBrackets(activeEditor, activeEditor.document);
    if (range) {
      highlightRange(activeEditor, range);
    } else {
      unhighlightAll();
    }
  }

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const range = findBrackets(event.textEditor, event.textEditor.document);
      if (range) {
        highlightRange(event.textEditor, range);
      } else {
        unhighlightAll();
      }
      isReact = ['javascriptreact', 'typescriptreact'].includes(
        event.textEditor.document.languageId,
      );
      if (
        event.textEditor.document.languageId &&
        omit &&
        omit.includes(event.textEditor.document.languageId)
      ) {
        unhighlightAll();
        return;
      }
    }),
    logger,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('blockHighlighter')) {
        config = vscode.workspace.getConfiguration('blockHighlighter');
        omit = config.get('omit', ['markdown', 'plaintext']);
        openingBrackets = config.get('openingBrackets', ['{', '[', '(']);
        closingBracketsMap = config.get('closingBrackets', {
          '{': '}',
          '[': ']',
          '(': ')',
        });
        closingBrackets = Object.values(closingBracketsMap);
        stringElements = config.get('stringLiterals', ['"', "'", '`']);
        logger.logUsage('configuration-changed', {
          config,
        });
      }
    }),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

function findBrackets(
  editor: vscode.TextEditor,
  document: vscode.TextDocument,
) {
  const start = performance.now();
  const ranges = isReact ? findJSXBlock(editor, document) : [];

  const top = findTop(editor, document);
  if (!top) {
    return undefined;
  }
  const bottom = findBottom(editor, document, [top]);

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

function findBottom(
  editor: vscode.TextEditor,
  document: vscode.TextDocument,
  stack: {
    char: string;
    pos: vscode.Position;
  }[] = [],
) {
  let lineIndex = stack[0] ? stack[0].pos.line : editor.selection.active.line;

  const stringStack: string[] = [];

  for (let i = lineIndex; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;
    const textLength = lineText.length;
    let j =
      stack[0] && i === stack[0].pos.line ? stack[0].pos.character + 1 : 0;
    for (; j < textLength; j++) {
      const char = lineText[j];
      if (stringElements.includes(char)) {
        const last = stringStack[stringStack.length - 1];
        if (last === char) {
          stringStack.pop();
        } else if (last !== char) {
          stringStack.push(char);
        }
      }
      if (stringStack.length > 0) continue;

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
  const stringStack: string[] = [];

  for (let i = lineIndex; i >= 0; i--) {
    const line = document.lineAt(i);
    const lineText = line.text;
    const textLength = lineText.length;

    for (let j = textLength - 1; j >= 0; j--) {
      const char = lineText[j];

      if (stringElements.includes(char)) {
        const last = stringStack[stringStack.length - 1];
        if (last === char) {
          stringStack.pop();
        } else if (last !== char) {
          stringStack.push(char);
        }
      }
      if (stringStack.length > 0) continue;

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

function findJSXBlock(
  editor: vscode.TextEditor,
  document: vscode.TextDocument,
) {
  try {
    const blocks = parseJSXElementsFromCode(document);
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
let hash = '';
function parseJSXElementsFromCode(document: vscode.TextDocument) {
  const code = document.getText();
  const newHash = hashString(code);
  if (hash === newHash) {
    return JSXNodes;
  }
  hash = newHash;
  JSXNodes = [];

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
      JSXElement(path) {
        JSXNodes.push(path.node);
      },
    });
  } catch (error) {
    logger.logError('error-in-parseJSXElementsFromCode', { error });
    console.debug(`[-] Error in parseJSXElementsFromCode: ${error}`);
  }
  return JSXNodes;
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
  let background: number[] | string = config.get<string | number[]>(
    'background',
    '#97fdff13',
  );

  let backgroundColor =
    typeof background === 'string'
      ? background
      : `rgba(${background.join(',')})`;

  highlightDecoration = vscode.window.createTextEditorDecorationType(<
    vscode.DecorationRenderOptions
  >{
    backgroundColor,
    isWholeLine: wholeLine,
  });
  currentDecoration = vscode.window.createTextEditorDecorationType(<
    vscode.DecorationRenderOptions
  >{
    backgroundColor,
    isWholeLine: wholeLine,
  });

  editor.setDecorations(highlightDecoration, [range]);
  if (accentCurrent) {
    editor.setDecorations(currentDecoration, [editor.selection]);
  }
}

function hashString(inputString: string) {
  return createHash('md5').update(inputString).digest('hex');
}

function unhighlightAll() {
  if (highlightDecoration) {
    highlightDecoration.dispose();
  }
  if (currentDecoration) {
    currentDecoration.dispose();
  }
}

async function trackEvent(event: string, properties?: Record<string, any>) {
  client.capture({
    event,
    properties: properties || {},
    distinctId: vscode.env.machineId,
  });
}
