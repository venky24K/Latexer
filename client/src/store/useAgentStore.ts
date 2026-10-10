import { create } from 'zustand';
import { useProjectStore } from './useProjectStore';
import { useAiStore } from './useAiStore';
import { LATEXER_AGENT_TOOLS, executeAgentTool } from '../services/agentTools';
import { sendAiAgentStep, type AgentApiMessage } from '../services/aiApi';
import { buildAgentSystemPrompt, formatUserGoalMessage } from '../services/prompts';

export interface PendingEdit {
  path: string;
  originalContent: string;
  newContent: string;
  addedLines: number;
  removedLines: number;
}

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
    addedLines?: number;
    removedLines?: number;
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

  /** Files staged for review: path → PendingEdit */
  pendingEdits: Record<string, PendingEdit>;

  // Actions
  startAgentTask: (goal: string) => Promise<void>;
  stopAgent: () => void;
  clearAgentLogs: () => void;
  acceptEdit: (path: string) => void;
  rejectEdit: (path: string) => void;
  acceptAllEdits: () => void;
  rejectAllEdits: () => void;
}

/** Compute accurate line-level diff stats between two text contents using LCS */
export function computeDiffStats(original: string, updated: string): { addedLines: number; removedLines: number } {
  if (original === updated) return { addedLines: 0, removedLines: 0 };
  if (!original) return { addedLines: updated.split('\n').length, removedLines: 0 };
  if (!updated) return { addedLines: 0, removedLines: original.split('\n').length };

  const origLines = original.split('\n');
  const newLines = updated.split('\n');

  const m = origLines.length;
  const n = newLines.length;

  if (m * n > 1500000) {
    const origSet = new Set(origLines);
    const newSet = new Set(newLines);
    return {
      addedLines: newLines.filter((l) => !origSet.has(l)).length,
      removedLines: origLines.filter((l) => !newSet.has(l)).length,
    };
  }

  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (origLines[i - 1] === newLines[j - 1]) {
        dp[j] = prev + 1;
      } else {
        dp[j] = Math.max(dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  const lcs = dp[n];
  return {
    addedLines: Math.max(0, n - lcs),
    removedLines: Math.max(0, m - lcs),
  };
}

export const useAgentStore = create<AgentState>((set, get) => ({
  isRunning: false,
  currentGoal: '',
  currentStep: 0,
  maxSteps: 10,
  logs: [],
  error: null,
  completed: false,
  pendingEdits: {},

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

        // If no tool calls were requested, the agent has finished its work
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
          rawGeminiParts: assistantMsg.rawGeminiParts,
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

          // Capture original content BEFORE edit for staging
          const isWriteTool = tc.function.name === 'edit_file' || tc.function.name === 'write_file';
          const editPath = parsedArgs.path as string | undefined;
          const filesSnapshot = useProjectStore.getState().files;
          const existingPending = editPath ? get().pendingEdits[editPath] : undefined;
          const originalContent = existingPending
            ? existingPending.originalContent
            : editPath && filesSnapshot[editPath]
            ? filesSnapshot[editPath].content
            : '';

          // Execute tool against local virtual workspace
          const toolResult = await executeAgentTool(tc.function.name, parsedArgs);

          // If this was a file-modifying tool and it succeeded, stage as pending
          if (isWriteTool && editPath && toolResult.success) {
            const newContent = useProjectStore.getState().files[editPath]?.content ?? '';
            if (newContent !== originalContent) {
              const { addedLines, removedLines } = computeDiffStats(originalContent, newContent);

              // Stage the pending edit
              set((state) => ({
                pendingEdits: {
                  ...state.pendingEdits,
                  [editPath]: {
                    path: editPath,
                    originalContent,
                    newContent,
                    addedLines,
                    removedLines,
                  },
                },
              }));

              // Enrich the diff result with stats
              if (toolResult.diff) {
                toolResult.diff.addedLines = addedLines;
                toolResult.diff.removedLines = removedLines;
              } else {
                toolResult.diff = {
                  path: editPath,
                  target: '',
                  replacement: '',
                  addedLines,
                  removedLines,
                };
              }

              // Focus the active file so user can review the diff immediately
              useProjectStore.getState().setActiveFile(editPath);
            }
          }

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

  acceptEdit: (path: string) => {
    const edit = get().pendingEdits[path];
    if (edit) {
      useProjectStore.getState().updateFileContent(path, edit.newContent);
    }
    set((state) => {
      const next = { ...state.pendingEdits };
      delete next[path];
      return { pendingEdits: next };
    });
  },

  rejectEdit: (path: string) => {
    const edit = get().pendingEdits[path];
    if (edit) {
      if (edit.originalContent) {
        useProjectStore.getState().updateFileContent(path, edit.originalContent);
      } else {
        // Was newly created
        useProjectStore.getState().deleteFile(path);
      }
    }
    set((state) => {
      const next = { ...state.pendingEdits };
      delete next[path];
      return { pendingEdits: next };
    });
  },

  acceptAllEdits: () => {
    const { pendingEdits } = get();
    const projectStore = useProjectStore.getState();
    Object.values(pendingEdits).forEach((edit) => {
      projectStore.updateFileContent(edit.path, edit.newContent);
    });
    set({ pendingEdits: {} });
  },

  rejectAllEdits: () => {
    const { pendingEdits } = get();
    const projectStore = useProjectStore.getState();
    Object.values(pendingEdits).forEach((edit) => {
      if (edit.originalContent) {
        projectStore.updateFileContent(edit.path, edit.originalContent);
      } else {
        projectStore.deleteFile(edit.path);
      }
    });
    set({ pendingEdits: {} });
  },
}));
