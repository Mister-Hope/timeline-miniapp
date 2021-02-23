const { dest, parallel, src, watch } = require("gulp");
const rename = require("gulp-rename");
const { sassSync } = require("@mr-hope/gulp-sass");
const PluginError = require("plugin-error");
const typescript = require("gulp-typescript");
const { Transform } = require("stream");

const appTSProject = typescript.createProject("tsconfig.app.json");
const cloudTSProject = typescript.createProject("tsconfig.cloud.json");

const buildWXSS = () =>
  src("app/**/*.scss")
    .pipe(
      sassSync({
        // use `@` as hack for remaining '@import'
        importer: (url) => {
          if (url.includes(".css")) return null;

          return { contents: `@import "${url}.css"` };
        },
      }).on("error", sassSync.logError)
    )
    .pipe(rename({ extname: ".wxss" }))
    .pipe(
      new Transform({
        objectMode: true,
        transform(chunk, _enc, callback) {
          if (chunk.isNull()) {
            this.push(chunk);

            return callback();
          }

          if (chunk.isStream()) {
            this.emit(
              "error",
              new PluginError("Sass", "Streaming not supported")
            );

            return callback();
          }

          const content = chunk.contents
            .toString()
            .replace(/@import "@(.*?)\.css"/gu, '@import "$1.wxss"');

          chunk.contents = Buffer.from(content);

          this.push(chunk);

          callback();
        },
      })
    )
    .pipe(dest("dist/app"));

const moveAppFiles = () =>
  src("app/**/*.{wxml,wxs,json,svg,png,webp}").pipe(dest("dist/app"));

const moveCloudFiles = () => src("cloud/**/*.json").pipe(dest("dist/cloud"));

const watchWXSS = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildWXSS);

const buildAppTypesciprt = () =>
  appTSProject.src().pipe(appTSProject()).pipe(dest("dist/app"));

const buildCloudTypesciprt = () =>
  cloudTSProject.src().pipe(cloudTSProject()).pipe(dest("dist/cloud"));

const watchAppTypescript = () =>
  watch("app/**/*.ts", { ignoreInitial: false }, buildAppTypesciprt);

const watchCloudTypescript = () =>
  watch("cloud/**/*.ts", { ignoreInitial: false }, buildCloudTypesciprt);

const watchAppFiles = () =>
  watch(
    "app/**/*.{wxml,wxs,json,svg,png,webp}",
    { ignoreInitial: false },
    moveAppFiles
  );
const watchCloudFiles = () =>
  watch(
    "cloud/**/*.{wxml,wxs,json,svg,png}",
    { ignoreInitial: false },
    moveCloudFiles
  );

const watchApp = parallel(watchWXSS, watchAppTypescript, watchAppFiles);

const watchCloud = parallel(watchCloudTypescript, watchCloudFiles);

const watchCommand = parallel(
  watchWXSS,
  watchAppTypescript,
  watchCloudTypescript,
  watchAppFiles,
  watchCloudFiles
);

const buildApp = parallel(buildWXSS, buildAppTypesciprt, moveAppFiles);

const buildCloud = parallel(
  buildCloudTypesciprt,

  moveCloudFiles
);

const build = parallel(
  buildWXSS,
  buildAppTypesciprt,
  buildCloudTypesciprt,
  moveAppFiles,
  moveCloudFiles
);

exports.watchApp = watchApp;
exports.watchCloud = watchCloud;
exports.watch = watchCommand;

exports.buildApp = buildApp;
exports.buildCloud = buildCloud;
exports.build = build;

exports.default = build;
