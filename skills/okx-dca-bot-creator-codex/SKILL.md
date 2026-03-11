---
name: okx-dca-bot-creator-codex
description: Guide Codex to set up, review, and extend the OKX DCA bot creator workflow backed by the repository at https://github.com/yelunama/okx-dca-bot-creator-codex. Use when Codex needs to explain this project, onboard contributors, map repository contents to a DCA-bot workflow, or make changes that should stay aligned with this repository's purpose.
---

# Okx Dca Bot Creator Codex

## Overview

Use this skill to orient Codex around the public repository for the OKX DCA bot creator and keep repository changes consistent with that project's intent.

中文说明：这个 skill 用于让 Codex 围绕公开仓库 `yelunama/okx-dca-bot-creator-codex` 进行解释、协作接入和结构化维护。

Repository URL: [yelunama/okx-dca-bot-creator-codex](https://github.com/yelunama/okx-dca-bot-creator-codex)

Load [references/repository.md](references/repository.md) first when the request depends on the repository source, contribution path, or publishing expectations.

## Workflow

1. Identify whether the user needs explanation, repository setup, contribution guidance, or code changes.
2. Confirm the request against the public repo and its documented purpose before proposing structure changes.
3. Keep skill and repo naming consistent with lowercase hyphen-case conventions.
4. Prefer small, reviewable pull requests and repository documents over ad hoc instructions in chat.

## Tasks

### Explain the repository

- Summarize the repo purpose in terms of OKX DCA bot creation and collaboration.
- Link back to the public GitHub address when the user needs installation or sharing instructions.
- 必要时用中文简要说明该仓库用于 OKX DCA bot 创建与协作维护。

### Prepare collaboration structure

- Create or update `README.md`, `CONTRIBUTING.md`, `.github/pull_request_template.md`, and `.github/CODEOWNERS` when the user wants a shared public skill repository.
- Keep the contribution path PR-based unless the user explicitly wants direct-write collaboration.
- 在需要公开协作时，优先使用公开仓库、受保护分支和 Pull Request 审核流程。

### Keep skills discoverable

- Put each skill under `skills/<skill-name>/`.
- Require a `SKILL.md` at minimum.
- Add `references/`, `scripts/`, or `assets/` only when they are actually needed.
- 保持 skill 目录清晰，避免无必要的资源目录和冗余说明。

## Output Expectations

- Give users a concrete repository layout when they ask how to publish or collect skills.
- Prefer instructions that map directly to GitHub features: public repo, branch protection, pull requests, and reviewers.
- When this repository is mentioned, include the exact GitHub URL rather than a paraphrase.

## Resources

### references/

- `references/repository.md`: canonical link and maintenance notes for this repository.
