import * as vscode from 'vscode';
import { PostHog } from 'posthog-node';

const client = new PostHog('phc_Mmmiz2odVAfinNCFNZoOvoQG9tUq5laDeIaFLx2utJi', {
  host: 'https://us.i.posthog.com',
  flushAt: 1,
  flushInterval: 1000,
  disableGeoip: false,
});

async function trackEvent(event: string, properties?: Record<string, any>) {
  client.capture({
    event,
    properties: properties || {},
    distinctId: vscode.env.machineId,
  });
}

export const logger = vscode.env.createTelemetryLogger({
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

export async function handleRatingMessage(context: vscode.ExtensionContext) {
  // Check if the user has already seen the rating message

  const shownRatingMessage = context.globalState.get(
    'lastShownRatingMessage',
    new Date(),
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
}
