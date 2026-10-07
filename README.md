# claude-ask-choice

A small plugin ("mod") for Claude Code's terminal UI that turns a choice-based question at the end of a reply into a selectable menu.
When a reply ends with a question you could answer by picking an option, but it is written in plain text, the plugin has the model re-ask it with the `AskUserQuestion` tool, so you can select an option instead of typing.

日本語の説明は [README.ja.md](README.ja.md) にあります。

In-app messages are in Japanese.

## When to use

- When Claude ends a reply with a question that has a few clear answers, but writes it as prose and you have to type the answer back.
- When you work with Claude in Japanese: the question indicators include the Japanese endings `ですか`, `ますか`, `でしょうか`, `ましょうか` as well as `?` / `？`.
- When you want the re-ask to happen only where it is needed: it steps in once per question, and never on a turn that already used `AskUserQuestion`.

Not for you if you run Claude non-interactively (`claude -p`), if you do not want one extra classification call for each reply that ends with a question, or if you are on Windows (untested).

## What it looks like

After a reply that ends with a choice-based question in prose, a short English message starting with `[MOD ask-choice]` appears on screen, shown by Claude Code as a message sent by the plugin. The model then re-asks the same question with the `AskUserQuestion` picker. Replies without a question indicator are left as they are.

## Requirements

- Built on Claude Code's plugin hooks ("mods") API, which is in early access and may change between versions.
- Developed and tested with Claude Code 2.1.287 to 2.1.289 on macOS.
- Windows is untested.

## Install

From the marketplace in this repository:

```
claude plugin marketplace add i-noma-ru/claude-ask-choice
claude plugin install ask-choice@claude-ask-choice
```

Or for one session only, from a clone:

```
claude --plugin-dir /path/to/claude-ask-choice
```

To load a clone in every session, add it to the `CLAUDE_CODE_PLUGIN_DIRS` environment variable: a `:`-separated list where each entry is either a plugin folder itself or a folder that contains plugin folders (both confirmed in 2.1.292). The variable does not appear in `claude --help`, so treat it as subject to change.

## How it works

At the end of each turn, the plugin inspects the end of the reply (the last 1,500 characters, with code blocks and inline code removed).

1. If the text shows no sign of a question, nothing happens. Indicators include: a line ending in `?` / `？` or the Japanese endings `ですか`, `ますか`, `でしょうか`, `ましょうか`; the phrases `選んでください`, `教えてください`, `返信してください`, `決めてください`; or the mark `🚦`.
2. If an indicator is present, the plugin asks the session's model to classify the text into one of three categories: a question answerable by choosing from options, a question requiring a free-form answer, or no question for the user.
3. Only for the first category, it submits a short English message (starting with `[MOD ask-choice]`) instructing the model to re-ask with `AskUserQuestion`.

It does nothing if the turn already used `AskUserQuestion`, in non-interactive runs (`claude -p`), for subagent replies, for turns that ended in an abort or error, or on the turn immediately following a bounce (one bounce per question).

**Cost:** One classification call for each reply with a question indicator, plus one extra model turn for each bounce. Replies without an indicator incur no cost.

The submitted message is visible on screen, shown by Claude Code as a message sent by the plugin.

## What the plugin reads and what it submits

This section lists everything the plugin reads from the session and everything it puts into a prompt. Nothing is sent anywhere other than the model of the current Claude Code session, and nothing is stored.

**What it reads:** the text of the reply that just finished (`turn.complete`), the turn's end reason, whether the turn belongs to a subagent, whether the session is interactive, and whether `AskUserQuestion` was called during the turn. It does not read the user's prompts, files, or environment variables.

**What it sends to the classifier:** the last 1,500 characters of the reply, with fenced code blocks and inline code removed, together with three fixed category labels (written in Japanese in the source). This goes to the session's own model through Claude Code's `$.model.classify` API.

**What it submits as a prompt:** one fixed English message, always the same text and never containing any part of the reply or the conversation:

```
[MOD ask-choice] Your last reply left a pick-one question for the user in prose.
Re-ask it with AskUserQuestion: put the deciding facts and your recommendation in the question text and the option descriptions.
Do not repeat the report body. If the question truly needs a free-form answer, say so in one line.
```

## Tests

```
claude plugin validate .
claude plugin test .
```

## Notes

- Written with AI assistance (Claude Code).
- This plugin comes from the author's own setup. The source comments and test names are in Japanese.
- Companion plugin: [claude-clip-command](https://github.com/i-noma-ru/claude-clip-command). The two are independent.

## License

MIT. See [LICENSE](LICENSE).
