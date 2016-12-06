PATH ?= $(shell npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/thingamajig.js
browser/thingamajig.js : lib/thingamajig/browser.js
	@mkdir -p $(@D)
	@browserify -o $@ $<

website : browser
	git clone --branch gh-pages $(shell git remote get-url origin) website
	cp browser/thingamajig.js website/thingamajig.js
	cd website && git add thingamajig.js
	cd website && git commit -m "$(shell git log -1 --pretty=%B)"

website-release : website
	cd website && git push

test : $(addsuffix .test, $(basename $(TEST)))
	@echo "Success, all tests passed."

%.test : %.js
	@$(NODE) $<

clean :
	rm -rf website

.PHONY : clean test %.test
