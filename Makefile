docs: *.md
	rm -rf docs
	sphinx-build -a . docs

style:
	./node_modules/standard/bin/cmd.js --fix *.js lib/*.js

dist:
	npm run dist

test:
	npm test
