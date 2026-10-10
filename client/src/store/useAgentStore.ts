import { create } from 'zustand';
import { useProjectStore } from './useProjectStore';
import { useAiStore } from './useAiStore';
import { LATEXER_AGENT_TOOLS, executeAgentTool } from '../services/agentTools';
import { sendAiAgentStep, type AgentApiMessage } from '../services/aiApi';
import { buildAgentSystemPrompt, formatUserGoalMessage } from '../services/prompts';

export interface AgentToolCallLog {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'running' | 'success' | 'error';
  resultMessage?: string;
  diff?: {
    path: string;
    target: string;
    replacement: string;
  };
}

export interface AgentStepLog {
  stepIndex: number;
  thought?: string;
  toolCalls?: AgentToolCallLog[];
  completedSummary?: string;
  timestamp: number;
}

interface AgentState {
  isRunning: boolean;
  currentGoal: string;
  currentStep: number;
  maxSteps: number;
  logs: AgentStepLog[];
  error: string | null;
  completed: boolean;

  // Actions
  startAgentTask: (goal: string) => Promise<void>;
  stopAgent: () => void;
  clearAgentLogs: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  isRunning: false,
  currentGoal: '',
  currentStep: 0,
  maxSteps: 10,
  logs: [],
  error: null,
  completed: false,

  startAgentTask: async (goal: string) => {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return;

    const projectStore = useProjectStore.getState();
    const aiStore = useAiStore.getState();

    const fileList = Object.keys(projectStore.files);
    const activeFile = projectStore.activeFilePath || 'main.tex';

    const systemPrompt = buildAgentSystemPrompt({
      activeFile,
      files: fileList,
      engine: 'tectonic',
    });

    const userPrompt = formatUserGoalMessage(trimmedGoal, {
      activeFile,
      files: fileList,
    });

    set({
      isRunning: true,
      currentGoal: trimmedGoal,
      currentStep: 0,
      logs: [],
      error: null,
      completed: false,
    });

    const messages: AgentApiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let stepCounter = 0;
    const maxSteps = get().maxSteps;

    try {
      while (stepCounter < maxSteps) {
        if (!get().isRunning) {
          // User pressed Stop
          break;
        }

        stepCounter++;
        set({ currentStep: stepCounter });

        // Call server agent-step endpoint
        const response = await sendAiAgentStep({
          messages,
          tools: LATEXER_AGENT_TOOLS,
          model: aiStore.selectedModel,
          apiKey: aiStore.provider === 'groq' ? aiStore.groqKey : aiStore.geminiKey,
          provider: aiStore.provider,
          temperature: 0.2,
        });

        const assistantMsg = response.message;
        const toolCalls = assistantMsg.tool_calls || [];
        const userContent = assistantMsg.content || undefined;
        const thoughtContent = assistantMsg.thought || undefined;

        // If no tool calls were requested, the agent has finished its work (greeting, explanation, or task complete)
        if (!toolCalls || toolCalls.length === 0) {
          const finalSummary = userContent || thoughtContent || 'Task completed successfully.';
          set((state) => ({
            logs: [
              ...state.logs,
              {
                stepIndex: stepCounter,
                thought: thoughtContent,
                completedSummary: finalSummary,
                timestamp: Date.now(),
              },
            ],
            isRunning: false,
            completed: true,
          }));
          break;
        }

        // Create tool execution logs
        const toolLogs: AgentToolCallLog[] = toolCalls.map((tc) => {
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || '{}');
          } catch {
            parsedArgs = { raw: tc.function.arguments };
          }
          return {
            id: tc.id,
            name: tc.function.name,
            args: parsedArgs,
            status: 'running',
          };
        });

        // Record the step in UI logs
        set((state) => ({
          logs: [
            ...state.logs,
            {
              stepIndex: stepCounter,
              thought: thoughtContent,
              toolCalls: toolLogs,
              timestamp: Date.now(),
            },
          ],
        }));

        // Append assistant message to context history
        messages.push({
          role: 'assistant',
          content: assistantMsg.content,
          tool_calls: assistantMsg.tool_calls,
        });

        // Execute each tool call sequentially
        for (let i = 0; i < toolCalls.length; i++) {
          if (!get().isRunning) break;

          const tc = toolCalls[i];
          let parsedArgs: Record<string, any> = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }

          // Execute tool against local virtual workspace
          const toolResult = await executeAgentTool(tc.function.name, parsedArgs);

          // Update tool log in UI
          set((state) => {
            const updatedLogs = [...state.logs];
            const currentStepLog = updatedLogs[updatedLogs.length - 1];
            if (currentStepLog?.toolCalls && currentStepLog.toolCalls[i]) {
              currentStepLog.toolCalls[i] = {
                ...currentStepLog.toolCalls[i],
                status: toolResult.success ? 'success' : 'error',
                resultMessage: toolResult.message,
                diff: toolResult.diff,
              };
            }
            return { logs: updatedLogs };
          });

          // Add tool output message for the next model turn
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify({
              success: toolResult.success,
              message: toolResult.message,
              data: toolResult.data,
            }),
          });
        }
      }

      if (stepCounter >= maxSteps && get().isRunning) {
        set({
          isRunning: false,
          completed: true,
          error: `Reached maximum step limit (${maxSteps} steps).`,
        });
      }
    } catch (err: any) {
      console.error('Agent execution error:', err);
      set({
        isRunning: false,
        error: err.message || 'Agent execution failed.',
      });
    }
  },

  stopAgent: () => {
    set({ isRunning: false });
  },

  clearAgentLogs: () => {
    set({ logs: [], error: null, completed: false, currentStep: 0, currentGoal: '' });
  },
}));
