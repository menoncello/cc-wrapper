import type { OnboardingData, Workspace } from '@cc-wrapper/shared-types';

import prisma from '../lib/prisma.js';

export class WorkspaceService {
  /**
   * Create default workspace based on onboarding data
   */
  async createDefaultWorkspace(userId: string, data: OnboardingData): Promise<Workspace> {
    // Create workspace with template configuration
    const workspace = await prisma.workspace.create({
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
    });

    return workspace as Workspace;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    return workspace as Workspace | null;
  }

  /**
   * Get user workspaces
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    return workspaces as Workspace[];
  }
}
