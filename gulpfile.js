const { dest, parallel, src, watch } = require("gulp");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const PluginError = require("plugin-error");
const through = require("through2");
const typescript = require("gulp-typescript");

sass.compiler = require("sass");

const appTSProject = typescript.createProject("tsconfig.app.json");
const cloudTSProject = typescript.createProject("tsconfig.cloud.json");

const buildWXSS = () =>
  src("app/**/*.scss")
    .pipe(
      sass({
        outputStyle: "expanded",
        // hack for remaining '@import'
        importer: (url, _prev, done) => {
          if (url.includes(".css")) return null;
          done({ contents: `@import "${url}.css"` });
        },
      }).on("error", sass.logError)
    )
    .pipe(rename({ extname: ".wxss" }))
    .pipe(
      through.obj(function (file, enc, cb) {
        if (file.isNull()) {
          this.push(file);

          return cb();
        }

        if (file.isStream()) {
          this.emit(
            "error",
            new PluginError("Sass", "Streaming not supported")
          );

          return cb();
        }

        const content = file.contents
          .toString()
          .replace(/@import url\((.*?)\.css\)/gu, '@import "$1.wxss"');

        file.contents = Buffer.from(content);

        this.push(file);

        cb();
      })
    )
    .pipe(dest("dist/app"));

const moveAppFiles = () =>
  src("app/**/*.{wxml,wxs,json,svg,png}").pipe(dest("dist/app"));

const moveCloudFiles = () =>
  src("cloud/**/*.{wxml,wxs,json,svg,png}").pipe(dest("dist/cloud"));

const watchWXSS = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildWXSS);

const buildAppTypesciprt = () =>
  appTSProject.src().pipe(appTSProject()).pipe(dest("dist/app"));

const buildCloudTypesciprt = () =>
  cloudTSProject.src().pipe(cloudTSProject()).pipe(dest("dist/cloud"));

const watchAppTypescript = () => watch("app/**/*.ts", buildAppTypesciprt);

const watchCloudTypescript = () => watch("cloud/**/*.ts", buildCloudTypesciprt);

const watchAppFiles = () =>
  watch("app/**/*.{wxml,wxs,json,svg,png}", moveAppFiles);
const watchCloudFiles = () =>
  watch("cloud/**/*.{wxml,wxs,json,svg,png}", moveCloudFiles);

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

exports.build = build;
exports.buildApp = buildApp;
exports.buildCloud = buildCloud;

exports.default = build;
