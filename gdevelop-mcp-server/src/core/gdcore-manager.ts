import type { GD, GDTools, GDProject } from '../types/gdcore.js';
import { createLogger } from '../logger.js';

const logger = createLogger('gdcore-manager');

/**
 * Manages the GDevelop Core library lifecycle.
 * Handles initialization, project loading/saving, and cleanup.
 */
export class GDCoreManager {
  private gdtools: GDTools | null = null;
  private initPromise: Promise<void> | null = null;
  private version: string | undefined;

  /**
   * Initialize the GDevelop Core library.
   * @param version Optional GDevelop version to use (e.g., 'v5.0.0-beta105')
   */
  async initialize(version?: string): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.version = version;

    this.initPromise = (async () => {
      logger.info({ version: version || 'latest' }, 'Initializing GDCore');

      try {
        // Dynamic import of gdcore-tools
        const loadGD = (await import('gdcore-tools')).default;
        const gdtools = await loadGD(version);
        this.gdtools = gdtools;

        // Set up event handlers
        gdtools.gd.on('print', (msg: string) => {
          logger.debug({ source: 'GDCore' }, msg);
        });

        gdtools.gd.on('error', (msg: string) => {
          logger.error({ source: 'GDCore' }, msg);
        });

        logger.info('GDCore initialized successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to initialize GDCore');
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Get the GDTools wrapper.
   * @throws Error if GDCore is not initialized.
   */
  getGDTools(): GDTools {
    if (!this.gdtools) {
      throw new Error('GDCore not initialized. Call initialize() first.');
    }
    return this.gdtools;
  }

  /**
   * Get the GD namespace object.
   * @throws Error if GDCore is not initialized.
   */
  get gd(): GD {
    return this.getGDTools().gd;
  }

  /**
   * Check if GDCore is initialized.
   */
  isInitialized(): boolean {
    return this.gdtools !== null;
  }

  /**
   * Get the GDevelop version being used.
   */
  getVersion(): string | undefined {
    return this.version;
  }

  /**
   * Load a project from a file path.
   * @param projectPath Absolute path to the project JSON file.
   */
  async loadProject(projectPath: string): Promise<GDProject> {
    logger.info({ projectPath }, 'Loading project');
    const project = await this.getGDTools().loadProject(projectPath);
    logger.info({ projectPath, name: project.getName() }, 'Project loaded');
    return project;
  }

  /**
   * Save a project to disk.
   * @param project The project to save.
   * @param fileName Optional file name.
   * @param filePath Optional directory path.
   */
  async saveProject(
    project: GDProject,
    fileName?: string,
    filePath?: string
  ): Promise<void> {
    logger.info({ fileName, filePath }, 'Saving project');
    await this.getGDTools().saveProject(project, fileName, filePath);
    logger.info('Project saved');
  }

  /**
   * Get the GDevelop runtime path.
   */
  getRuntimePath(): string {
    return this.getGDTools().getRuntimePath();
  }

  /**
   * Create a new empty project.
   */
  createProject(): GDProject {
    logger.info('Creating new project');
    return new this.gd.Project();
  }
}

// Singleton instance
let instance: GDCoreManager | null = null;

/**
 * Get the singleton GDCoreManager instance.
 */
export function getGDCoreManager(): GDCoreManager {
  if (!instance) {
    instance = new GDCoreManager();
  }
  return instance;
}
