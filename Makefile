PATH ?= $(shell npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/liveflow.js
browser/liveflow.js : lib/liveflow/browser.js
	@mkdir -p $(@D)
	@browserify -o $@ $<

website : browser
	git clone --branch gh-pages $(shell git config --get remote.origin.url) website
	cp browser/liveflow.js website/liveflow.js
	cd website && git add liveflow.js
	cd website && git commit -m "$(shell git log -1 --pretty=%B)"

website-release : website
	cd website && git push

test : $(addsuffix .test, $(basename $(TEST)))
	@echo "Success, all tests passed."

%.test : %.js
	@$(NODE) $<

clean :
	rm -rf browser
	rm -rf website

.PHONY : clean test %.test
