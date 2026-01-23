# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025.13.0](https://github.com/FutureAtoms/FutureAtoms-website/compare/v2025.12.1...v2025.13.0) (2026-01-23)


### Features

* add bug report API, admin panel rebuild, and feature request improvements ([ce7338b](https://github.com/FutureAtoms/FutureAtoms-website/commit/ce7338bfa5bab9e17e0f765b2ce4f93b38ef1f04))
* Add ChipOS .deb files with Git LFS tracking ([21e080b](https://github.com/FutureAtoms/FutureAtoms-website/commit/21e080bc277deb3084f06c5dcb35e85c40dbe79e))
* Add Claude commands download button to docs ([db2e5f8](https://github.com/FutureAtoms/FutureAtoms-website/commit/db2e5f8da0cb7b7093e7c450655670a455f8f6b8))
* add deployment traceability and changelog automation ([6faa178](https://github.com/FutureAtoms/FutureAtoms-website/commit/6faa1787ccf67fafe35e0f4f2af14a6487fa63de))
* add feature pages for all ventures ([23b645d](https://github.com/FutureAtoms/FutureAtoms-website/commit/23b645da1f613eafc7c7ec90b5609600fc6c5aae))
* add feature request categorization and Refine admin panel ([d32768d](https://github.com/FutureAtoms/FutureAtoms-website/commit/d32768d3bea2bb9b777eba9cc4a3770cd8a023ce))
* Add LFS verification to deploy scripts ([d22b683](https://github.com/FutureAtoms/FutureAtoms-website/commit/d22b683c9547701890da12ee1f5f0706ff32ca40))
* add optimized assets, scripts, and UI improvements ([b210484](https://github.com/FutureAtoms/FutureAtoms-website/commit/b210484674f23be54ced8f9b20c3b1b96d693ba1))
* Add product logos to BevyBeats, Yuj, Zaphy, and Agentic pages ([e613406](https://github.com/FutureAtoms/FutureAtoms-website/commit/e6134069d97e2e6cc403e680a784b546abb569dd))
* **careers:** add premium careers page with Supabase and micro-interactions ([c6d51a0](https://github.com/FutureAtoms/FutureAtoms-website/commit/c6d51a078ea0cb6e0135ecd6f36605766e64848d))
* **ux:** add retention psychology improvements to landing page ([3eb89ca](https://github.com/FutureAtoms/FutureAtoms-website/commit/3eb89ca77a1597bef64bde8036d0e7b25b50941e))


### Bug Fixes

* add write permissions for deployment tag creation ([4dcd949](https://github.com/FutureAtoms/FutureAtoms-website/commit/4dcd949061bbaac5e8cab70fed2d80ecbda8670e))
* Include axe.md in claude commands zip ([f99cc14](https://github.com/FutureAtoms/FutureAtoms-website/commit/f99cc14669de1f9affbb80bf18c269e444ff3c76))
* Link LISTEN NOW button to www.bevybeats.com ([2a4ef76](https://github.com/FutureAtoms/FutureAtoms-website/commit/2a4ef7617ef6504d34749c360b3e48382146ecb2))
* Link START CREATING button to www.bevybeats.com ([d1c8468](https://github.com/FutureAtoms/FutureAtoms-website/commit/d1c84686170dd06d4749b5162e4ac5b00a0f4041))
* resolve 503 error for .deb downloads and disable macOS button ([ebb76e3](https://github.com/FutureAtoms/FutureAtoms-website/commit/ebb76e3fcdbe4a26eb0d5f07b8c843762f1296b0))
* Skip .deb file test in CI (binary not in repo) ([0c369d6](https://github.com/FutureAtoms/FutureAtoms-website/commit/0c369d6ba6c99a81700bb43ea282df7823b7dbe4))
* update ChipOS deb to latest v1.0.0 build ([b5a50de](https://github.com/FutureAtoms/FutureAtoms-website/commit/b5a50deabbfbf8a564c0c967bc600f08aa2d07c6))
* Update CI workflow and fix placeholder links ([e189257](https://github.com/FutureAtoms/FutureAtoms-website/commit/e189257e6b4d9fd760f22b36b9eaaca55a8d16e9))
* use GitHub Releases for Linux .deb download ([74f0e38](https://github.com/FutureAtoms/FutureAtoms-website/commit/74f0e38ebdca1e41e19e5cb8855d3dd10c17860f))


### Performance Improvements

* implement Three.js performance optimization system ([ee3ce25](https://github.com/FutureAtoms/FutureAtoms-website/commit/ee3ce25c3703004e0caf571312b5f94c35f2b716))

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
