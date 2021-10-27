const packageJsonVersion = require('./package.json').version;
const { spawn } = require("child_process");

if (packageJsonVersion.includes('rc')) {
    publishVersion('next');
} else if (packageJsonVersion.includes('alpha')) {
    publishVersion('alpha');
} else {
    publishVersion('latest');
}

function publishVersion(tag) {
    var ls = spawn('yarn', ['publish', '--tag=' + tag, '--new-version=' + packageJsonVersion]);
    ls.stdout.on("data", function (data) {
        console.log(`${data}`);
    });
    ls.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
    ls.on("error", error => {
        console.log(`error: ${error.message}`);
    });
    ls.on("close", code => {
        console.log("DONE!");
    });
}