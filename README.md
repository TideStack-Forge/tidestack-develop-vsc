# TideStack Develop for VS Code

TideStack Develop adds visual editing support for TideStack JSON metadata files in Visual Studio Code. It also provides a shared project configuration entry for binding a workspace to a TideStack development platform.

Extension identifier: `tidestack.develop`.

## Highlights

- Visual editors for TideStack JSON metadata files.
- AMIS-based UI Schema visual editor.
- Schema-driven forms for authority, menu, app module, configuration, and related metadata types.
- Support for both the new `src/main/metadata` convention and the legacy `resources/META-INF/ouroboros` convention.
- Built-in new-file templates for all supported metadata types.
- Workspace-level TideStack Develop Config commands.
- Source editor / visual editor switching from the editor title actions.

## Supported Metadata Files

The extension registers one custom editor per metadata type. Files can be opened automatically through VS Code's custom editor matching or manually with `Open With...`.

| Metadata type | New file convention | Legacy path support |
|---|---|---|
| Authority | `.authority.json` | `resources/META-INF/ouroboros/authority/**/*.json` |
| Menu | `.menu.json` | `resources/META-INF/ouroboros/menu-model/**/*.json` |
| Development menu | `.dev-menu.json` | `resources/META-INF/ouroboros/dev-menu-model/**/*.json` |
| UI model | `.ui-model.json` | `resources/META-INF/ouroboros/ui-model/**/*.json` |
| UI Schema | `.ui-schema.json` | `resources/META-INF/ouroboros/ui-schema/**/*.json` |
| App module | `src/main/metadata/app-modules.json` | `resources/META-INF/ouroboros/app-modules.json` |
| Configuration | `src/main/metadata/configuration.json` | `resources/META-INF/ouroboros/configuration.json` |
| Configuration group | `src/main/metadata/configuration-groups.json` | `resources/META-INF/ouroboros/configuration-groups.json` |

## Commands

Open the Command Palette and use:

- `TideStack Develop Config: Configure Project`: creates or updates project binding files.
- `TideStack Develop Config: Open Config Files`: opens the shared and local config files.
- `TideStack Metadata: New File`: creates a new `src/main/metadata` JSON file from a built-in template.
- `Visual Editor`: opens a supported JSON file with its metadata custom editor.
- `Source Editor`: switches back to the normal JSON text editor.

The VS Code `New File...` picker and Explorer folder context menu expose a `创建 TideStack Metadata` submenu with each concrete metadata type, such as `菜单模型...` and `UI Schema...`. When invoked from an Explorer folder, suffix-based metadata files use the selected folder as the default target path. Template creation prompts for the file path first, then the model fields declared by the shared metadata contribution, such as `name`, `title`, and `description`.

## TideStack Develop Config

The extension stores configuration in two workspace files:

- `.tidestack/develop.json`: shared project configuration, intended to be committed. It stores `developmentServerUrl` and `appName`.
- `.tidestack/develop.local.json`: local private configuration, intended to stay uncommitted. It stores `devKey` only.

`profileId` and `containerId` are not manual settings. Future development and debugging features should resolve them from the platform through `devKey` and `appName`.

## Editing Behavior

- Visual editors update the opened VS Code document, then VS Code handles the normal dirty/save lifecycle.
- The source JSON editor remains available for every metadata file.
- The UI Schema editor uses the shared AMIS editor runtime, keeps generated unused component IDs out of saved JSON where possible, and exposes collapsible wrapper fields for the new `{ name, title, description, schema }` format above the canvas.

## Requirements

- VS Code 1.90.0 or later.
- A workspace containing TideStack metadata files.
- Optional: a TideStack development platform for TideStack Develop Config values.

## Privacy And Data Storage

- The extension reads and writes files only inside the opened workspace.
- Shared platform binding data is written to `.tidestack/develop.json`.
- The local `devKey` is written only to `.tidestack/develop.local.json`.
- No `profileId` or `containerId` is stored by the extension.
- The current VS Code release does not perform deploy/debug network calls.

## Known Limitations

- The first release supports JSON metadata files only.
- Deploy and remote debug workflows are not implemented in the VS Code extension yet.
- The UI Schema editor currently uses a fixed light AMIS editor theme for better editor compatibility.
