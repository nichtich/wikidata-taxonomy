.PHONY: docs test

docs: *.md
	rm -rf docs
	sphinx-build -a . docs

test:
	npm test
