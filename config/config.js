module.exports = {
    startHtml: {
        base: './dist',
        path: '/index.html'
    },
    entryTsFiles: [
        './src/ts/index.ts'
    ],
    remConf: {
        radio: 750
    },
    autoprefixer: ['ios 5', 'android 2.3'],
    inlineModel: {
        exclude: ['svg', 'img', 'js']
    }
}