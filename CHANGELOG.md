# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Deployment traceability with git tags after each deployment
- Build info injection (`public/build-info.json`) with commit hash, version, and timestamp
- Pre-push hook to prevent pushing uncommitted changes
- Conventional commits enforcement with commitlint
- Release-please automation for changelog generation and versioning

### Changed
- Enhanced CI/CD workflow with git state verification
- Improved deployment pipeline with automatic tagging

---

*Note: This changelog is automatically maintained by [release-please](https://github.com/googleapis/release-please). Future entries will be auto-generated from conventional commit messages.*
