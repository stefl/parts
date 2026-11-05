// Conventional commits. CI lints the PR title: squash-merge makes it main's
// commit subject.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
  },
};
