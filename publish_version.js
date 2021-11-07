const packageJsonVersion = require('./package.json').version;
const { spawn } = require("child_process");



const project = process.argv[2].trim();


if (packageJsonVersion.includes('rc')) {
    publishVersion('next');
} else if (packageJsonVersion.includes('alpha')) {
    publishVersion('alpha');
} else {
    publishVersion('latest');
}

function publishVersion(tag) {

    let ls = null;
    if (project === "vscode")
        ls = spawn('npx', ['vsce', 'publish', packageJsonVersion]);
    else
        ls = spawn('yarn', ['publish', '--tag=' + tag, '--new-version=' + packageJsonVersion]);

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