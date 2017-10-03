# Get Organization Faculty ORCID information
Query the ORCID registry for people who are affiliated with a specific organization.

## Requirements
This client is written in JavaScript. It requires **Node.js** (4.x or greater) and **npm** (the Node.js package manager). To deploy on an Ubuntu platform, install the following packages:

    sudo apt-get update
    sudo apt-get install nodejs
    sudo apt-get install npm
    sudo apt-get install nodejs-legacy

**Note:** The `nodejs-legacy` package simply links the `nodejs` command to `node` so the shebang in the `index.js` script works on Debian platforms.

**Note:** The Ubuntu 14 `nodejs` package is currently at v0.10.25. To get the required LTS, the 4.x or 6.x branch, you can add a PPA (personal package archive), for example:

    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install nodejs

This installs both `nodejs` and `npm` (but not `nodejs-legacy`). For more information and options for Ubuntu 14 see [How To Install Node.js on an Ubuntu 14.04 server](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server).

## Installation
Check out the ORCID-public-api repository:

    git clone git@github.com:WRLC/ORCID-public-api.git

Go to the `facultyIDs` directory and install the dependencies:

    npm install

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
