#! /usr/bin/env node

require('dotenv').config();
const { Octokit } = require("@octokit/rest");
const { spawn } = require("child_process");

const octokit = new Octokit({ auth: process.env.GITHUB_PERSONAL_TOKEN });
const getBranchPath = __dirname + "/get-branch.sh";

const version = process.argv[2].trim();
const releaseBranch = 'release/' + version;

let currentBranch;
let remoteData;

createRelease();

function createRelease() {
    getCurrentBranch();
}

function getCurrentBranch() {
    var ls = spawn('sh', [getBranchPath]);
    ls.stdout.on("data", function (data) {
        currentBranch = `${data}`;
    });
    ls.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
    ls.on("error", error => {
        console.log(`error: ${error.message}`);
    });
    ls.on("close", code => {
        checkBranch();
    });
}

function checkBranch() {
    if (currentBranch.trim() == 'development') {
        bumpVersion();
    } else {
        console.log('\nRelease can only be created from development branch.\nYour current branch is', currentBranch);
    }
}

function bumpVersion() {
    var ls = spawn('yarn', ['version', '--new-version', version]);
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
        createReleaseBranch();
    });
}

function createReleaseBranch() {
    var ls = spawn('git', ['checkout', '-b', releaseBranch]);
    ls.stdout.on("data", function (data) {
        console.log(`${data}`);
    });
    ls.stderr.on("data", data => {
        console.log(`Switched to a new branch: release/${data}`);
    });
    ls.on("error", error => {
        console.log(`error: ${error.message}`);
    });
    ls.on("close", code => {
        checkRemote();
    });
}

function checkRemote() {
    var ls = spawn('git', ['remote', '-v']);

    ls.stdout.on("data", function (data) {
        remoteData = JSON.stringify(`${data}`);
    });
    ls.stderr.on("data", data => {
        console.log(`Switched to a new branch: release/${data}`);
    });
    ls.on("error", error => {
        console.log(`error: ${error.message}`);
    });
    ls.on("close", code => {
        createPR();
    });
}

function createPR() {
    if (remoteData.match(/\@([^)]+)\:/).pop() == "github.com") {
        let remoteSample = remoteData.match(/\:([^)]+)\./).pop();
        let gitVariables = remoteSample.split('/');
        let owner = gitVariables[0].trim();
        let repo = gitVariables[1].trim();
        let prTitle = 'release ' + version;
        let base = 'main';
        let head = releaseBranch;
        pushToGithub(repo, owner, prTitle, base, head);
    } else {
        createPRforGitlab();
    }
}

function pushToGithub(repo, owner, prTitle, base, head) {
    var ls = spawn('git', ['push', 'origin', releaseBranch]);
    ls.stdout.on("data", function (data) {
        console.log(`${data}`);
    });
    ls.stderr.on("data", data => {
        console.log(`/${data}`);
    });
    ls.on("error", error => {
        console.log(`error: ${error.message}`);
    });
    ls.on("close", code => {
        console.log("Pushed to Github");
        createPRforGithub(repo, owner, prTitle, base, head);
    });
}

function createPRforGithub(repo, owner, title, base, head) {
    octokit.rest.pulls.create({
        owner: owner,
        repo: repo,
        title: title,
        base: base,
        head: head,
    });
    console.log("Created PR!");
}


function createPRforGitlab() {
    var ls = spawn('git', ['push', '-o', 'merge_request.create', '-o', 'merge_request.target=master', 'origin', 'release/' + version]);
    ls.stdout.on("data", function (data) {
        console.log(`${data}`);
    });
    ls.stderr.on("data", data => {
        console.log(`/${data}`);
    });
    ls.on("error", error => {
        console.log(`error: ${error.message}`);
    });
    ls.on("close", code => {
        console.log("Created PR!");
    });
}



