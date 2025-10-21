# Tech Spec - Epic 3: Project Management & Advanced Collaboration

**Epic:** Project Management & Advanced Collaboration **Stories:** 8-10
**Timeline:** 4-6 weeks **Priority:** High (Team collaboration and scalability)

## Epic Overview

This epic implements advanced project management and team collaboration features
that enable organizations to effectively use CC Wrapper across multiple projects
and teams. The implementation focuses on container-per-project isolation, team
workflows, and scalable collaboration patterns while maintaining the simplicity
that individual developers value.

**Key Innovation:** Intelligent project isolation with container-per-project
security combined with seamless team collaboration that doesn't compromise
individual productivity.

## User Stories

### Story 3.1: Container-per-Project Isolation

**As a** developer **I want to** have each project run in its own isolated
container **So that** projects cannot interfere with each other and data remains
secure

### Story 3.2: Project-Specific AI Configurations

**As a** developer **I want to** configure different AI tools and settings per
project **So that** each project can use the most appropriate AI assistant for
its needs

### Story 3.3: Team Workspace Sharing

**As a** team lead **I want to** share workspaces with team members with
specific permissions **So that** we can collaborate effectively on projects

### Story 3.4: Project Templates

**As a** team lead **I want to** create project templates with pre-configured AI
tools and settings **So that** new projects can be set up quickly and
consistently

### Story 3.5: Advanced Workspace Management

**As a** developer **I want to** organize multiple workspaces with tags and
custom metadata **So that** I can efficiently manage complex project portfolios

### Story 3.6: Project-Specific Context Management

**As a** developer **I want to** maintain separate AI conversation history and
context per project **So that** AI responses remain relevant to the current
project context

### Story 3.7: Team Activity Monitoring

**As a** team lead **I want to** view team activity and productivity metrics
across projects **So that** I can understand team performance and identify
bottlenecks

### Story 3.8: Resource Quotas and Limits

**As an** administrator **I want to** set resource quotas and usage limits per
project and team **So that** I can manage costs and prevent resource abuse

### Story 3.9: Project Backup and Recovery

**As a** developer **I want to** automatically backup project configurations and
restore them when needed **So that** I don't lose work due to accidental
deletions or system failures

### Story 3.10: Cross-Project Search

**As a** developer **I want to** search across all my projects and workspaces
**So that** I can quickly find information and resources regardless of project
boundaries

## Technical Architecture

### Container Management Service

#### Project Isolation System

```typescript
interface ContainerManagementService {
  // Container Lifecycle
  createProjectContainer(
    projectId: string,
    config: ContainerConfig
  ): Promise<Container>;
  startContainer(containerId: string): Promise<void>;
  stopContainer(containerId: string): Promise<void>;
  restartContainer(containerId: string): Promise<void>;
  deleteContainer(containerId: string): Promise<void>;

  // Container Management
  getContainerStatus(containerId: string): Promise<ContainerStatus>;
  listContainers(userId: string): Promise<Container[]>;
  updateContainerConfig(
    containerId: string,
    config: ContainerConfig
  ): Promise<void>;

  // Resource Management
  getContainerMetrics(containerId: string): Promise<ContainerMetrics>;
  setResourceLimits(containerId: string, limits: ResourceLimits): Promise<void>;
  enforceResourceQuotas(projectId: string): Promise<void>;

  // Security and Isolation
  enforceNetworkIsolation(containerId: string): Promise<void>;
  configureFileSystemIsolation(containerId: string): Promise<void>;
  validateContainerSecurity(containerId: string): Promise<SecurityValidation>;
}

interface ContainerConfig {
  projectId: string;
  image: string;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
  environment: Record<string, string>;
  network: {
    isolated: boolean;
    allowedPorts: number[];
  };
  security: {
    readOnlyFileSystem: boolean;
    dropCapabilities: string[];
    runAsNonRoot: boolean;
  };
}
```

#### Project Template System

