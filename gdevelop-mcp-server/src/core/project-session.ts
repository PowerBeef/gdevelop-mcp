import * as path from 'path';
import * as fs from 'fs/promises';
import type {
  GDProject,
  GDLayout,
  GDObject,
  GDVariable,
  GDObjectsContainer,
  GDVariablesContainer,
  GD,
} from '../types/gdcore.js';
import { GDCoreManager } from './gdcore-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('project-session');

export interface ProjectInfo {
  sessionId: string;
  projectPath: string;
  name: string;
  version: string;
  description: string;
  author: string;
  packageName: string;
  windowWidth: number;
  windowHeight: number;
  maxFPS: number;
  minFPS: number;
  firstLayout: string;
  layoutCount: number;
  globalObjectCount: number;
  globalVariableCount: number;
  externalEventsCount: number;
  externalLayoutsCount: number;
}

/**
 * Represents an active editing session for a GDevelop project.
 * Provides high-level operations for manipulating project contents.
 */
export class ProjectSession {
  private dirty: boolean = false;
  private createdAt: Date = new Date();
  private lastModifiedAt: Date = new Date();

  constructor(
    public readonly id: string,
    private project: GDProject,
    private projectPath: string,
    private gdcoreManager: GDCoreManager
  ) {
    logger.info({ sessionId: id, projectPath }, 'Session created');
  }

  /**
   * Get the GD namespace.
   */
  get gd(): GD {
    return this.gdcoreManager.gd;
  }

  /**
   * Get the underlying GDProject.
   */
  getProject(): GDProject {
    return this.project;
  }

  /**
   * Get the project file path.
   */
  getProjectPath(): string {
    return this.projectPath;
  }

  /**
   * Mark the project as having unsaved changes.
   */
  markDirty(): void {
    this.dirty = true;
    this.lastModifiedAt = new Date();
  }

  /**
   * Check if there are unsaved changes.
   */
  isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Get session creation time.
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Get last modification time.
   */
  getLastModifiedAt(): Date {
    return this.lastModifiedAt;
  }

  // ========== Project Info ==========

  /**
   * Get comprehensive project information.
   */
  getInfo(): ProjectInfo {
    return {
      sessionId: this.id,
      projectPath: this.projectPath,
      name: this.project.getName(),
      version: this.project.getVersion(),
      description: this.project.getDescription(),
      author: this.project.getAuthor(),
      packageName: this.project.getPackageName(),
      windowWidth: this.project.getMainWindowDefaultWidth(),
      windowHeight: this.project.getMainWindowDefaultHeight(),
      maxFPS: this.project.getMaximumFPS(),
      minFPS: this.project.getMinimumFPS(),
      firstLayout: this.project.getFirstLayout(),
      layoutCount: this.project.getLayoutsCount(),
      globalObjectCount: this.project.getObjectsCount(),
      globalVariableCount: this.project.getVariables().count(),
      externalEventsCount: this.project.getExternalEventsCount(),
      externalLayoutsCount: this.project.getExternalLayoutsCount(),
    };
  }

  // ========== Save/Backup ==========

  /**
   * Save the project to disk.
   * @param savePath Optional new save location.
   * @returns The path where the project was saved.
   */
  async save(savePath?: string): Promise<string> {
    const targetPath = savePath || this.projectPath;
    const dir = path.dirname(targetPath);
    const filename = path.basename(targetPath);

    logger.info({ targetPath }, 'Saving project');
    await this.gdcoreManager.saveProject(this.project, filename, dir);

    this.dirty = false;
    if (savePath) {
      this.projectPath = savePath;
    }

    return targetPath;
  }

  /**
   * Create a backup of the current project file.
   * @returns The backup file path.
   */
  async createBackup(): Promise<string> {
    const timestamp = Date.now();
    const ext = path.extname(this.projectPath);
    const base = path.basename(this.projectPath, ext);
    const dir = path.dirname(this.projectPath);
    const backupPath = path.join(dir, `${base}.backup-${timestamp}${ext}`);

    await fs.copyFile(this.projectPath, backupPath);
    logger.info({ backupPath }, 'Backup created');

    return backupPath;
  }

  // ========== Layout (Scene) Operations ==========

  /**
   * Get the number of layouts.
   */
  getLayoutCount(): number {
    return this.project.getLayoutsCount();
  }

  /**
   * Check if a layout exists.
   */
  hasLayout(name: string): boolean {
    return this.project.hasLayoutNamed(name);
  }

  /**
   * Get a layout by name.
   */
  getLayout(name: string): GDLayout {
    if (!this.hasLayout(name)) {
      throw new Error(`Layout "${name}" not found`);
    }
    return this.project.getLayout(name);
  }

  /**
   * Get a layout by index.
   */
  getLayoutAt(index: number): GDLayout {
    if (index < 0 || index >= this.getLayoutCount()) {
      throw new Error(`Layout index ${index} out of bounds`);
    }
    return this.project.getLayoutAt(index);
  }

