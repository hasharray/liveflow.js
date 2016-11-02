PATH ?= $(npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/thingamajig.js
browser/thingamajig.js : lib/thingamajig.js
	@mkdir -p $(@D)
	@browserify -o $@ $<

test : $(addsuffix .test, $(basename $(TEST)))
	@echo "Success, all tests passed."

%.test : %.js
	@$(NODE) $<

clean:
	rm -f browser/thingamajig.js

.PHONY : test %.test clean
