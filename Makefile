# Important directories
VUE_APP_DIR = shacl-vue
DIST_DIR = dist

all: build

# Install vite and shacl-vue dependencies
install:
	npm install vite
	cd $(VUE_APP_DIR) && npm install

# Build shacl-vue using top-level Vite-config
# Copy shacl-vue config to dist directory
build: clean
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