```typescript
interface ProjectTemplateService {
  // Template Management
  createTemplate(template: CreateTemplateRequest): Promise<ProjectTemplate>;
  updateTemplate(
    templateId: string,
    updates: UpdateTemplateRequest
  ): Promise<ProjectTemplate>;
  deleteTemplate(templateId: string): Promise<void>;
  listTemplates(organizationId?: string): Promise<ProjectTemplate[]>;

  // Template Application
  applyTemplate(
    templateId: string,
    projectId: string,
    customizations: TemplateCustomizations
  ): Promise<void>;
  previewTemplate(templateId: string): Promise<TemplatePreview>;
  validateTemplate(templateId: string): Promise<TemplateValidation>;

  // Template Sharing
  shareTemplate(templateId: string, shareOptions: ShareOptions): Promise<void>;
  importTemplate(templateUrl: string): Promise<ProjectTemplate>;
  exportTemplate(templateId: string): Promise<TemplateExport>;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  organizationId?: string;
  isPublic: boolean;
  config: {
    containerConfig: ContainerConfig;
    aiProviders: AIProviderConfig[];
    workspaceLayout: WorkspaceLayout;
    environmentVariables: Record<string, string>;
    scripts: TemplateScript[];
  };
  metadata: {
    tags: string[];
    estimatedSetupTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    requirements: TemplateRequirement[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Enhanced Workspace Service

#### Advanced Workspace Features

```typescript
interface AdvancedWorkspaceService {
  // Workspace Organization
  createWorkspace(
    workspace: CreateAdvancedWorkspaceRequest
  ): Promise<AdvancedWorkspace>;
  updateWorkspaceMetadata(
    workspaceId: string,
    metadata: WorkspaceMetadata
  ): Promise<void>;
  organizeWorkspaces(organization: WorkspaceOrganization): Promise<void>;
  tagWorkspaces(workspaceIds: string[], tags: string[]): Promise<void>;

  // Workspace Sharing and Collaboration
  shareWorkspace(
    workspaceId: string,
    sharingConfig: SharingConfig
  ): Promise<ShareLink>;
  acceptWorkspaceInvite(
    inviteId: string,
    acceptance: InviteAcceptance
  ): Promise<void>;
  updateWorkspacePermissions(
    workspaceId: string,
    userId: string,
    permissions: WorkspacePermission[]
  ): Promise<void>;

  // Workspace Backup and Recovery
  createWorkspaceBackup(
    workspaceId: string,
    config: BackupConfig
  ): Promise<WorkspaceBackup>;
  restoreWorkspaceFromBackup(
    backupId: string,
    targetWorkspaceId?: string
  ): Promise<void>;
  scheduleAutomatedBackups(
    workspaceId: string,
    schedule: BackupSchedule
  ): Promise<void>;

  // Cross-Workspace Features
  searchAcrossWorkspaces(
    userId: string,
    query: SearchQuery
  ): Promise<SearchResult[]>;
  transferWorkspaceOwnership(
    workspaceId: string,
    newOwnerId: string
  ): Promise<void>;
  duplicateWorkspace(
    workspaceId: string,
    customizations: DuplicationCustomizations
  ): Promise<Workspace>;
}

interface AdvancedWorkspace extends Workspace {
  metadata: {
    tags: string[];
    category: string;
    customFields: Record<string, any>;
    projectType: string;
    stack: string[];
  };
  collaboration: {
    sharedWith: SharedUser[];
    shareLinks: ShareLink[];
    permissions: WorkspacePermission[];
  };
  backup: {
    lastBackup?: Date;
    backupSchedule?: BackupSchedule;
    retentionPolicy: RetentionPolicy;
  };
  resources: {
    containerId?: string;
    resourceQuotas: ResourceQuota[];
    usageMetrics: ResourceUsage[];
  };
}
```

### Team Collaboration Service

#### Team Workflow Management

```typescript
interface TeamCollaborationService {
  // Team Project Management
  createTeamProject(
    teamId: string,
    project: CreateTeamProjectRequest
  ): Promise<TeamProject>;
  updateTeamProject(
    projectId: string,
    updates: UpdateTeamProjectRequest
  ): Promise<void>;
  archiveTeamProject(projectId: string): Promise<void>;

  // Team Member Management
  inviteTeamMember(
    teamId: string,
    invitation: TeamInvitation
  ): Promise<TeamInvitation>;
  updateTeamMemberRole(
    teamId: string,
    userId: string,
    role: TeamRole
  ): Promise<void>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;

  // Team Activity Tracking
  getTeamActivity(
    teamId: string,
    timeframe: TimeFrame
  ): Promise<TeamActivity[]>;
  getTeamProductivityMetrics(
    teamId: string,
    timeframe: TimeFrame
  ): Promise<TeamProductivityMetrics>;
  generateTeamReport(
    teamId: string,
    config: TeamReportConfig
  ): Promise<TeamReport>;

