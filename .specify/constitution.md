# Project Constitution

## Purpose

This constitution defines the governance, standards, and decision-making process for the **Minecraft Bedrock Management Platform** (MSW).

It applies to all contributors, maintainers, and automated agents working on this repository.

---

## 1. Branch Model

| Branch      | Purpose                                       | Protection                                                   |
| ----------- | --------------------------------------------- | ------------------------------------------------------------ |
| `main`      | Production-ready releases only                | Protected: PR required, 1 approving review, no direct pushes |
| `dev`       | Integration branch for all features and fixes | Protected: no deletion, PR required, 1 approving review      |
| `feat/*`    | Feature development                           | Created from `dev`, merged via PR into `dev`                 |
| `fix/*`     | Bug fixes                                     | Created from `dev`, merged via PR into `dev`                 |
| `chore/*`   | Maintenance tasks                             | Created from `dev`, merged via PR into `dev`                 |
| `release/*` | Release candidates                            | Created from `dev`, merged into `main` for release           |

**Rules:**
- No direct commits to `main` or `dev`.
- Every change must go through a Pull Request.
- `main` and `dev` cannot be deleted.
- Force push is prohibited on `main` and `dev`.

---

## 2. Contribution Process

1. Create a feature branch from `dev` (e.g., `feat/spec-kit-implement`).
2. Implement changes with conventional commit messages: `type(scope): description`.
3. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build` before pushing.
4. Open a Pull Request from your branch to `dev`.
5. After review and approval, merge into `dev`.
6. When ready for release, open a PR from `dev` to `main`.
7. Merging to `main` triggers `semantic-release` via GitHub Actions.

---

## 3. Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Optional body and footer
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Allowed scopes: `api`, `web`, `shared`, `deps`, `release`, `infra`, `docker`, `config`.

---

## 4. Code Standards

- **Language:** TypeScript (Node.js >= 24.11)
- **Formatter / Linter:** Biome (replaces Prettier/oxlint)
- **Package Manager:** pnpm (>=10), version locked in `package.json` `packageManager`
- **Type Safety:** `tsc --noEmit` must pass for all workspace packages
- **Build:** `pnpm build` must succeed for all workspace packages

---

## 5. Release Process

This project uses [semantic-release](https://semantic-release.gitbook.io/) with Conventional Commits.
- Patch releases (`1.0.1`): triggered by `fix:` commits.
- Minor releases (`1.1.0`): triggered by `feat:` commits.
- Major releases (`2.0.0`): triggered by `feat!:...` or `BREAKING CHANGE:`.

Releases are automated via GitHub Actions on push to `main`.

---

## 6. Spec-Driven Development (SDD)

This project follows Spec-Driven Development using [GitHub Spec Kit](https://github.com/github/spec-kit).
- Specifications live in `docs/` (e.g., `docs/plan-00.md`).
- Before implementing a feature, the spec must be reviewed and approved.
- Tasks are derived from specs and tracked in `.specify/tasks/`.
- Constitution and checklists live in `.specify/`.

---

## 7. Decision Making

- Technical decisions require at least one maintainer approval via PR review.
- Breaking changes to public API or configuration require discussion in an Issue before implementation.
- Security-related changes are reviewed by maintainers before merge.

---

## 8. Repository Structure

```
apps/
  core-api/   # NestJS backend API
  web-app/    # React frontend
packages/
  shared/     # Shared types, constants, API helpers
docs/
  plan-00.md  # Product specification v1.0
.specify/     # Spec Kit artifacts (constitution, tasks, plans)
storage/      # Local file storage (worlds, packs, backups)
data/         # Bedrock server runtime data
```

---

## 9. Amendments

This constitution can be amended by opening a PR that modifies `.specify/constitution.md`. The amendment requires at least one approving review from a maintainer.
