var gulp = require('gulp');
var pug = require('gulp-pug'); //pug模板
var sass = require('gulp-sass'); //sass转换
var rename = require('gulp-rename'); //重命名文件
var inlinesource = require('gulp-inline') //外联转内联形式
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create(); //微服务器
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var es = require('event-stream');
var postcss = require('gulp-postcss');
var px2rem = require('postcss-px2rem');
var cleanCSS = require('gulp-clean-css');
var gulpSequence = require('gulp-sequence');
var config = require('./config/config');
var clean = require('gulp-clean');
var htmlminify = require("gulp-html-minify");

gulp.task('dev', gulpSequence('clean', ['pug', 'sass', 'scripts', 'copy-img', 'copy-lib'], 'autoprefixer', 'htmlmini'));
gulp.task('prod', gulpSequence('clean', ['pug', 'sass', 'scripts', 'copy-img', 'copy-lib'], 'autoprefixer', 'htmlmini', 'inlinesource'));


gulp.task('pug', () => {
    gulp.src('./template/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('./dist'))
})

// sass处理
gulp.task('sass', function () {
    return gulp
        .src('src/sass/*.scss')
        .pipe(sass({
            errLogToConsole: true,
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(gulp.dest('dist/css'));
})

// 外联转内联
gulp.task('inlinesource', () => {
    gulp.src('dist/*.html')
        .pipe(inlinesource({
            base: '',
            // js: uglify,
            // css: [minifyCss, autoprefixer({ browsers: ['ios 5', 'android 2.3'] })],
            disabledTypes: config.inlineModel.exclude
        }))
        .pipe(gulp.dest('dist/'));
});

//添加样式前缀
//转rem
gulp.task('autoprefixer', function () {
    var processors = [px2rem({
        remUnit: Math.floor(config.remConf.radio / 10)
    })];
    return gulp.src('dist/css/*.css')
        .pipe(autoprefixer({
            browsers: config.autoprefixer,
            cascade: false
        }))
        .pipe(postcss(processors))
        .pipe(cleanCSS({
            debug: true
        }, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        // .pipe(rename({
        //     extname: '.min.css'
        // }))
        .pipe(gulp.dest('dist/css'));
});

// ts => js
// ts转js
// 压缩混淆
gulp.task('scripts', function () {

    var tasks = config.entryTsFiles.map(function (entry) {
        var fileNameArr = entry.split('/');
        var fileName = fileNameArr[fileNameArr.length - 1];
        return browserify({
                basedir: '.',
                debug: true,
                entries: [entry],
                cache: {},
                packageCache: {}
            })
            .plugin(tsify)
            .bundle()
            .pipe(source(fileName))
            .pipe(buffer())
            .pipe(rename({
                extname: '.bundle.js'
            }))
            .pipe(sourcemaps.init({
                loadMaps: true
            }))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest("dist/js"));
    });

    return es.merge.apply(null, tasks);
});

gulp.task('copy-img', function () {
    return gulp.src(['src/img/**'])
        .pipe(gulp.dest("dist/img"));
});

gulp.task('copy-lib', function () {
    return gulp.src(['src/lib/**'])
        .pipe(gulp.dest("dist/lib"));
});

gulp.task('clean', function () {
    return gulp.src('dist/', {
            read: false
        })
        .pipe(clean())
})

gulp.task('htmlmini', function () {
    var options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        minfyJS: true, //压缩JS
        minfyCss: true, //压缩CSS
    };
    return gulp.src('dist/*.html')
        .pipe(htmlminify(options))
        .pipe(gulp.dest('dist/'))
})

gulp.task('default', ['dev'], () => {
    var files = [
        'dist/*.html',
        'dist/css/*.css',
        'src/ts/**/*.ts',
        'src/img/**',
        'template/*.pug'
    ]
    browserSync.init(files, {
        server: {
            baseDir: config.startHtml.base,
            directory: true,
            //middleware: mock.data()
        },
        open: 'external',
        startPath: config.startHtml.path
    });

    // 监听编译文件
    gulp.watch('template/**/*.pug', () => {
        gulpSequence('pug')(function (err) {
            if (err) console.log(err)
        })
    }).on('change', browserSync.reload);
    gulp.watch("src/ts/**/*.ts", () => {
        gulpSequence('scripts')(function (err) {
            if (err) console.log(err)
        })
    });
    gulp.watch("src/sass/**/*.scss", ['sass']);
    gulp.watch("src/img/**", ['copy-img']);
    gulp.watch("src/lib/**", ['copy-lib']);
    gulp.watch("dist/css/*.css", () => {
        gulpSequence('autoprefixer')(function (err) {
            if (err) console.log(err)
        })
    });
})