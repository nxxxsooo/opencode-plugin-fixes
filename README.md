<div align="center">
  <img src="cover.png" alt="opencode-plugin-fixes cover" width="100%">

  # opencode-plugin-fixes

  [![Release](https://img.shields.io/github/v/release/nxxxsooo/opencode-plugin-fixes?color=58e6c4)](https://github.com/nxxxsooo/opencode-plugin-fixes/releases)
  [![License](https://img.shields.io/github/license/nxxxsooo/opencode-plugin-fixes)](LICENSE)
  [![OpenCode](https://img.shields.io/badge/OpenCode-plugin-fbbf77)](https://opencode.ai)
  [![Dependencies](https://img.shields.io/badge/dependencies-0-5ab8ff)](package.json)
</div>

Small [OpenCode](https://opencode.ai) runtime guard plugins for real-world agent/tool edge cases.

> Note: the MCP nested-object fixer is intentionally narrow. It only coerces known schema-like fields for known MCP tool prefixes, so arbitrary JSON-looking file contents are not parsed accidentally.

## What It Includes

- **`FixQuestionSchema`** - coerces malformed question tool args back into the schema OpenCode expects.
- **`FixMcpNestedObject`** - coerces JSON-stringified nested MCP object/array args back into objects/arrays before validation.
- **`BlockRepeatQuestion`** - blocks repeated question tool calls while a prior question is still pending in the same session.

## Why

Some frontier models occasionally stringify nested tool arguments under heavy context or nested-schema pressure. OpenCode's validator then rejects the tool call even though the intended shape is recoverable.

Separately, OpenCode's question UI can show `(no answer)` while the user is still responding. Some models interpret that placeholder as a decline and re-ask, burying the original question. `BlockRepeatQuestion` turns that failure mode into a hard stop.

## Install Today: GitHub Release File

Until npm publish is completed, install the GitHub release as a local OpenCode plugin file:

```bash
mkdir -p ~/.config/opencode/plugins
curl -fsSL https://raw.githubusercontent.com/nxxxsooo/opencode-plugin-fixes/main/src/index.js \
  -o ~/.config/opencode/plugins/opencode-plugin-fixes.js
```

Then remove the three older local plugin entries from `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "./plugin/fix-question-schema.js",
    "./plugin/fix-mcp-nested-object.js",
    "./plugin/block-repeat-question.js"
  ]
}
```

The file under `~/.config/opencode/plugins/` is auto-loaded by OpenCode on restart.

## Future npm Install

The package name `opencode-plugin-fixes` is available. After npm auth is completed and the package is published, use this single plugin entry instead:

```json
{
  "plugin": [
    "opencode-plugin-fixes"
  ]
}
```

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

## Verify

```bash
npm test
npm pack --dry-run
npm publish --dry-run
```

The test driver covers all three hooks, including the regression that `filesystem_write_file.content` must not be parsed as JSON.

## Links

- Project site: https://mjshao.fun/opencode-plugin-fixes/
- Portfolio entry: https://mjshao.fun/work/opencode-plugin-fixes
- Release: https://github.com/nxxxsooo/opencode-plugin-fixes/releases/tag/v0.1.0

---

<details>
<summary>中文文档</summary>

## 这是什么

`opencode-plugin-fixes` 是一组零依赖 OpenCode 插件，用来保护长上下文 agent 运行里最常见、但很浪费时间的小型 tool-call 故障。

它包含三个插件：

- **`FixQuestionSchema`** - 修复被字符串化的 `questions`、裸 question 对象、以及被字符串化的 `options`。
- **`FixMcpNestedObject`** - 只把明确的 MCP schema-like 字段从 JSON 字符串还原为对象/数组。
- **`BlockRepeatQuestion`** - 当用户还在回答上一个问题时，阻止模型重复调用 question 工具刷屏。

## 为什么需要

模型在高上下文、复杂 schema、中文内容混合时，偶尔会把 nested object/array 字符串化。OpenCode 的校验器会拒绝这些参数，但其中一部分其实是可恢复的正确意图。

另一个问题是 OpenCode question UI 在等待用户回答时可能显示 `(no answer)`。一些模型会把它误解成“用户拒绝回答”，然后继续追问，直到原始问题被重复问题淹没。

## 当前安装方式

npm 包名已经可用，但真实 publish 还需要完成 npm 登录。现在先使用 GitHub release 文件作为本地 OpenCode 插件：

```bash
mkdir -p ~/.config/opencode/plugins
curl -fsSL https://raw.githubusercontent.com/nxxxsooo/opencode-plugin-fixes/main/src/index.js \
  -o ~/.config/opencode/plugins/opencode-plugin-fixes.js
```

然后从 `~/.config/opencode/opencode.json` 移除旧的三个本地插件条目：

```json
{
  "plugin": [
    "./plugin/fix-question-schema.js",
    "./plugin/fix-mcp-nested-object.js",
    "./plugin/block-repeat-question.js"
  ]
}
```

OpenCode 重启后会自动加载 `~/.config/opencode/plugins/` 下的插件文件。

## npm 发布后

npm 发布完成后，可以改成一个包名：

```json
{
  "plugin": [
    "opencode-plugin-fixes"
  ]
}
```

## 安全边界

`FixMcpNestedObject` 不会解析所有看起来像 JSON 的字符串。它只处理明确的 schema-like 字段，避免误把文件正文、命令或用户内容改成对象。

</details>

## License

MIT
