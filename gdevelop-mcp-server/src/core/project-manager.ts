import { randomUUID } from 'crypto';
import * as path from 'path';
import { GDCoreManager } from './gdcore-manager.js';
import { ProjectSession } from './project-session.js';
import { createLogger } from '../logger.js';

const logger = createLogger('project-manager');

export interface SessionSummary {
  sessionId: string;
  projectPath: string;
  projectName: string;
  isDirty: boolean;
  createdAt: Date;
  lastModifiedAt: Date;
}

/**
 * Manages multiple project sessions.
 * Provides session lifecycle management and lookup.
 */
export class ProjectManager {
  private sessions: Map<string, ProjectSession> = new Map();

  constructor(private gdcoreManager: GDCoreManager) {
    logger.info('ProjectManager initialized');
  }

  /**
   * Open a project and create a new session.
   * @param projectPath Absolute path to the project file.
   * @param sessionId Optional custom session ID.
   * @returns The new project session.
   */
  async openProject(
    projectPath: string,
    sessionId?: string
  ): Promise<ProjectSession> {
    const id = sessionId || randomUUID();

    if (this.sessions.has(id)) {
      throw new Error(`Session "${id}" already exists`);
    }

    // Resolve to absolute path
    const absolutePath = path.resolve(projectPath);

    logger.info({ sessionId: id, projectPath: absolutePath }, 'Opening project');

    const project = await this.gdcoreManager.loadProject(absolutePath);
    const session = new ProjectSession(id, project, absolutePath, this.gdcoreManager);

    this.sessions.set(id, session);

    logger.info(
      { sessionId: id, projectName: project.getName() },
      'Project opened successfully'
    );

    return session;
  }

  /**
   * Create a new empty project.
   * @param projectPath Path where the project will be saved.
   * @param name Project name.
   * @param sessionId Optional custom session ID.
   * @returns The new project session.
   */
  async createProject(
    projectPath: string,
    name: string,
    sessionId?: string
  ): Promise<ProjectSession> {
    const id = sessionId || randomUUID();

    if (this.sessions.has(id)) {
      throw new Error(`Session "${id}" already exists`);
    }

    const absolutePath = path.resolve(projectPath);

    logger.info({ sessionId: id, projectPath: absolutePath, name }, 'Creating new project');

    const project = this.gdcoreManager.createProject();
    project.setName(name);

    const session = new ProjectSession(id, project, absolutePath, this.gdcoreManager);
    session.markDirty(); // New project needs to be saved

    this.sessions.set(id, session);

    logger.info({ sessionId: id, name }, 'Project created successfully');

    return session;
  }

  /**
   * Get an existing session by ID.
   * @throws Error if session not found.
   */
  getSession(sessionId: string): ProjectSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }
    return session;
  }

  /**
   * Check if a session exists.
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Close a session.
   * @param sessionId The session to close.
   * @param save Whether to save before closing.
   * @returns True if the session was closed, false if not found.
   */
  async closeSession(sessionId: string, save: boolean = false): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    logger.info({ sessionId, save }, 'Closing session');

    if (save && session.isDirty()) {
      await session.save();
    }

    session.dispose();
    this.sessions.delete(sessionId);

    logger.info({ sessionId }, 'Session closed');

    return true;
  }

  /**
   * List all active sessions.
   */
  listSessions(): SessionSummary[] {
    const summaries: SessionSummary[] = [];

    for (const session of this.sessions.values()) {
      summaries.push({
        sessionId: session.id,
        projectPath: session.getProjectPath(),
        projectName: session.getProject().getName(),
        isDirty: session.isDirty(),
        createdAt: session.getCreatedAt(),
        lastModifiedAt: session.getLastModifiedAt(),
      });
    }

    return summaries;
  }

  /**
   * Get the number of active sessions.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Close all sessions.
   * @param save Whether to save dirty sessions before closing.
   */
  async closeAllSessions(save: boolean = false): Promise<void> {
    logger.info({ count: this.sessions.size, save }, 'Closing all sessions');

    for (const sessionId of this.sessions.keys()) {
      await this.closeSession(sessionId, save);
    }

    logger.info('All sessions closed');
  }

  /**
   * Find sessions by project path.
   */
  findSessionsByPath(projectPath: string): ProjectSession[] {
    const absolutePath = path.resolve(projectPath);
    const sessions: ProjectSession[] = [];

    for (const session of this.sessions.values()) {
      if (session.getProjectPath() === absolutePath) {
        sessions.push(session);
      }
    }

    return sessions;
  }
}