  // Team Resource Management
  setTeamResourceQuotas(
    teamId: string,
    quotas: TeamResourceQuotas
  ): Promise<void>;
  getTeamResourceUsage(teamId: string): Promise<TeamResourceUsage>;
  optimizeTeamResourceAllocation(teamId: string): Promise<ResourceOptimization>;
}

interface TeamProject {
  id: string;
  teamId: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'suspended';
  workspaceIds: string[];
  members: TeamProjectMember[];
  settings: {
    defaultAiProviders: string[];
    resourceQuotas: ResourceQuota[];
    collaborationRules: CollaborationRule[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Enhanced Data Models

### Project and Workspace Tables

```sql
-- Advanced Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id),
    owner_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'active', -- active, archived, suspended
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Templates
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    author_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    is_public BOOLEAN DEFAULT false,
    version TEXT DEFAULT '1.0.0',
    template_config JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Containers
CREATE TABLE project_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    container_id TEXT UNIQUE NOT NULL, -- Docker container ID
    image TEXT NOT NULL,
    status TEXT DEFAULT 'stopped', -- running, stopped, error, restarting
    config JSONB NOT NULL,
    resource_limits JSONB DEFAULT '{}',
    network_config JSONB DEFAULT '{}',
    security_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Advanced Workspaces
CREATE TABLE workspace_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    custom_fields JSONB DEFAULT '{}',
    project_type TEXT,
    tech_stack TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspace Sharing
CREATE TABLE workspace_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    shared_by UUID REFERENCES users(id),
    shared_with UUID REFERENCES users(id),
    permissions JSONB DEFAULT '[]',
    share_type TEXT DEFAULT 'direct', -- direct, link, team
    share_token TEXT UNIQUE,
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workspace Backups
CREATE TABLE workspace_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    backup_type TEXT NOT NULL, -- manual, automatic, scheduled
    backup_size BIGINT,
    backup_location TEXT NOT NULL,
    backup_config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'completed', -- pending, completed, failed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team Projects
CREATE TABLE team_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    project_id UUID REFERENCES projects(id),
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    permissions JSONB DEFAULT '[]',
    joined_at TIMESTAMP DEFAULT NOW()
);

-- Resource Quotas
CREATE TABLE resource_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL, -- project, team, user
    resource_id UUID NOT NULL,
    quota_type TEXT NOT NULL, -- cpu, memory, storage, ai_requests, cost
    limit_value BIGINT NOT NULL,
    current_usage BIGINT DEFAULT 0,
    period TEXT DEFAULT 'monthly', -- hourly, daily, weekly, monthly
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(resource_type, resource_id, quota_type, period)
);

-- Project Activity
CREATE TABLE project_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    activity_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Enhanced API Endpoints

### Project Management API

```typescript
// Project CRUD
POST   /api/projects
GET    /api/projects
GET    /api/projects/:projectId
PUT    /api/projects/:projectId
DELETE /api/projects/:projectId
POST   /api/projects/:projectId/archive
POST   /api/projects/:projectId/restore

// Project Containers
POST   /api/projects/:projectId/containers
GET    /api/projects/:projectId/containers
POST   /api/projects/:projectId/containers/start
POST   /api/projects/:projectId/containers/stop
DELETE /api/projects/:projectId/containers
GET    /api/projects/:projectId/containers/metrics
```

### Template Management API

```typescript
// Templates
POST   /api/templates
GET    /api/templates
GET    /api/templates/:templateId
PUT    /api/templates/:templateId
DELETE /api/templates/:templateId
POST   /api/templates/:templateId/apply
GET    /api/templates/:templateId/preview
POST   /api/templates/import
GET    /api/templates/:templateId/export

// Template Sharing
POST   /api/templates/:templateId/share
POST   /api/templates/:templateId/clone
GET    /api/templates/public
```

### Advanced Workspace API

```typescript
// Workspace Organization
POST   /api/workspaces/organize
POST   /api/workspaces/batch-tag
GET    /api/workspaces/search
POST   /api/workspaces/:workspaceId/duplicate

// Workspace Sharing
POST   /api/workspaces/:workspaceId/share
POST   /api/workspaces/:workspaceId/invite
POST   /api/workspaces/invites/:inviteId/accept
DELETE /api/workspaces/:workspaceId/shares/:shareId
GET    /api/workspaces/:workspaceId/shares

// Workspace Backup
POST   /api/workspaces/:workspaceId/backup
GET    /api/workspaces/:workspaceId/backups
POST   /api/workspaces/:workspaceId/restore/:backupId
POST   /api/workspaces/:workspaceId/backup-schedule
```

### Team Collaboration API

```typescript
// Team Projects
POST   /api/teams/:teamId/projects
GET    /api/teams/:teamId/projects
PUT    /api/teams/:teamId/projects/:projectId
DELETE /api/teams/:teamId/projects/:projectId

// Team Activity
GET    /api/teams/:teamId/activity
GET    /api/teams/:teamId/metrics
POST   /api/teams/:teamId/reports
GET    /api/teams/:teamId/members/:userId/activity

// Resource Management
POST   /api/teams/:teamId/quotas
GET    /api/teams/:teamId/usage
POST   /api/teams/:teamId/optimize-resources
```

## Implementation Strategy

### Phase 1: Project Isolation (Weeks 1-2)

#### Week 1: Container Infrastructure

1. **Docker Integration**
   - Container creation and management service
   - Resource allocation and monitoring
   - Network isolation configuration
   - Security policy enforcement

2. **Project-Container Mapping**
   - Automatic container provisioning for projects
   - Container lifecycle management
   - Resource quota enforcement
   - Performance monitoring integration

#### Week 2: Project Templates

1. **Template System**
   - Template creation and management
   - Template application and validation
   - Template sharing and discovery
   - Version control for templates

2. **Template Marketplace**
   - Public template gallery
   - Template rating and reviews
   - Template search and filtering
   - Template import/export functionality

### Phase 2: Advanced Workspaces (Weeks 3-4)

#### Week 3: Workspace Organization

1. **Enhanced Metadata**
   - Custom fields and tags
   - Workspace categorization
   - Advanced search functionality
   - Workspace analytics

2. **Workspace Sharing**
   - Direct sharing with users
   - Shareable links with permissions
   - Team-based sharing
   - Access control and permissions

#### Week 4: Backup and Recovery

1. **Backup System**
   - Automated backup scheduling
   - Manual backup creation
   - Backup compression and storage
   - Backup verification and integrity

2. **Recovery Features**
   - Point-in-time recovery
   - Selective restoration
   - Cross-environment restoration
   - Recovery testing and validation

### Phase 3: Team Collaboration (Weeks 5-6)

#### Week 5: Team Project Management

1. **Team Workspaces**
   - Team project creation and management
   - Member invitation and onboarding
   - Team-based permissions
   - Project collaboration features

2. **Team Analytics**
   - Team productivity metrics
   - Resource usage analytics
   - Activity tracking and reporting
   - Performance optimization suggestions

#### Week 6: Resource Management

1. **Quota Management**
   - Resource quota configuration
   - Usage monitoring and alerting
   - Quota enforcement and limits
   - Cost optimization recommendations

2. **Cross-Project Features**
   - Global search across projects
   - Cross-project resource sharing
   - Project portfolio management
   - Advanced filtering and organization

## Container Architecture

### Docker Integration

```typescript
// Container Service Implementation
class DockerContainerService implements ContainerManagementService {
  async createProjectContainer(
    projectId: string,
    config: ContainerConfig
  ): Promise<Container> {
    const containerConfig = {
      Image: config.image,
      Env: Object.entries(config.environment).map(
        ([key, value]) => `${key}=${value}`
      ),
      HostConfig: {
        Memory: config.resources.memory * 1024 * 1024, // Convert MB to bytes
        CpuQuota: config.resources.cpu * 100000, // Convert cores to nanoseconds
        ReadonlyRootfs: config.security.readOnlyFileSystem,
        NetworkMode: config.network.isolated ? 'none' : 'bridge',
        PortBindings: this.buildPortBindings(config.network.allowedPorts)
      },
      SecurityOpt: [
        `no-new-privileges:true`,
        ...config.security.dropCapabilities.map(cap => `cap-drop=${cap}`)
      ],
      User: config.security.runAsNonRoot ? '1000:1000' : 'root'
    };

    const container = await this.docker.createContainer({
      name: `ccwrapper-project-${projectId}`,
      ...containerConfig
    });

    // Store container metadata
    await this.containerRepository.create({
      projectId,
      containerId: container.id,
      config,
      status: 'created'
    });

    return this.mapDockerContainer(container);
  }

  async enforceResourceQuotas(projectId: string): Promise<void> {
    const quotas = await this.quotaService.getProjectQuotas(projectId);
    const metrics = await this.getContainerMetrics(projectId);

    for (const quota of quotas) {
      if (metrics[quota.type] > quota.limit) {
        await this.enforceQuotaLimit(projectId, quota.type, quota.limit);
      }
    }
  }
}
```

### Container Security

```typescript
// Security Configuration
class ContainerSecurityService {
  createSecurityConfig(projectType: string): SecurityConfig {
    const baseConfig = {
      readOnlyFileSystem: true,
      runAsNonRoot: true,
      dropCapabilities: [
        'CAP_SYS_ADMIN',
        'CAP_SYS_PTRACE',
        'CAP_SYS_MODULE',
        'CAP_SYS_RAWIO',
        'CAP_SYS_TIME'
      ]
    };

    const projectSpecificConfig = {
      'web-development': {
        ...baseConfig,
        allowedPorts: [3000, 8080, 8000],
        networkPolicies: ['allow-outbound-http', 'allow-outbound-https']
      },
      'data-science': {
        ...baseConfig,
        allowedPorts: [8888, 6006],
        networkPolicies: ['allow-outbound-http', 'allow-outbound-https'],
        mountVolumes: ['/data']
      },
      'mobile-development': {
        ...baseConfig,
        allowedPorts: [8081, 19006],
        networkPolicies: ['allow-outbound-http', 'allow-outbound-https'],
        deviceAccess: ['usb', 'android']
      }
    };

    return projectSpecificConfig[projectType] || baseConfig;
  }
}
```

## Performance Requirements

### Container Performance Targets

- **Container Start Time:** < 5 seconds
- **Resource Allocation:** < 1 second
- **Container Monitoring:** < 100ms latency
- **Quota Enforcement:** Real-time

### Scalability Targets

- **Concurrent Containers:** 1,000 per organization
- **Container Operations/Second:** 100
- **Template Storage:** 10,000 templates
- **Team Projects:** 1,000 per team

### Resource Efficiency

- **Container Overhead:** < 100MB per container
- **Template Storage:** < 1MB per template
- **Backup Storage:** Compression ratio > 70%
- **Search Performance:** < 500ms for cross-project search

## Testing Strategy

### Container Testing

```typescript
// Container Management Tests
describe('Container Management', () => {
  it('should create container with correct resource limits');
  it('should enforce network isolation');
  it('should monitor container metrics accurately');
  it('should handle container failures gracefully');
});

// Template System Tests
describe('Project Templates', () => {
  it('should apply templates correctly');
  it('should validate template configurations');
  it('should handle template versioning');
  it('should share templates securely');
});
```

### Collaboration Testing

```typescript
// Team Features Tests
describe('Team Collaboration', () => {
  it('should manage team member permissions');
  it('should track team activity accurately');
  it('should enforce resource quotas');
  it('should generate team reports correctly');
});
```

## Security Considerations

### Container Security

- **Isolation:** Complete filesystem and network isolation
- **Resource Limits:** CPU, memory, and storage quotas
- **Access Control:** Container access restricted to authorized users
- **Monitoring:** Real-time security monitoring and alerting

### Data Protection

- **Backup Encryption:** All backups encrypted at rest
- **Share Security:** Secure sharing with expiring links
- **Access Logging:** All access logged and audited
- **Data Retention:** Configurable retention policies

## Success Criteria

### Functional Success

- ✅ Container isolation working for 100% of projects
- ✅ Template system with 50+ pre-built templates
- ✅ Team collaboration features adopted by 80% of teams
- ✅ Backup and recovery 99.9% reliable

### Performance Success

- ✅ Container provisioning < 5 seconds
- ✅ Cross-project search < 500ms
- ✅ Team metrics calculation < 2 seconds
- ✅ Resource quota enforcement real-time

### Business Success

- ✅ Team adoption rate > 70% for organizations
- ✅ Project setup time reduced by 80%
- ✅ Team productivity increase > 25%
- ✅ Customer satisfaction > 90%

## Handoff Criteria

### Feature Completeness

- [ ] All container management features implemented
- [ ] Template system with marketplace functionality
- [ ] Complete team collaboration suite
- [ ] Backup and recovery system verified

### Quality Assurance

- [ ] Security penetration testing completed
- [ ] Performance benchmarks met
- [ ] Load testing for container operations
- [ ] Disaster recovery procedures tested

---

**Tech Spec Status:** Ready for Implementation **Next Phase:** Epic 4 -
Analytics & Intelligence Layer **Dependencies:** Epic 1 (Foundation), Epic 2
(Security) **Estimated Timeline:** 4-6 weeks
