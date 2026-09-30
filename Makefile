.PHONY: install bootstrap-local smoke status demo-golden-path demo-drift demo-failure e2e verify clean-local test lint typecheck public-demo

NODE24_BIN := $(shell if [ -x /opt/homebrew/opt/node@24/bin/node ]; then echo /opt/homebrew/opt/node@24/bin; fi)
ifneq ($(NODE24_BIN),)
export PATH := $(NODE24_BIN):$(PATH)
endif

install:
	corepack enable
	corepack yarn install --immutable
	./scripts/install-python-tools.sh

bootstrap-local: install
	./scripts/start-local.sh
	./scripts/wait-for-backstage.sh

smoke:
	./scripts/smoke.sh

status:
	./scripts/status.sh

demo-golden-path:
	./scripts/demo-golden-path.sh

demo-drift:
	./scripts/demo-drift.sh

demo-failure:
	./scripts/demo-failure.sh

e2e:
	corepack yarn test:e2e --project=app

test:
	corepack yarn test:all --runInBand

lint:
	corepack yarn lint:all

verify:
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	.local/tools-venv/bin/python -m pytest -q
	.local/tools-venv/bin/python -m ruff check tests

typecheck:
	corepack yarn tsc:full

clean-local:
	./scripts/clean-local.sh

public-demo:
	./scripts/start-public-demo.sh
