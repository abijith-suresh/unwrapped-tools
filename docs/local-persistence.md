# Local Persistence Contract

`unwrapped.tools` is local-only and privacy-first.

## Persists locally by default

- Theme preference under `unwrapped-theme`
- Last visited tool route for installed sessions under `unwrapped-last-tool-route`
- Diff view preferences under `unwrapped-tool-session:diff`

These values stay in the browser's local storage on the current device. They are never uploaded.

## Does not persist by default

- JWT input and decoded payloads
- Hash input text and generated digests
- UUID lists and copy actions
- Timestamp inputs and derived values
- Base64 input and output
- JSON formatter input and formatted output
- Regex patterns, flags, and test text
- Diff input contents and imported file contents

Sensitive tool inputs are intentionally ephemeral unless a tool explicitly documents otherwise.

## Clear path

The shell settings modal exposes a `Clear local data` action. That clears all registered persisted browser state and resets the theme to the default palette.
