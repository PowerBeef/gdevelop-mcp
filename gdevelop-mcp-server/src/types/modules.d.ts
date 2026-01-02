/**
 * Declaration files for external modules without type definitions.
 */

declare module 'gdcore-tools' {
  import { GDTools } from './gdcore.js';

  function loadGD(version?: string): Promise<GDTools>;
  export = loadGD;
}

declare module 'gdexporter' {
  export interface ExportOptions {
    buildType?: 'html5' | 'electron' | 'cordova' | 'facebook';
  }

  export interface ExportResult {
    success: boolean;
    outputPath?: string;
    error?: string;
  }

  function gdexporter(
    projectPath: string,
    outputDir: string,
    options?: ExportOptions
  ): Promise<ExportResult>;

  export = gdexporter;
}
