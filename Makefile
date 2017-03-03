.PHONY: docs

docs: *.md
	rm -rf docs
	sphinx-build -a . docs
