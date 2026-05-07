# opencode-plugin-fixes

Small [OpenCode](https://opencode.ai) runtime guard plugins for real-world agent/tool edge cases.

> Note: the MCP nested-object fixer is intentionally narrow. It only coerces known schema-like fields for known MCP tool prefixes, so arbitrary JSON-looking file contents are not parsed accidentally.

It bundles three dependency-free OpenCode plugins:

- `FixQuestionSchema` — coerces malformed question tool args back into the schema OpenCode expects.
- `FixMcpNestedObject` — coerces JSON-stringified nested MCP object/array args back into objects/arrays before validation.
- `BlockRepeatQuestion` — blocks repeated question tool calls while a prior question is still pending in the same session.

## Why

Some frontier models occasionally stringify nested tool arguments under heavy context or nested-schema pressure. OpenCode's validator then rejects the tool call even though the intended shape is recoverable.

Separately, OpenCode's question UI can show `(no answer)` while the user is still responding. Some models interpret that placeholder as a decline and re-ask, burying the original question. `BlockRepeatQuestion` turns that failure mode into a hard stop.

## Install

Add the npm package to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-plugin-fixes"
  ]
}
```

Restart OpenCode after changing plugins.

## What It Touches

`FixQuestionSchema` only touches question-like tools:

- `question`
- `ask_user_question`
- `askuserquestion`

`FixMcpNestedObject` only touches selected schema-like fields on known MCP-prefixed tools:

- `memory_`: `content`, `metadata`, `tags`
- `context-mode_`: `arguments`, `requests`, `queries`, `commands`
- `grep_app_`: `language`
- `skill_mcp_`: `arguments`

Other MCP tool args, including arbitrary JSON-looking file contents, are left unchanged.

`BlockRepeatQuestion` tracks pending question calls per OpenCode session and releases the lock when OpenCode emits `question.replied`, `question.rejected`, or a fresh `chat.message`. A 30-minute TTL prevents permanent lockout if an expected event is dropped.

## Replace Local Files

If you previously used local files like this:

```json
{
  "plugin": [
    "./plugin/fix-question-schema.js",
    "./plugin/fix-mcp-nested-object.js",
    "./plugin/block-repeat-question.js"
  ]
}
```

replace those three entries with:

```json
{
  "plugin": [
    "opencode-plugin-fixes"
  ]
}
```

Keep unrelated local plugins, such as private or third-party integrations, as separate entries.

## Verify

```bash
npm test
npm pack --dry-run
```

## License

MIT
