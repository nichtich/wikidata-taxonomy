.PHONY: docs test style

docs: *.md
	rm -rf docs
	sphinx-build -a . docs

style:
	./node_modules/standard/bin/cmd.js --fix *.js lib/*.js

test:
	npm test
