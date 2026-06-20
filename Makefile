# ─── Personal Gym ────────────────────────────────────────────────────────────
# Root project: the PWA workout app.
# Promo video lives in promo-video/ (see video:* targets).

.PHONY: dev build preview help
.PHONY: test test-watch test-e2e test-e2e-full test-e2e-ui test-e2e-headed test-all
.PHONY: video-dev video-render video-screenshots video-still

# ─── App ──────────────────────────────────────────────────────────────────────

## dev       — Start the Vite dev server (http://localhost:5173)
dev:
	npm run dev

## build     — Build for production (output: dist/)
build:
	npm run build

## preview   — Preview the production build (http://localhost:4173)
preview:
	npm run preview

# ─── Tests ────────────────────────────────────────────────────────────────────

## test      — Run unit tests (Vitest)
test:
	npm test

## test-watch — Run unit tests in watch mode
test-watch:
	npm run test:watch

## test-e2e  — Run e2e tests against an already-running preview
test-e2e:
	npm run test:e2e

## test-e2e-full — Build + serve + e2e tests + HTML report
test-e2e-full:
	npm run test:e2e:full

## test-e2e-ui — Open Playwright's interactive test runner
test-e2e-ui:
	npm run test:e2e:ui

## test-all  — Unit tests + full e2e flow
test-all:
	npm run test:all

# ─── Promo Video (promo-video/) ───────────────────────────────────────────────

## video-dev — Start Remotion Studio for the product video
video-dev:
	cd promo-video && npm run dev

## video-render — Render the full product video (output: promo-video/out/)
video-render:
	cd promo-video && npx remotion render ProductVideo --output=out/product-video.mp4

## video-screenshots — Capture app screenshots via Playwright (requires app running on :4173)
video-screenshots:
	cd promo-video && DEV_URL="http://localhost:4173/personal-gym" node capture-screenshots.mjs

## video-still — Render a single frame for quick verification (usage: make video-still frame=60)
video-still:
	cd promo-video && npx remotion still ProductVideo --frame=$(or $(frame),60) --output=/tmp/promo-still.png

# ─── Help ─────────────────────────────────────────────────────────────────────

## help      — Show this help message
help:
	@printf '\033[1mPersonal Gym - available targets\033[0m\n'
	@printf '\033[2m(append \033[1mframe=N\033[2m for video-still)\033[0m\n\n'
	@awk -F '## ' '/^## / {split($$2, a, " — "); printf "  \033[36m%-22s\033[0m %s\n", a[1], a[2]}' $(MAKEFILE_LIST)
	@echo ''
