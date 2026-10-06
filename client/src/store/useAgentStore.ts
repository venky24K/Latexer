import { create } from 'zustand';
import { useProjectStore } from './useProjectStore';
import { useAiStore } from './useAiStore';
import { LATEXER_AGENT_TOOLS, executeAgentTool } from '../services/agentTools';
import { sendAiAgentStep, type AgentApiMessage } from '../services/aiApi';

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

const AGENT_SYSTEM_PROMPT = `You are the autonomous Latexer Project Engineering Agent.
Your objective is to achieve the author's research, writing, formatting, or debugging goal across the LaTeX project workspace.

You have access to a suite of tools to inspect, modify, and compile the workspace:
- list_files: List all workspace files and assets.
- read_file: Read file contents or line slices.
- write_file: Create new files or completely overwrite existing files.
- edit_file: Surgically replace exact code snippets in existing files.
- delete_file: Delete a file (main.tex is protected).
- search_files: Search for text, citations, or equations across files.
- compile_and_diagnose: Compile the project and inspect errors/warnings.

Protocol:
1. EXPLORE: If you need to see existing file contents, call read_file or list_files first.
2. SURGICAL EDITS: When modifying files, prefer edit_file to preserve existing code. Make sure target_snippet is exact and unique.
3. VERIFICATION: Whenever you make changes that could impact compilation, ALWAYS call compile_and_diagnose to verify that the project compiles with 0 errors!
4. REPAIR: If compile_and_diagnose reports errors, inspect the offending file and line, then call edit_file to patch the syntax until it compiles.
5. FINISH: When the goal is fully accomplished, provide a concise final summary of the changes made without calling further tools.`;

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

    const fileList = Object.keys(projectStore.files).join(', ');
    const initialFilesSummary = `Project files currently in workspace: [${fileList}]. Active file: "${projectStore.activeFilePath}".`;

    set({
      isRunning: true,
      currentGoal: trimmedGoal,
      currentStep: 0,
      logs: [],
      error: null,
      completed: false,
    });

    const messages: AgentApiMessage[] = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Author's Goal: ${trimmedGoal}\n\n${initialFilesSummary}`,
      },
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
        const thoughtContent = assistantMsg.content || undefined;

        // If no tool calls were requested, the agent has finished its work
        if (!toolCalls || toolCalls.length === 0) {
          set((state) => ({
            logs: [
              ...state.logs,
              {
                stepIndex: stepCounter,
                thought: thoughtContent,
                completedSummary: thoughtContent || 'Task completed successfully.',
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
