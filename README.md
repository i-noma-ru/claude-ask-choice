# claude-ask-choice

A small plugin ("mod") for Claude Code's terminal UI. When a reply ends with a choice-based question written in plain text, it prompts the model to re-ask it with the `AskUserQuestion` tool, so the user can select an option instead of typing.

日本語の説明は [README.ja.md](README.ja.md) にあります。

In-app messages are in Japanese.

## Status

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

To load a clone in every session, place this folder inside a directory listed in the `CLAUDE_CODE_PLUGIN_DIRS` environment variable. That variable worked in 2.1.288 but does not appear in `claude --help`, so treat it as subject to change.

## How it works

At the end of each turn, the plugin inspects the end of the reply (the last 1,500 characters, with code blocks and inline code removed).

1. If the text shows no sign of a question, nothing happens. Indicators include: a line ending in `?` / `？` or the Japanese endings `ですか`, `ますか`, `でしょうか`, `ましょうか`; the phrases `選んでください`, `教えてください`, `返信してください`, `決めてください`; or the mark `🚦`.
2. If an indicator is present, the plugin asks the session's model to classify the text into one of three categories: a question answerable by choosing from options, a question requiring a free-form answer, or no question for the user.
3. Only for the first category, it submits a short English message (starting with `[MOD ask-choice]`) instructing the model to re-ask with `AskUserQuestion`.

It does nothing if the turn already used `AskUserQuestion`, in non-interactive runs (`claude -p`), for subagent replies, for turns that ended in an abort or error, or on the turn immediately following a bounce (one bounce per question).

**Cost:** One classification call for each reply with a question indicator, plus one extra model turn for each bounce. Replies without an indicator incur no cost.

The submitted message is visible on screen, shown by Claude Code as a message sent by the plugin.

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
