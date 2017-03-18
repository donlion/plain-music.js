distdir=dist
main=src/index.js
sources=src/index.js src/plain-music-parser.js
packed=dist/plain-music.pack.js
minified=dist/plain-music.min.js

distributable: $(minified)

$(minified): $(packed) $(distdir)
	./node_modules/uglify-js/bin/uglifyjs $(packed) -o $(minified)

$(packed): $(sources) $(distdir)
	./node_modules/webpack/bin/webpack.js $(main) $(packed) 

$(distdir):
	mkdir $(distdir)

.PHONY: clean publish test

publish: distributable
	npm publish

test:
	./node_modules/mocha/bin/mocha "test/*.js"

clean:
	rm -rf dist
