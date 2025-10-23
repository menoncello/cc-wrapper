import { beforeEach, describe, expect, it } from 'bun:test';

import { useOnboardingStore } from './onboardingStore';

describe('OnboardingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useOnboardingStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useOnboardingStore.getState();

      expect(state.currentStep).toBe(1);
      expect(state.userType).toBeNull();
      expect(state.selectedAITools).toEqual([]);
      expect(state.workspaceName).toBe('');
      expect(state.workspaceDescription).toBe('');
      expect(state.workspaceTemplate).toBe('Custom');
    });
  });

  describe('Step Navigation', () => {
    it('should set step correctly', () => {
      const { setStep } = useOnboardingStore.getState();

      setStep(2);
      expect(useOnboardingStore.getState().currentStep).toBe(2);

      setStep(3);
      expect(useOnboardingStore.getState().currentStep).toBe(3);
    });

    it('should move to next step', () => {
      const { nextStep } = useOnboardingStore.getState();

      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);

      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(3);
    });

    it('should not go beyond step 3', () => {
      const { setStep, nextStep } = useOnboardingStore.getState();

      setStep(3);
      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(3);
    });

    it('should move to previous step', () => {
      const { setStep, previousStep } = useOnboardingStore.getState();

      setStep(3);
      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);

      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);
    });

    it('should not go below step 1', () => {
      const { previousStep } = useOnboardingStore.getState();

      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);
    });
  });

  describe('User Type', () => {
    it('should set user type', () => {
      const { setUserType } = useOnboardingStore.getState();

      setUserType('solo');
      expect(useOnboardingStore.getState().userType).toBe('solo');

      setUserType('team');
      expect(useOnboardingStore.getState().userType).toBe('team');

      setUserType('enterprise');
      expect(useOnboardingStore.getState().userType).toBe('enterprise');
    });
  });

  describe('AI Tools', () => {
    it('should set AI tools', () => {
      const { setAITools } = useOnboardingStore.getState();

      setAITools(['Claude', 'GPT-4']);
      expect(useOnboardingStore.getState().selectedAITools).toEqual(['Claude', 'GPT-4']);
    });

    it('should add AI tool', () => {
      const { addAITool } = useOnboardingStore.getState();

      addAITool('Claude');
      expect(useOnboardingStore.getState().selectedAITools).toContain('Claude');

      addAITool('GPT-4');
      expect(useOnboardingStore.getState().selectedAITools).toEqual(['Claude', 'GPT-4']);
    });

    it('should remove AI tool', () => {
      const { setAITools, removeAITool } = useOnboardingStore.getState();

      setAITools(['Claude', 'GPT-4', 'Gemini']);
      removeAITool('GPT-4');

      const tools = useOnboardingStore.getState().selectedAITools;
      expect(tools).toEqual(['Claude', 'Gemini']);
      expect(tools).not.toContain('GPT-4');
    });
  });

  describe('Workspace Configuration', () => {
    it('should set workspace name', () => {
      const { setWorkspaceConfig } = useOnboardingStore.getState();

      setWorkspaceConfig({ name: 'My Workspace' });
      expect(useOnboardingStore.getState().workspaceName).toBe('My Workspace');
    });

    it('should set workspace description', () => {
      const { setWorkspaceConfig } = useOnboardingStore.getState();

      setWorkspaceConfig({ description: 'Test description' });
      expect(useOnboardingStore.getState().workspaceDescription).toBe('Test description');
    });

    it('should set workspace template', () => {
      const { setWorkspaceConfig } = useOnboardingStore.getState();

      setWorkspaceConfig({ template: 'React' });
      expect(useOnboardingStore.getState().workspaceTemplate).toBe('React');

      setWorkspaceConfig({ template: 'Node.js' });
      expect(useOnboardingStore.getState().workspaceTemplate).toBe('Node.js');
    });

    it('should set multiple workspace config properties at once', () => {
      const { setWorkspaceConfig } = useOnboardingStore.getState();

      setWorkspaceConfig({
        name: 'My Project',
        description: 'A cool project',
        template: 'Python'
      });

      const state = useOnboardingStore.getState();
      expect(state.workspaceName).toBe('My Project');
      expect(state.workspaceDescription).toBe('A cool project');
      expect(state.workspaceTemplate).toBe('Python');
    });

    it('should preserve existing values when setting partial config', () => {
      const { setWorkspaceConfig } = useOnboardingStore.getState();

      setWorkspaceConfig({ name: 'Initial Name' });
      setWorkspaceConfig({ description: 'New Description' });

      const state = useOnboardingStore.getState();
      expect(state.workspaceName).toBe('Initial Name');
      expect(state.workspaceDescription).toBe('New Description');
    });
  });

  describe('Validation - canProceed', () => {
    it('should not allow proceeding from step 1 without user type', () => {
      const { canProceed } = useOnboardingStore.getState();

      expect(canProceed()).toBe(false);
    });

    it('should allow proceeding from step 1 with user type', () => {
      const { setUserType, canProceed } = useOnboardingStore.getState();

      setUserType('solo');
      expect(canProceed()).toBe(true);
    });

    it('should always allow proceeding from step 2 (AI tools optional)', () => {
      const { setStep, canProceed } = useOnboardingStore.getState();

      setStep(2);
      expect(canProceed()).toBe(true);
    });

    it('should not allow proceeding from step 3 without workspace name', () => {
      const { setStep, canProceed } = useOnboardingStore.getState();

      setStep(3);
      expect(canProceed()).toBe(false);
    });

    it('should not allow proceeding from step 3 with only whitespace name', () => {
      const { setStep, setWorkspaceConfig, canProceed } = useOnboardingStore.getState();

      setStep(3);
      setWorkspaceConfig({ name: '   ' });
      expect(canProceed()).toBe(false);
    });

    it('should allow proceeding from step 3 with valid workspace name', () => {
      const { setStep, setWorkspaceConfig, canProceed } = useOnboardingStore.getState();

      setStep(3);
      setWorkspaceConfig({ name: 'My Workspace' });
      expect(canProceed()).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset store to initial state', () => {
      const { setUserType, setAITools, setWorkspaceConfig, setStep, reset } =
        useOnboardingStore.getState();

      // Modify all state
      setStep(3);
      setUserType('team');
      setAITools(['Claude', 'GPT-4']);
      setWorkspaceConfig({
        name: 'Test',
        description: 'Desc',
        template: 'React'
      });

      // Reset
      reset();

      // Verify all state is reset
      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.userType).toBeNull();
      expect(state.selectedAITools).toEqual([]);
      expect(state.workspaceName).toBe('');
      expect(state.workspaceDescription).toBe('');
      expect(state.workspaceTemplate).toBe('Custom');
    });
  });
});
