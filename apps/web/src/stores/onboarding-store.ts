import { create } from 'zustand';

/**
 * User type enumeration for onboarding flow
 */
export type UserType = 'solo' | 'team' | 'enterprise';

/**
 * Workspace template enumeration for onboarding flow
 */
export type WorkspaceTemplate = 'React' | 'Node.js' | 'Python' | 'Custom';

/**
 * Interface for workspace configuration
 */
export interface WorkspaceConfig {
  name?: string;
  description?: string;
  template?: WorkspaceTemplate;
}

/**
 * Interface for onboarding state management
 */
export interface OnboardingState {
  /** Current step in wizard (1-3) */
  currentStep: number;

  /** Step 1: User Type */
  userType: UserType | null;

  /** Step 2: AI Tools */
  selectedAITools: string[];

  /** Step 3: Workspace Configuration */
  workspaceName: string;
  workspaceDescription: string;
  workspaceTemplate: WorkspaceTemplate;

  /** Actions */
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setUserType: (type: UserType) => void;
  setAITools: (tools: string[]) => void;
  addAITool: (tool: string) => void;
  removeAITool: (tool: string) => void;
  setWorkspaceConfig: (config: WorkspaceConfig) => void;
  reset: () => void;

  /** Validation */
  canProceed: () => boolean;
}

/**
 * Constants for onboarding flow
 */
const ONBOARDING_CONSTANTS = {
  /** Maximum step number */
  MAX_STEP: 3,
  /** Minimum step number */
  MIN_STEP: 1,
  /** Default workspace template */
  DEFAULT_WORKSPACE_TEMPLATE: 'Custom' as WorkspaceTemplate
} as const;

/** Step two constant for validation */
const ONBOARDING_STEP_TWO = 2;

/**
 * Initial data for onboarding
 */
const initialData: Omit<
  OnboardingState,
  | 'setStep'
  | 'nextStep'
  | 'previousStep'
  | 'setUserType'
  | 'setAITools'
  | 'addAITool'
  | 'removeAITool'
  | 'setWorkspaceConfig'
  | 'reset'
  | 'canProceed'
> = {
  currentStep: ONBOARDING_CONSTANTS.MIN_STEP,
  userType: null,
  selectedAITools: [],
  workspaceName: '',
  workspaceDescription: '',
  workspaceTemplate: ONBOARDING_CONSTANTS.DEFAULT_WORKSPACE_TEMPLATE
};

/**
 * Sets the current step in the onboarding wizard
 * @param {Function} set - Zustand set function
 * @param {number} step - Step number to set
 * @returns {void}
 */
const setStepHandler = (
  set: (partial: OnboardingState | Partial<OnboardingState>) => void,
  step: number
): void => {
  set({ currentStep: step });
};

/**
 * Advances to the next step in the wizard
 * @param {Function} set - Zustand set function
 * @returns {void}
 */
const nextStepHandler = (
  set: (
    partial:
      | OnboardingState
      | Partial<OnboardingState>
      | ((state: OnboardingState) => Partial<OnboardingState>)
  ) => void
): void => {
  set((state: OnboardingState) => ({
    currentStep: Math.min(state.currentStep + 1, ONBOARDING_CONSTANTS.MAX_STEP)
  }));
};

/**
 * Goes back to the previous step in the wizard
 * @param {Function} set - Zustand set function
 * @returns {void}
 */
const previousStepHandler = (
  set: (
    partial:
      | OnboardingState
      | Partial<OnboardingState>
      | ((state: OnboardingState) => Partial<OnboardingState>)
  ) => void
): void => {
  set((state: OnboardingState) => ({
    currentStep: Math.max(state.currentStep - 1, ONBOARDING_CONSTANTS.MIN_STEP)
  }));
};

/**
 * Sets the user type for onboarding
 * @param {Function} set - Zustand set function
 * @param {UserType} type - User type to set
 * @returns {void}
 */
const setUserTypeHandler = (
  set: (partial: OnboardingState | Partial<OnboardingState>) => void,
  type: UserType
): void => {
  set({ userType: type });
};

/**
 * Sets the selected AI tools
 * @param {Function} set - Zustand set function
 * @param {string[]} tools - Array of AI tool names
 * @returns {void}
 */
const setAIToolsHandler = (
  set: (partial: OnboardingState | Partial<OnboardingState>) => void,
  tools: string[]
): void => {
  set({ selectedAITools: tools });
};

