#!/usr/bin/env node
/*
 * facultyIDs - Node js application to query the ORCID public API
 *              and select IDs that look like ORG's Faculty members
 *
 *  example of Node API client, with callbacks instead of synchronous function returns
 *
 *  Usage: index.js [options]
 *  Options:
 *      -o, --orgid <orgid>    The Ringgold ID of the organization to search for
 *      -f, --format [format]  Output format, specify JSON or CSV, default=JSON
 *      -h, --help             output usage information
 *
 *  Issues: Doesn't resolve duplicates (i.e. someone with more than 1 affiliation)
 *          Uses end-date to see if affiliation is current -- not always there
 *          Can't distinguish between faculty and staff
 *          Takes ~75sec to run, so implemented as a CLI script rather than web server
 */
//var debug = true;     // will output debug logging to console.error
var debug = false;

// request module provides the HTTP/S GET & POST, etc
var req = require('request');
// commander module provides command line interface stuff
var cli = require('commander');

// parse command line arguments
cli .option('-o, --orgid <orgid>', 'The Ringgold ID of the organization to search for')
    .option('-f, --format [format]', 'Output format, specify JSON or CSV, default=JSON')
    .option('-q, --quiet', 'Do not display the progress bar (e.g. for cron or bg)')
    .parse(process.argv);

if (typeof cli.orgid === 'undefined') {
    console.error( '[main] arg error: Ringgold organization ID is required' );
    process.exit( 1 );
}
var ringgoldID = cli.orgid;
var csvFormat = false;
if (cli.format) {
    if (cli.format != 'JSON' && cli.format != 'CSV') {
        console.error( '[main] arg error: Unrecognized format %s', cli.format );
        process.exit( 1 );
    } else if (cli.format == 'CSV') {
        csvFormat = true;
        var json2csv = require('json2csv');
        var fields = ["orcid", "name", "email", "orgname", "depname", "title"];
    }
}
var progress = (cli.quiet ? false : true);
if (progress) {
    var ProgressBar = require('progress');
    var barOpts = {
        width: 50,
        total: 50,
        complete: '=',
        incomplete: ' '
    };
    var bar = new ProgressBar('  progress [:bar] :percent', barOpts);
}

/*
 * ORCID public API search endpoint
 *  e.g. https://pub.orcid.org/v2.0/search/?q=ringgold-org-id:8363
 */
var orcidURL = 'https://pub.orcid.org/v2.0/';
var headers = { 'Accept': 'application/vnd.orcid+json' };
var search = '/search/';
var query = {   'q': 'ringgold-org-id:'+ringgoldID,
                'start': 0,
                'rows': 100
};
var restcall= { baseUrl:    orcidURL,
                url:        search,
                qs:         query,
                headers:    headers,
                json:       true        // this will de-serialize the body
};

/*
 * search ORCID registry for ORG affiliates . . .
 */
var affiliates = [];
var acount = 0;
var faculty = [];
var next = 1;
getAffiliates( restcall, getFaculty );
/*
 * . . . done
 */

// query API for all IDs with ORG affiliation (may be employment or education)
function getAffiliates( options, callback ) {
    req.get( options, function(error, resp, body) {
        if (error) {
            callback( '[getAffiliates] req error: ' + error, rtnFaculty );
        } else if (resp) {
            if (resp.statusCode != 200) {
                callback( '[getAffiliates] bad status: ' + resp.statusCode, rtnFaculty );
            } else {
                body.result.forEach( function(orcid) {
                    // [ { 'orcid-identifier': [Object-uri-path-host] },...
                    affiliates.push(orcid['orcid-identifier']['path']);
                    //console.log(next + ': ' + orcid['orcid-identifier']['path']);
                    next++;
                } );
                if (debug)
                    console.error('DEBUG: Processed '+next+' of '+body['num-found']);
                if (next < body['num-found']) {
                    query['start'] = next;
                    getAffiliates( restcall, callback );
                } else {
                    // we're done ... callback will filter list to get faculty
                    callback( null, rtnFaculty );
                }
            }
        } else {
            callback('[getAffiliates] null response error:', rtnFaculty);
        }
    } );
}

// filter IDs to identify faculty
function getFaculty( error, callback ) {
    if (error) {
        callback( error );
    } else {
        // clear search query
        restcall['qs'] = null;
        // loop thru affiliations and select employment affiliates
        facultyLoop( error, callback );
    }
}

// need to loop thru IDs by recursion since request.get is asynchronous
function facultyLoop( error, callback ) {
    if (error) {
        callback( error );
    } else {
        if (affiliates.length) {
            var orcid = affiliates.pop();
            acount++;
            if (debug)
                console.error('DEBUG: popped '+orcid+' (#'+affiliates.length+')');
            restcall['url'] = '/' + orcid + '/record';
            req.get( restcall, function(error, resp, body) {
                if (error) {
                    callback( '[facultyLoop] req error: ' + error );
                } else if (resp) {
                    if (resp.statusCode != 200) {
                        callback( '[facultyLoop] bad status: ' + resp.statusCode );
                    } else {
                        var employments = body  ["activities-summary"]
                                                ["employments"]
                                                ["employment-summary"];
                        if (employments) {
                            employments.forEach( function(org) {
                                if (isFaculty( org )) {
                                    var name1 = body.person.name["given-names"];
                                    var name2 = body.person.name["family-name"];
                                    var name = name1.value + ' ' + name2.value;
                                    var email = 'private';
                                    if (body.person.emails.email.length) {
                                        email = body.person.emails.email[0].email;
                                    }

                                    var facobj = {
                                        'orcid':    orcid,
                                        'name':     name,
                                        'email':    email,
                                        'orgname':  org.organization.name,
                                        'depname':  org['department-name'],
                                        'title':    org['role-title'],
                                    }

                                    faculty.push( facobj );
                                    if (debug)
                                        console.error('DEBUG: pushed '+orcid);
                                    if (progress) {
                                        // figure out how much we've done
                                        var ratio = acount / (acount + affiliates.length);
                                        bar.update(ratio);
                                    }
                                }
                            } );
                        }
                        // recursive call to continue loop thru faculty[]
                        facultyLoop( null, callback );
                    }
                } else {
                    callback('[facultyLoop] null response error:');
                }
            } );
        } else {
            // we're done . . .
            callback(null);
        }
    }
}

// final callback -- return the response
function rtnFaculty( error ) {
    if (progress) {
        bar.terminate();
    }
    if (error) {
        console.error( error );
        process.exit( 1 );
    }
    if (csvFormat) {
        console.log( json2csv({ data: faculty, fields: fields }) );
    } else {
        console.log( JSON.stringify(faculty, null, 2) );
    }
}

// criteria for determining whether an affiliate is faculty
function isFaculty( org ) {
    if (org.organization["disambiguated-organization"] &&
        org.organization["disambiguated-organization"]  // affiliated with org and
                        ["disambiguated-organization-identifier"] == ringgoldID &&
        org['end-date'] === null)                       // no end-date specified
    {
        return true;
    } else {
        return false;
    }
}
