'use strict';
import * as vscode from 'vscode';
import { Config } from './config';
import { BlockHighlighter } from './highlighter';
import { handleRatingMessage, logger } from './utils';

const EXT_ID = 'the-e3n.block-highlighter';
const stateSyncKeys = ['lastShownRatingMessage', 'isNewInstall'];

/**
 * Activates the extension.
 *
 * @param context - The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
  const version = vscode.extensions.getExtension(EXT_ID)?.packageJSON?.version;
  // Set up the global state for syncing
  context.globalState.setKeysForSync(stateSyncKeys);
  // Create a new config object
  const config = new Config(context);

  // Check if the extension is activated for the first time
  if (context.globalState.get('isNewInstall', true)) {
    logger.logUsage('new-install', {
      config,
    });
    context.globalState.update('isNewInstall', false);
  }
  // Log the activation event
  logger.logUsage('activated', {
    version: vscode.version,
    platform: typeof process !== 'undefined' ? process.platform : 'web/unknown',
    config: config.config,
    extVersion: version,
    extId: EXT_ID,
    machineId: vscode.env.machineId,
  });
  console.log(
    JSON.stringify({
      version: vscode.version,
      platform:
        typeof process !== 'undefined' ? process.platform : 'web/unknown',
      config: config.config,
      extVersion: version,
      extId: EXT_ID,
      machineId: vscode.env.machineId,
    }),
  );

  // Create a new BlockHighlighter object
  const highlighter = new BlockHighlighter(config);

  // Register the Event listeners for text selection change
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor) {
        highlighter.highlight();
      }
    }),
  );
  // Check if the rating message should be shown
  handleRatingMessage(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
