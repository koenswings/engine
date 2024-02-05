#! ../../node_modules/.bin/tsx
import { strict as assert } from 'assert';
import { $, argv, chalk, cd } from 'zx';
import pack from '../package.json' assert { type: "json" };
// Define the defaults for the registry, the registry user and the git account
const defaultRegistry = "docker.io";
const defaultRegistryUser = "koenswings";
const defaultGitAccount = "koenswings";
// Configure zx
//$.verbose = false;
// Check for the help flag and print usage if help is requested
if (argv.h || argv.help) {
    console.log(`Builds the image of a service and pushes it to the registry.`);
    console.log(`Usage: build_service.ts [options] <serviceRef> [<serviceRef> ...]`);
    console.log(`with `);
    console.log(`  <serviceRef> = <serviceName>:<serviceTag>`);
    console.log(`  <serviceTag = <ourVersion>-<appVersion> | <ourVersion>-<appVersion>-dev | latest | dev`);
    console.log(`  <ourVersion> = <major>.<minor>`);
    console.log(`  <major> = <number>`);
    console.log(`  <minor> = <number>`);
    console.log(`  <appVersion> = <string_without_dash_our_colon>`);
    console.log(`Options:`);
    console.log(`  -h, --help           display help for command`);
    console.log(`  --registry <string>  the registry to push the image to (default: docker.io)`);
    console.log(`  --user <string>      the user account on the registry (default: koenswings)`);
    console.log(`  --version            output the version number`);
    console.log(`  --git <string>       the git account to pull the service from (default: koenswings)`);
    console.log(`  --platform <string>  the platform to build the service for (default: linux/amd64,linux/arm64)`);
    console.log(``);
    process.exit(0);
}
// Check for the version flag and print the version if requested
if (argv.v || argv.version) {
    console.log(`Version: ${pack.version}`);
    process.exit(0);
}
// Check for services
const services = argv._;
if (services.length == 0) {
    exitWithError("Error: You must specify at least one service");
}
// Check for the registry argument
let registry = argv.registry;
if (registry == undefined) {
    registry = defaultRegistry;
}
// Check user argument
let user = argv.user;
if (user == undefined) {
    user = defaultRegistryUser;
}
// Check git account argument
let gitAccount = argv.git;
if (gitAccount == undefined) {
    gitAccount = defaultGitAccount;
}
// Check for the platform argument
let platform = argv.platform;
if (platform == undefined) {
    platform = "linux/amd64,linux/arm64";
}
console.log(`Building the following services: ${argv._}`);
// const servicesFolder = "../../services"
// Log into your favorite registry
try {
    // await $`docker login --username ${user} ${registry}`
    await $ `docker login ${registry}`;
}
catch (error) {
    exitWithError(`\nError when logging into ${registry} as user ${user}\n${error.message}`);
}
for (let service of services) {
    console.log(`Building service : ${service}`);
    // Generate a random ascii string for a temporary directory
    const tmpDirName = Math.random().toString(36).substring(2, 15);
    const tmpDir = `/tmp/${tmpDirName}`;
    console.log(`Using temporary directory ${tmpDir}`);
    try {
        // Parse the service reference into its components
        const { serviceTag, serviceName, major, minor } = parseServiceReference(service);
        const reponame = "serv-" + serviceName;
        // Create the temporary directory
        await $ `mkdir ${tmpDir}`;
        // Change directory to the temporary directory
        cd(tmpDir);
        // Clone the repo
        await $ `git clone -b ${serviceTag} https://github.com/${gitAccount}/${reponame}.git`;
        // Change directory to the repo
        cd(reponame);
        // Execute the docker commands to build the service
        await $ `docker buildx create --name multiarch --driver docker-container --use`;
        await $ `docker buildx build --push --platform ${platform} -t ${user}/${service} .`;
        await $ `docker buildx rm multiarch`;
        // Execute the docker command to push the service
        //await $`docker push ${user}/${service}`
        // Remove the temporary directory
        // await $`rm -rf /tmp/${service}`
        await $ `rm -rf ${tmpDir}`;
    }
    catch (error) {
        // Remove the temporary directory
        await $ `rm -rf ${tmpDir}`;
        exitWithError(`Error when building ${service}\n${error.message}`);
    }
}
function parseServiceReference(serviceRef) {
    const serviceSplit = serviceRef.split(":");
    assert(serviceSplit.length == 2, `Error: Service ${serviceRef} reference must be in the form <serviceName>:<tag>`);
    const serviceName = serviceSplit[0];
    const serviceTag = serviceSplit[1];
    const serviceTagSplit = serviceTag.split("-");
    if (serviceTagSplit.length == 1) {
        // We have a stable tag
        assert((serviceTagSplit[0] == "latest" || serviceTagSplit[0] == "dev"), `Error: Service tag ${serviceTag} must be in the form <ourVersion>-<appVersion> | <ourVersion>-<appVersion>-dev | latest | dev`);
        if (serviceTagSplit[0] == "latest") {
            return {
                serviceName: serviceName,
                serviceTag: serviceTag,
                major: "0",
                minor: "0",
                appVersion: "",
                latest: true,
                dev: false
            };
        }
        else {
            return {
                serviceName: serviceName,
                serviceTag: serviceTag,
                major: "0",
                minor: "0",
                appVersion: "",
                latest: false,
                dev: true
            };
        }
    }
    else {
        // We have an unstable tag
        assert(serviceTagSplit.length >= 2, `Error: Service tag ${serviceTag} must be in the form <ourVersion>-<appVersion> | <ourVersion>-<appVersion>-dev | latest | dev`);
        const ourVersion = serviceTagSplit[0];
        const appVersion = serviceTagSplit[1];
        const ourVersionSplit = ourVersion.split(".");
        assert(ourVersionSplit.length == 2, `Error: Our version ${ourVersion} must be in the form <major>.<minor>`);
        const [major, minor] = ourVersionSplit;
        if ((serviceTagSplit.length == 3) && (serviceTagSplit[2] == "dev")) {
            return {
                serviceName: serviceName,
                serviceTag: serviceTag,
                major: major,
                minor: minor,
                appVersion: appVersion,
                latest: false,
                dev: true
            };
        }
        if ((serviceTagSplit.length == 3) && (serviceTagSplit[2] == "latest")) {
            return {
                serviceName: serviceName,
                serviceTag: serviceTag,
                major: major,
                minor: minor,
                appVersion: appVersion,
                latest: true,
                dev: false
            };
        }
        return {
            serviceName: serviceName,
            serviceTag: serviceTag,
            major: major,
            minor: minor,
            appVersion: appVersion,
            latest: false,
            dev: false
        };
    }
}
function exitWithError(errorMessage) {
    console.error(chalk.red(errorMessage));
    process.exit(1);
}
// void (async function () {
//     const { $ } = await import('zx')
//     await $`ls`;
//   })();
