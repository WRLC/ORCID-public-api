# Get Organization Faculty ORCID information
Query the ORCID registry for people who are affiliated with a specific organization.

## Requirements
This client is written in JavaScript. It requires **Node.js** (4.x or greater) and **npm** (the Node.js package manager). To deploy on an Ubuntu platform, install the following packages:

    sudo apt-get update
    sudo apt-get install nodejs
    sudo apt-get install npm
    sudo apt-get install nodejs-legacy

**Note:** The `nodejs-legacy` package simply links the `nodejs` command to `node` so the shebang in the `index.js` script works on Debian platforms. (Not sure this is necessary on Ubuntu 18+)

**Note:** To get a newer version of node or resolve dependency problems, you can [install nodejs using a PPA](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04#installing-using-a-ppa) (personal package archive). 

This installs both `nodejs` and `npm`.

## Installation
Check out the ORCID-public-api repository:

    git clone git@github.com:WRLC/ORCID-public-api.git

Go to the `facultyIDs` directory and install the dependencies:

    npm install

To upgrade dependencies (eg. when Github reports potential security vulnerabilities in your dependencies) use:

    npm update

to create new package files. See https://flaviocopes.com/update-npm-dependencies/ for more information and npm commands.

## Usage

    ./index.js [options]

    Options:
        -o, --orgid <orgid>    The Ringgold ID of the organization to search for
        -f, --format [format]  Output format, specify JSON or CSV, default=JSON
        -h, --help             output usage information

## Issues
* Doesn't resolve duplicates (i.e. someone with more than 1 affiliation)
* Uses end-date to see if affiliation is current -- not always there
* Can't distinguish between faculty and staff
* Takes ~75sec to run, so implemented as a CLI script rather than web server