  /**
   * Create a new layout.
   */
  createLayout(name: string, position?: number): GDLayout {
    if (this.hasLayout(name)) {
      throw new Error(`Layout "${name}" already exists`);
    }

    const pos = position ?? this.getLayoutCount();
    const layout = this.project.insertNewLayout(name, pos);
    this.markDirty();

    logger.info({ name, position: pos }, 'Layout created');
    return layout;
  }

  /**
   * Delete a layout.
   */
  deleteLayout(name: string): void {
    if (!this.hasLayout(name)) {
      throw new Error(`Layout "${name}" not found`);
    }

    this.project.removeLayout(name);
    this.markDirty();

    logger.info({ name }, 'Layout deleted');
  }

  /**
   * Rename a layout.
   */
  renameLayout(currentName: string, newName: string): void {
    if (!this.hasLayout(currentName)) {
      throw new Error(`Layout "${currentName}" not found`);
    }
    if (this.hasLayout(newName)) {
      throw new Error(`Layout "${newName}" already exists`);
    }

    const layout = this.getLayout(currentName);
    layout.setName(newName);

    // Update firstLayout if needed
    if (this.project.getFirstLayout() === currentName) {
      this.project.setFirstLayout(newName);
    }

    this.markDirty();
    logger.info({ currentName, newName }, 'Layout renamed');
  }

  /**
   * Get the position of a layout.
   */
  getLayoutPosition(name: string): number {
    return this.project.getLayoutPosition(name);
  }

  /**
   * Move a layout to a new position.
   */
  moveLayout(name: string, newPosition: number): void {
    const oldPosition = this.getLayoutPosition(name);
    if (oldPosition === -1) {
      throw new Error(`Layout "${name}" not found`);
    }

    this.project.moveLayout(oldPosition, newPosition);
    this.markDirty();

    logger.info({ name, oldPosition, newPosition }, 'Layout moved');
  }

  // ========== Global Object Operations ==========

  /**
   * Get the global objects container.
   */
  getGlobalObjects(): GDObjectsContainer {
    return this.project.getObjects();
  }

  /**
   * Check if a global object exists.
   */
  hasGlobalObject(name: string): boolean {
    return this.project.hasObjectNamed(name);
  }

  /**
   * Get a global object.
   */
  getGlobalObject(name: string): GDObject {
    if (!this.hasGlobalObject(name)) {
      throw new Error(`Global object "${name}" not found`);
    }
    return this.project.getObject(name);
  }

  /**
   * Create a new global object.
   */
  createGlobalObject(name: string, type: string): GDObject {
    if (this.hasGlobalObject(name)) {
      throw new Error(`Global object "${name}" already exists`);
    }

    const object = this.project.createObject(type, name);
    this.project.insertObject(object, this.project.getObjectsCount());
    this.markDirty();

    logger.info({ name, type }, 'Global object created');
    return object;
  }

  /**
   * Delete a global object.
   */
  deleteGlobalObject(name: string): void {
    if (!this.hasGlobalObject(name)) {
      throw new Error(`Global object "${name}" not found`);
    }

    this.project.removeObject(name);
    this.markDirty();

    logger.info({ name }, 'Global object deleted');
  }

  // ========== Global Variable Operations ==========

  /**
   * Get the global variables container.
   */
  getGlobalVariables(): GDVariablesContainer {
    return this.project.getVariables();
  }

  /**
   * Check if a global variable exists.
   */
  hasGlobalVariable(name: string): boolean {
    return this.getGlobalVariables().has(name);
  }

  /**
   * Get a global variable.
   */
  getGlobalVariable(name: string): GDVariable {
    const vars = this.getGlobalVariables();
    if (!vars.has(name)) {
      throw new Error(`Global variable "${name}" not found`);
    }
    return vars.get(name);
  }

  /**
   * Create a new global variable.
   */
  createGlobalVariable(name: string, value?: number | string | boolean): GDVariable {
    const vars = this.getGlobalVariables();
    if (vars.has(name)) {
      throw new Error(`Global variable "${name}" already exists`);
    }

    const variable = vars.insertNew(name, vars.count());

    if (value !== undefined) {
      if (typeof value === 'number') {
        variable.setValue(value);
      } else if (typeof value === 'string') {
        variable.setString(value);
      } else if (typeof value === 'boolean') {
        variable.setBool(value);
      }
    }

    this.markDirty();
    logger.info({ name }, 'Global variable created');

    return variable;
  }

  /**
   * Delete a global variable.
   */
  deleteGlobalVariable(name: string): void {
    const vars = this.getGlobalVariables();
    if (!vars.has(name)) {
      throw new Error(`Global variable "${name}" not found`);
    }

    vars.remove(name);
    this.markDirty();

    logger.info({ name }, 'Global variable deleted');
  }

  // ========== Serialization ==========

  /**
   * Serialize the project to JSON.
   */
  serialize(): object {
    const serializer = new this.gd.SerializerElement();
    this.project.serializeTo(serializer);
    const json = this.gd.Serializer.toJSON(serializer);
    serializer.delete();
    return JSON.parse(json);
  }

  // ========== Cleanup ==========

  /**
   * Dispose of the session and release resources.
   */
  dispose(): void {
    logger.info({ sessionId: this.id }, 'Disposing session');
    if (this.project) {
      this.project.delete();
    }
  }
}
