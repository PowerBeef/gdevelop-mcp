# Repository Guidelines

## Project Structure & Module Organization
- `Erect Rub.json` is the GDevelop game project file (v5.6.251). Treat it as editor-managed data and modify it only through the GDevelop app.
- `CLAUDE.md` documents editor-driven workflow constraints for assistants.
- `.claude/` contains local assistant configuration (not runtime/game content).
- `gdevelop-mcp-server/` contains the TypeScript MCP server that automates GDevelop:
  - `src/` holds server code (`core/`, `tools/`, `resources/`, `prompts/`, `types/`).
  - `tests/` is organized into `unit/`, `integration/`, and `fixtures/` (currently empty).
  - `build/` and `node_modules/` are generated outputs.
- Assets (images/audio) are referenced by the project JSON. Keep assets alongside the project or in a top-level `assets/` folder if you add one, and avoid renames without updating GDevelop.

## Build, Test, and Development Commands
Run these from `gdevelop-mcp-server/`:
- `npm install` installs dependencies.
- `npm run build` compiles TypeScript to `build/`.
- `npm run dev` runs the TypeScript compiler in watch mode.
- `npm start` launches the server from `build/index.js`.
- `npm test` runs Vitest.
- `npm run test:coverage` runs tests with coverage.
- `npm run lint` / `npm run lint:fix` lint the `src/` tree.

The GDevelop project itself has no CLI build or test commands; run and export through the GDevelop UI.

## Coding Style & Naming Conventions
- TypeScript, ES modules (`type: module`), 2-space indentation, semicolons, and single quotes as used in `src/`.
- Prefer kebab-case filenames (e.g., `gdcore-manager.ts`).
- Place new MCP tools in `src/tools/` and keep related registrations in `src/index.ts`.
- Avoid manual edits to `Erect Rub.json`; use the editor to prevent schema drift.

## Testing Guidelines
- Framework: Vitest.
- Add tests under `tests/unit/` or `tests/integration/` with names like `*.test.ts`.
- Keep shared data in `tests/fixtures/`.

## Commit & Pull Request Guidelines
- Git is initialized but there is no commit history yet. Use a lightweight scope prefix: `game:` for GDevelop changes, `server:` for MCP server work (e.g., `server: add project session timeout`).
- Keep commits small and focused; avoid committing generated `node_modules/` or `build/` unless you intentionally publish compiled output.
- PRs should include a concise summary, the commands run, linked issues if any, and screenshots/GIFs when scenes, assets, or gameplay change.

## Configuration Notes
- Node.js >= 18 is required for the MCP server.
- Optional env vars: `GDCORE_VERSION` and `LOG_LEVEL` (see `gdevelop-mcp-server/README.md`).
