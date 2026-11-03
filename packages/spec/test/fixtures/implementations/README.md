The CLI and MCP tests read implementations through this config, not the repository's
`spec.config.json`, so adding an implementation to the repository does not change their output.
It points at the real content and the real web and React implementation files.
`missing-folder.config.json` names a folder that does not exist.
