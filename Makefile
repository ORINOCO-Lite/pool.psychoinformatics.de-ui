# Important directories
VUE_APP_DIR = shacl-vue
DIST_DIR = dist
PLUGIN_DIR = plugins
RUNTIME_PLUGIN_DIR = $(VUE_APP_DIR)/src/runtime-plugins

all: build

# Install vite and shacl-vue dependencies
install:
	npm install vite
	cd $(VUE_APP_DIR) && npm install

# Copy runtime plugins before build
# Build shacl-vue using top-level Vite-config
# Copy shacl-vue config to dist directory
build: clean
	cp -r $(PLUGIN_DIR) $(RUNTIME_PLUGIN_DIR)
	cd $(VUE_APP_DIR) && npm run build:app
	mv $(VUE_APP_DIR)/dist/app ./$(DIST_DIR)
	cp config.* $(DIST_DIR)/
	cp favicon.ico $(DIST_DIR)/favicon.ico
	cp *logo* $(DIST_DIR)/
	cp -r templates $(DIST_DIR)/

# Clean output
clean:
	rm -rf $(DIST_DIR)

.PHONY: install build clean deploy
