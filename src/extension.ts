import * as vscode from 'vscode'
import { registerDevelopConfigCommands } from './developConfigCommands'
import { registerMetadataFileCommands } from './metadataFileCommands'

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    ...registerMetadataFileCommands(context),
    ...registerDevelopConfigCommands(context),
  )
}

export function deactivate(): void {}
