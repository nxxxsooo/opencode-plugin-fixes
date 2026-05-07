import assert from "node:assert/strict";
import {
  BlockRepeatQuestion,
  FixMcpNestedObject,
  FixQuestionSchema,
} from "../src/index.js";

const run = async () => {
  const questionHooks = await FixQuestionSchema();

  const stringifiedQuestions = {
    args: {
      questions: JSON.stringify({
        question: "Pick one",
        options: JSON.stringify({ label: "A", description: "Alpha" }),
      }),
    },
  };
  await questionHooks["tool.execute.before"](
    { tool: "ask_user_question" },
    stringifiedQuestions
  );
  assert.deepEqual(stringifiedQuestions.args.questions, [
    {
      question: "Pick one",
      options: [{ label: "A", description: "Alpha" }],
    },
  ]);

  const mcpHooks = await FixMcpNestedObject();
  const mcpOutput = {
    args: {
      metadata: JSON.stringify({ tags: ["opencode", "plugin"] }),
      untouched: "plain text",
    },
  };
  await mcpHooks["tool.execute.before"](
    { tool: "memory_memory_store" },
    mcpOutput
  );
  assert.deepEqual(mcpOutput.args.metadata, { tags: ["opencode", "plugin"] });
  assert.equal(mcpOutput.args.untouched, "plain text");

  const fileWriteOutput = { args: { content: JSON.stringify({ should: "stay" }) } };
  await mcpHooks["tool.execute.before"]({ tool: "filesystem_write_file" }, fileWriteOutput);
  assert.equal(fileWriteOutput.args.content, JSON.stringify({ should: "stay" }));

  const nonMcpOutput = { args: { metadata: JSON.stringify({ should: "stay" }) } };
  await mcpHooks["tool.execute.before"]({ tool: "bash" }, nonMcpOutput);
  assert.equal(nonMcpOutput.args.metadata, JSON.stringify({ should: "stay" }));

  const blockHooks = await BlockRepeatQuestion();
  await blockHooks["tool.execute.before"]({
    tool: "askuserquestion",
    sessionID: "ses_demo",
  });

  await assert.rejects(
    () =>
      blockHooks["tool.execute.before"]({
        tool: "question",
        sessionID: "ses_demo",
      }),
    /prior question tool call/
  );

  await blockHooks.event({
    event: {
      type: "question.replied",
      properties: { sessionID: "ses_demo" },
    },
  });

  await blockHooks["tool.execute.before"]({
    tool: "question",
    sessionID: "ses_demo",
  });

  await blockHooks["chat.message"]({ sessionID: "ses_demo" });
  await blockHooks["tool.execute.before"]({
    tool: "question",
    sessionID: "ses_demo",
  });
};

await run();
console.log("plugin hooks ok");