/**
 * Adds an AI tool to the selection
 * @param {Function} set - Zustand set function
 * @param {string} tool - Tool name to add
 * @returns {void}
 */
const addAIToolHandler = (
  set: (
    partial:
      | OnboardingState
      | Partial<OnboardingState>
      | ((state: OnboardingState) => Partial<OnboardingState>)
  ) => void,
  tool: string
): void => {
  set((state: OnboardingState) => ({
    selectedAITools: [...state.selectedAITools, tool]
  }));
};

/**
 * Removes an AI tool from the selection
 * @param {Function} set - Zustand set function
 * @param {string} tool - Tool name to remove
 * @returns {void}
 */
const removeAIToolHandler = (
  set: (
    partial:
      | OnboardingState
      | Partial<OnboardingState>
      | ((state: OnboardingState) => Partial<OnboardingState>)
  ) => void,
  tool: string
): void => {
  set((state: OnboardingState) => ({
    selectedAITools: state.selectedAITools.filter(t => t !== tool)
  }));
};

/**
 * Updates workspace configuration
 * @param {Function} set - Zustand set function
 * @param {WorkspaceConfig} config - Workspace configuration object
 * @returns {void}
 */
const setWorkspaceConfigHandler = (
  set: (
    partial:
      | OnboardingState
      | Partial<OnboardingState>
      | ((state: OnboardingState) => Partial<OnboardingState>)
  ) => void,
  config: WorkspaceConfig
): void => {
  set((state: OnboardingState) => ({
    workspaceName: config.name ?? state.workspaceName,
    workspaceDescription: config.description ?? state.workspaceDescription,
    workspaceTemplate: config.template ?? state.workspaceTemplate
  }));
};

/**
 * Resets the onboarding state to initial values
 * @param {Function} set - Zustand set function
 * @returns {void}
 */
const resetHandler = (set: (partial: OnboardingState | Partial<OnboardingState>) => void): void => {
  set(initialData);
};

/**
 * Validates if user can proceed to the next step
 * @param {Function} get - Zustand get function
 * @returns {boolean} True if user can proceed, false otherwise
 */
const canProceedHandler = (get: () => OnboardingState): boolean => {
  const state = get();
  switch (state.currentStep) {
    case ONBOARDING_CONSTANTS.MIN_STEP:
      return state.userType !== null;
    case ONBOARDING_STEP_TWO:
      return true; // AI tools are optional
    case ONBOARDING_CONSTANTS.MAX_STEP:
      return state.workspaceName.trim().length > 0;
    default:
      return false;
  }
};

/**
 * Creates onboarding store with Zustand
 * Provides state management for the onboarding wizard flow
 */
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialData,

  /**
   * Sets the current step in the onboarding wizard
   * @param {number} step - Step number to set
   * @returns {void}
   */
  setStep: (step: number): void => setStepHandler(set, step),

  /**
   * Advances to the next step in the wizard
   * @returns {void}
   */
  nextStep: (): void => nextStepHandler(set),

  /**
   * Goes back to the previous step in the wizard
   * @returns {void}
   */
  previousStep: (): void => previousStepHandler(set),

  /**
   * Sets the user type for onboarding
   * @param {UserType} type - User type to set
   * @returns {void}
   */
  setUserType: (type: UserType): void => setUserTypeHandler(set, type),

  /**
   * Sets the selected AI tools
   * @param {string[]} tools - Array of AI tool names
   * @returns {void}
   */
  setAITools: (tools: string[]): void => setAIToolsHandler(set, tools),

  /**
   * Adds an AI tool to the selection
   * @param {string} tool - Tool name to add
   * @returns {void}
   */
  addAITool: (tool: string): void => addAIToolHandler(set, tool),

  /**
   * Removes an AI tool from the selection
   * @param {string} tool - Tool name to remove
   * @returns {void}
   */
  removeAITool: (tool: string): void => removeAIToolHandler(set, tool),

  /**
   * Updates workspace configuration
   * @param {WorkspaceConfig} config - Workspace configuration object
   * @returns {void}
   */
  setWorkspaceConfig: (config: WorkspaceConfig): void => setWorkspaceConfigHandler(set, config),

  /**
   * Resets the onboarding state to initial values
   * @returns {void}
   */
  reset: (): void => resetHandler(set),

  /**
   * Validates if user can proceed to the next step
   * @returns {boolean} True if user can proceed, false otherwise
   */
  canProceed: (): boolean => canProceedHandler(get)
}));
