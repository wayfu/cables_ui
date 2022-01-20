const gulp = require("gulp");
const jshint = require("gulp-jshint");
const sass = require("gulp-sass-no-nodesass");
sass.compiler = require("sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const svgcss = require("gulp-svg-css");
const svgmin = require("gulp-svgmin");
const fs = require("fs");
const replace = require("gulp-replace");
const autoprefixer = require("gulp-autoprefixer");
const merge = require("merge-stream");
const getRepoInfo = require("git-repo-info");
const footer = require("gulp-footer");
const env = require("gulp-util").env;
const webpack = require("webpack-stream");
const compiler = require("webpack");
const webpackConfig = require("./webpack.config");

const isLiveBuild = env.live || false;

let buildInfo = getBuildInfo();

function _lint(done)
{
    return gulp
        .src("src/**/*.js")
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
}

function _scripts_libs_ui(done)
{
    let task = gulp.src(["libs/ui/*.js"]);
    if (isLiveBuild) task = task.pipe(sourcemaps.init());
    task = task.pipe(concat("libs.ui.js")).pipe(gulp.dest("dist/js")).pipe(rename("libs.ui.min.js"));
    if (isLiveBuild) task = task.pipe(uglify()).pipe(sourcemaps.write("./"));
    return task.pipe(gulp.dest("dist/js"));
}

function _scripts_lazyload_ui(done)
{
    return gulp.src(["libs/lazyload/**"]).pipe(gulp.dest("dist/lazyload"));
}

function _scripts_talkerapi(done)
{
    let task = gulp.src(["src-talkerapi/*.js"]);
    if (isLiveBuild) task = task.pipe(sourcemaps.init());
    task = task.pipe(concat("talkerapi.js")).pipe(gulp.dest("dist/js")).pipe(rename("talkerapi.js"));
    if (isLiveBuild) task = task.pipe(uglify()).pipe(sourcemaps.write("./"));
    return task.pipe(gulp.dest("dist/js"));
}

function _scripts_core()
{
    return gulp
        .src(["../cables/build/**/*.*", "!../cables/build/buildInfo.json", "!../cables/build/libs/*"])
        .pipe(gulp.dest("dist/js/"));
}

function _scripts_ops(done)
{
    let task = gulp.src(["src/ops/*.js"]);
    if (isLiveBuild) task = task.pipe(sourcemaps.init());
    task = task.pipe(concat("cables.ops.max.js")).pipe(gulp.dest("dist/js")).pipe(rename("cables.ops.min.js"));
    if (isLiveBuild) task = task.pipe(uglify());
    if (isLiveBuild) task = task.pipe(sourcemaps.write("./"));
    return task.pipe(gulp.dest("dist/js"));
}

function _scripts_ui_webpack(done)
{
    return gulp.src(["src/ui/index.js"])
        .pipe(
            webpack(
                {
                    "config": webpackConfig(isLiveBuild, false),
                },
                compiler,
                (err, stats) =>
                {
                    if (err) throw err;
                    if (stats.hasErrors())
                    {
                        return done(new Error(stats.compilation.errors.join("\n")));
                    }
                    done();
                }
            )
        )
        .pipe(gulp.dest("dist/js"))
        .on("error", (err) =>
        {
            console.error("WEBPACK ERROR", err);
        });
}

function _append_build_info(done)
{
    return gulp
        .src(["dist/js/cablesuiold.max.js", "dist/js/cablesuiold.min.js"])
        .pipe(footer("CABLES.UI.build = " + JSON.stringify(buildInfo) + ";"))
        .pipe(gulp.dest("dist/js/"));
}

function getBuildInfo()
{
    const git = getRepoInfo();
    const date = new Date();
    return {
        "timestamp": date.getTime(),
        "created": date.toISOString(),
        "git": {
            "branch": git.branch,
            "commit": git.sha,
            "date": git.committerDate,
            "message": git.commitMessage
        }
    };
}

function _update_buildInfo(done)
{
    buildInfo = getBuildInfo();
    fs.writeFileSync("dist/buildInfo.json", JSON.stringify(buildInfo));
    done();
}

function _html_ui(done)
{
    return gulp
        .src(["html/ui/header.html", "html/ui/templates/*.html", "html/ui/footer.html"])
        .pipe(concat("index.html"))
        .pipe(gulp.dest("dist/"));
}

function _sass(done)
{
    return gulp
        .src("scss/style-dark.scss")
        .pipe(sass())
        .pipe(rename("style-dark.css"))
        .pipe(
            autoprefixer({
                "cascade": false,
            })
        )
        .pipe(gulp.dest("dist/css"));
}

function _svgcss(done)
{
    return gulp
        .src("icons/**/*.svg")
        .pipe(svgmin())
        .pipe(
            svgcss({
                "fileName": "icons",
                "cssPrefix": "icon-",
                "addSize": false,
            })
        )
        .pipe(replace("background-image", "mask"))
        .pipe(
            autoprefixer({
                "cascade": false,
            })
        )
        .pipe(rename("svgicons.scss"))
        .pipe(gulp.dest("scss/"))
        .pipe(gulp.dest("../cables_api/scss/"));
}

function _electronapp(done)
{
    const copydist = gulp.src("dist/**/*.*").pipe(gulp.dest("dist-electron/"));
    const electronsrc = gulp.src("src-electron/**/*.*").pipe(gulp.dest("dist-electron/"));
    return merge(copydist, electronsrc);
}

function _watch(done)
{
    gulp.watch(["src/ui/**/*.js", "src/ui/*.js", "src/ui/**/*.json", "src/ui/**/*.frag", "src/ui/**/*.vert"], { "usePolling": true }, gulp.series(_update_buildInfo, _scripts_ui_webpack, _append_build_info));
    gulp.watch(["scss/**/*.scss", "scss/*.scss"], { "usePolling": true }, gulp.series(_update_buildInfo, _sass, _append_build_info));
    gulp.watch(["html/**/*.html", "html/*.html"], { "usePolling": true }, gulp.series(_update_buildInfo, _html_ui, _append_build_info));
    gulp.watch("src-talkerapi/**/*", { "usePolling": true }, gulp.series(_update_buildInfo, _scripts_talkerapi, _append_build_info));
    done();
}

function _electron_watch(done)
{
    gulp.watch(["src/ui/**/*.js", "src/ui/*.js", "src/ui/**/*.json", "src/ui/**/*.frag", "src/ui/**/*.vert"], gulp.series(_update_buildInfo, _scripts_ui_webpack, _append_build_info));
    gulp.watch(["scss/**/*.scss", "scss/*.scss"], gulp.series(_update_buildInfo, _sass, _append_build_info));
    gulp.watch(["html/**/*.html", "html/*.html"], gulp.series(_update_buildInfo, _html_ui, _append_build_info));
    gulp.watch("src-electron/**/*", gulp.series(_update_buildInfo, _append_build_info, _electronapp));
    done();
}

/*
 * -------------------------------------------------------------------------------------------
 * MAIN TASKS
 * -------------------------------------------------------------------------------------------
 */

/**
 * Default Task, for development
 * Run "gulp"
 */
gulp.task("default", gulp.series(
    _update_buildInfo,
    // _scripts_ui,
    _scripts_ui_webpack,
    _append_build_info,
    _html_ui,
    _scripts_core,
    _scripts_libs_ui,
    _scripts_lazyload_ui,
    _scripts_ops,
    _sass,
    _svgcss,
    _scripts_talkerapi,
    _watch
));

/**
 * Is this still used?
 * Run "gulp build"
 */
gulp.task("build", gulp.series(
    _update_buildInfo,
    _svgcss,
    _html_ui,
    _scripts_libs_ui,
    _scripts_lazyload_ui,
    _scripts_ops,
    _scripts_core,
    // _scripts_ui,
    _scripts_ui_webpack,
    _append_build_info,
    _scripts_talkerapi,
    _sass,
));

/**
 * Electron development
 * Run "gulp electron"
 */
gulp.task("electron", gulp.series(
    _update_buildInfo,
    _svgcss,
    // _scripts_ui,
    _scripts_ui_webpack,
    _append_build_info,
    _lint,
    _html_ui,
    _scripts_libs_ui,
    _scripts_lazyload_ui,
    _scripts_ops,
    _sass,
    _electronapp,
    _electron_watch
));

gulp.task("testui", gulp.series(
    // _scripts_ui,
    _scripts_ui_webpack
));
