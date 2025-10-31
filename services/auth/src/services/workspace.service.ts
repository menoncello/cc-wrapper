import type { OnboardingData, Workspace } from '@cc-wrapper/shared-types';

import { prisma } from '../lib/prisma.js';

/**
 * Workspace service for CC Wrapper
 * Handles workspace creation, retrieval, and user workspace associations
 */
export class WorkspaceService {
  /**
   * Create default workspace based on onboarding data
   * @param {string} userId - Unique user identifier
   * @param {OnboardingData} data - Onboarding data containing workspace configuration
   * @returns {Promise<Workspace>} Created workspace object
   */
  public async createDefaultWorkspace(userId: string, data: OnboardingData): Promise<Workspace> {
    // Create workspace with template configuration
    const workspace: any = await prisma.workspace.create({
      data: {
        name: data.workspaceName,
        description: data.workspaceDescription,
        template: data.workspaceTemplate,
        ownerId: userId,
        config: {
          userType: data.userType,
          preferredAITools: data.preferredAITools
        }
      }
    });

    // Update user profile with default workspace
    await prisma.userProfile.update({
      where: { userId },
      data: {
        defaultWorkspaceId: workspace.id,
        preferredAITools: data.preferredAITools,
        onboardingCompleted: true
      }
    });

    // Update user type
    await prisma.user.update({
      where: { id: userId },
      data: {
        userType: data.userType
      }
    } as any);

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || undefined,
      template: workspace.template || undefined,
      ownerId: workspace.ownerId,
      config: workspace.config as Record<string, unknown> | undefined,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  /**
   * Get workspace by ID
   * @param {string} workspaceId - Unique workspace identifier
   * @returns {Promise<Workspace | null>} Workspace object or null if not found
   */
  public async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || undefined,
      template: workspace.template || undefined,
      ownerId: workspace.ownerId,
      config: workspace.config as Record<string, unknown> | undefined,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  /**
   * Get user workspaces
   * @param {string} userId - Unique user identifier
   * @returns {Promise<Workspace[]>} Array of workspace objects owned by the user
   */
  public async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces: any[] = await prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    return workspaces.map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      template: workspace.template,
      ownerId: workspace.ownerId,
      config: workspace.config,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    }));
  }
}
