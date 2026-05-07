const QUESTION_TOOL_NAMES = new Set([
  "question",
  "ask_user_question",
  "askuserquestion",
]);

const MCP_PREFIXES_BY_TOOL = new Map([
  ["memory_", new Set(["content", "metadata", "tags"])],
  ["context-mode_", new Set(["arguments", "requests", "queries", "commands"])],
  ["filesystem_", new Set()],
  ["websearch_", new Set()],
  ["grep_app_", new Set(["language"])],
  ["context7_", new Set()],
  ["skill_mcp_", new Set(["arguments"])],
]);

const LOCK_TTL_MS = 30 * 60 * 1000;

const isQuestionTool = (name) =>
  typeof name === "string" &&
  QUESTION_TOOL_NAMES.has(name.toLowerCase().replace(/-/g, "_"));

const getCoercibleMcpKeys = (name) => {
  if (typeof name !== "string") return undefined;

  for (const [prefix, keys] of MCP_PREFIXES_BY_TOOL) {
    if (name.startsWith(prefix)) return keys;
  }

  return undefined;
};

const looksLikeJson = (value) => {
  if (typeof value !== "string" || value.length < 2) return false;
  const first = value.charCodeAt(0);
  return first === 123 || first === 91;
};

const parseJsonObjectOrArray = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return undefined;
};

export const FixQuestionSchema = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (!isQuestionTool(input.tool)) return;

      const args = output.args;
      if (!args || typeof args !== "object") return;

      if (typeof args.questions === "string") {
        const parsed = parseJsonObjectOrArray(args.questions);
        if (Array.isArray(parsed)) {
          args.questions = parsed;
        } else if (parsed) {
          args.questions = [parsed];
        }
      }

      if (
        args.questions &&
        !Array.isArray(args.questions) &&
        typeof args.questions === "object" &&
        ("question" in args.questions || "options" in args.questions)
      ) {
        args.questions = [args.questions];
      }

      if (!Array.isArray(args.questions)) return;

      for (const question of args.questions) {
        if (!question || typeof question !== "object") continue;

        if (typeof question.options === "string") {
          const parsed = parseJsonObjectOrArray(question.options);
          if (Array.isArray(parsed)) {
            question.options = parsed;
          } else if (parsed) {
            question.options = [parsed];
          }
        }

        if (
          question.options &&
          !Array.isArray(question.options) &&
          typeof question.options === "object"
        ) {
          question.options = [question.options];
        }
      }
    },
  };
};

export const FixMcpNestedObject = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const coercibleKeys = getCoercibleMcpKeys(input.tool);
      if (!coercibleKeys) return;

      const args = output.args;
      if (!args || typeof args !== "object" || Array.isArray(args)) return;

      for (const key of Object.keys(args)) {
        if (!coercibleKeys.has(key)) continue;

        const value = args[key];
        if (!looksLikeJson(value)) continue;

        const parsed = parseJsonObjectOrArray(value);
        if (parsed) args[key] = parsed;
      }
    },
  };
};

export const BlockRepeatQuestion = async () => {
  const pendingBySession = new Map();

  const release = (sessionID) => {
    if (!sessionID) return;
    pendingBySession.delete(sessionID);
  };

  return {
    event: async ({ event }) => {
      if (!event || typeof event !== "object") return;
      if (event.type !== "question.replied" && event.type !== "question.rejected") return;
      release(event.properties?.sessionID);
    },

    "chat.message": async (input) => {
      release(input?.sessionID);
    },

    "tool.execute.before": async (input) => {
      if (!isQuestionTool(input.tool)) return;

      const sessionID = input.sessionID;
      if (!sessionID) return;

      const existing = pendingBySession.get(sessionID);
      if (existing) {
        if (Date.now() - existing.lockedAt > LOCK_TTL_MS) {
          release(sessionID);
        } else {
          throw new Error(
            "BLOCKED by opencode-plugin-fixes: a prior question tool call in this session is still pending. " +
              "The previous `(no answer)` placeholder means the user is still typing, not that they declined. " +
              "End the turn and wait for the user's actual reply."
          );
        }
      }

      pendingBySession.set(sessionID, { lockedAt: Date.now() });
    },
  };
};
