PATH ?= $(npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/thingamajig.js
browser/thingamajig.js : lib/thingamajig/browser.js
	@mkdir -p $(@D)
	@browserify -o $@ lib/thingamajig/browser/scriptexecute.js $<

test : $(addsuffix .test, $(basename $(TEST)))
	@echo "Success, all tests passed."

%.test : %.js
	@$(NODE) $<

.PHONY : test %.test
