.PHONY: install bootstrap-local smoke demo-golden-path demo-drift demo-failure e2e verify clean-local test lint typecheck

NODE24_BIN := $(shell if [ -x /opt/homebrew/opt/node@24/bin/node ]; then echo /opt/homebrew/opt/node@24/bin; fi)
ifneq ($(NODE24_BIN),)
export PATH := $(NODE24_BIN):$(PATH)
endif

install:
	corepack enable
	yarn install --immutable

bootstrap-local: install
	./scripts/start-local.sh
	./scripts/wait-for-backstage.sh

smoke:
	./scripts/smoke.sh

demo-golden-path:
	./scripts/demo-golden-path.sh

demo-drift:
	./scripts/demo-drift.sh

demo-failure:
	./scripts/demo-failure.sh

e2e:
	yarn test:e2e --project=app

test:
	yarn test:all --runInBand

lint:
	yarn lint:all

verify:
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	python3 -m pytest -q

typecheck:
	yarn tsc:full

clean-local:
	./scripts/clean-local.sh
