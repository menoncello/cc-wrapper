import { create } from 'zustand';

export type UserType = 'solo' | 'team' | 'enterprise';
export type WorkspaceTemplate = 'React' | 'Node.js' | 'Python' | 'Custom';

interface OnboardingState {
  // Current step in wizard (1-3)
  currentStep: number;

  // Step 1: User Type
  userType: UserType | null;

  // Step 2: AI Tools
  selectedAITools: string[];

  // Step 3: Workspace Configuration
  workspaceName: string;
  workspaceDescription: string;
  workspaceTemplate: WorkspaceTemplate;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setUserType: (type: UserType) => void;
  setAITools: (tools: string[]) => void;
  addAITool: (tool: string) => void;
  removeAITool: (tool: string) => void;
  setWorkspaceConfig: (config: {
    name?: string;
    description?: string;
    template?: WorkspaceTemplate;
  }) => void;
  reset: () => void;

  // Validation
  canProceed: () => boolean;
}

const initialState = {
  currentStep: 1,
  userType: null,
  selectedAITools: [],
  workspaceName: '',
  workspaceDescription: '',
  workspaceTemplate: 'Custom' as WorkspaceTemplate
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setStep: step => set({ currentStep: step }),

  nextStep: () =>
    set(state => ({
      currentStep: Math.min(state.currentStep + 1, 3)
    })),

  previousStep: () =>
    set(state => ({
      currentStep: Math.max(state.currentStep - 1, 1)
    })),

  setUserType: type => set({ userType: type }),

  setAITools: tools => set({ selectedAITools: tools }),

  addAITool: tool =>
    set(state => ({
      selectedAITools: [...state.selectedAITools, tool]
    })),

  removeAITool: tool =>
    set(state => ({
      selectedAITools: state.selectedAITools.filter(t => t !== tool)
    })),

  setWorkspaceConfig: config =>
    set(state => ({
      workspaceName: config.name ?? state.workspaceName,
      workspaceDescription: config.description ?? state.workspaceDescription,
      workspaceTemplate: config.template ?? state.workspaceTemplate
    })),

  reset: () => set(initialState),

  canProceed: () => {
    const state = get();
    switch (state.currentStep) {
      case 1:
        return state.userType !== null;
      case 2:
        return true; // AI tools are optional
      case 3:
        return state.workspaceName.trim().length > 0;
      default:
        return false;
    }
  }
}));
