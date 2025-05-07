const fs = require("fs-extra");
const path = require("path");
const { minify } = require("html-minifier");

// Configuration
const DIST_DIR = "dist";
const SOURCE_DIR = ".";
const COPY_FILES = [
  "*.js",
  "*.css",
  "*.png",
  "*.ico",
  "*.svg",
  "data.json",
  "fonts/**/*",
  "assets/**/*",
  "vendor/**/*",
];
const EXCLUDE_FILES = ["build.js", "node_modules/**/*"];

// Create dist directory if it doesn't exist
console.log("Cleaning dist directory...");
fs.emptyDirSync(DIST_DIR);

// Process HTML file
console.log("Processing HTML files...");
const indexHtml = fs.readFileSync("index.html", "utf8");

// Update script paths for production (no minification as requested)
const updatedHtml = indexHtml
  // Update paths to node_modules if needed
  .replace(
    /\.\/node_modules\/@antikythera\/antikythera\/dist\/antikythera\.js/g,
    "./vendor/antikythera/antikythera.js"
  )
  .replace(
    /\.\/node_modules\/@antikythera\/antikythera\/dist\/css\/fonts\.css/g,
    "./vendor/antikythera/fonts.css"
  );

// Write the updated HTML to the dist directory without minification
fs.writeFileSync(path.join(DIST_DIR, "index.html"), updatedHtml);

// Copy necessary files to dist
console.log("Copying assets...");
COPY_FILES.forEach((pattern) => {
  const files = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((dirent) => {
      const fileName = dirent.name;
      const shouldExclude = EXCLUDE_FILES.some((exclude) => {
        if (exclude.includes("*")) {
          const regex = new RegExp(exclude.replace(/\*/g, ".*"));
          return regex.test(fileName);
        }
        return fileName === exclude;
      });

      if (shouldExclude) return false;

      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(fileName);
      }
      return fileName === pattern;
    })
    .map((dirent) => dirent.name);

  files.forEach((file) => {
    try {
      if (fs.statSync(path.join(SOURCE_DIR, file)).isDirectory()) {
        fs.copySync(path.join(SOURCE_DIR, file), path.join(DIST_DIR, file), {
          overwrite: true,
        });
      } else {
        fs.copySync(path.join(SOURCE_DIR, file), path.join(DIST_DIR, file), {
          overwrite: true,
        });
      }
    } catch (err) {
      console.error(`Error copying ${file}:`, err);
    }
  });
});

// Create vendor directory for Antikythera
console.log("Setting up Antikythera for production...");
const ANTIKYTHERA_DIR = path.join(DIST_DIR, "vendor", "antikythera");
fs.ensureDirSync(ANTIKYTHERA_DIR);

// Copy Antikythera files
fs.copySync(
  path.join(
    SOURCE_DIR,
    "node_modules",
    "@antikythera",
    "antikythera",
    "dist",
    "antikythera.js"
  ),
  path.join(ANTIKYTHERA_DIR, "antikythera.js")
);

fs.copySync(
  path.join(
    SOURCE_DIR,
    "node_modules",
    "@antikythera",
    "antikythera",
    "dist",
    "css",
    "fonts.css"
  ),
  path.join(ANTIKYTHERA_DIR, "fonts.css")
);

// Copy any fonts or additional resources needed by Antikythera
const ANTIKYTHERA_ASSETS = path.join(
  SOURCE_DIR,
  "node_modules",
  "@antikythera",
  "antikythera",
  "dist",
  "assets"
);
if (fs.existsSync(ANTIKYTHERA_ASSETS)) {
  fs.copySync(ANTIKYTHERA_ASSETS, path.join(ANTIKYTHERA_DIR, "assets"));
}

console.log("Build completed successfully!");
console.log(`The build files are available in the ${DIST_DIR}/ directory.`);
