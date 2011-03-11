// nest.js is a javascript wrapper to the Echo Nest 
// [developer api](http://developer.echonest.com).

// Wrap everything in the `nest` object, as to not clobber the
// global namespace
var nest = {
    // return a query string from an object
    query_string: function(params) {
        var query = '?';
        var first = true;
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                if (first) {
                    first = false;
                } 
                else {
                    query+= '&';
                }
                query+= (key + '=' + params[key]);
            }
        }
        return query;
    },

    // This is the main object that is used
    // to call the api
    nest: function(api_key, host) {
        // optionaly take in another host,
        // for testing purposes
        host = host || "developer.echonest.com";
        var api_path = "/api/v4/";

        // make HTTP GET requests and call `callback` with the
        // response object
        function nest_get(category, method, query, callback) {
            query.api_key = api_key;
            query.format = 'json';
            var request = new XMLHttpRequest();
            var url = 'http://' + host + api_path + category + '/' + method + nest.query_string(query);
            console.log('GET: ' + url);
            request.open('GET', url, true);
            request.onreadystatechange = function() {
                if (request.readyState === 4) {
                    if (request.status === 200 || request.status === 304) {
                        var json_response = JSON.parse(request.responseText);
                        callback(json_response);
                    }
                    else {
                        callback({error: request.status});
                    }
                }
            };
            request.send();
        }
        return {
            // return the read-only `api_key`
            get_api_key: function() {
                return api_key;
            },
            
            // return the read-only `host` name
            get_host: function() {
                return host;
            },

            // create a new artist
            artist: function(id, name) {
                var category = 'artist';
                return {
                    biographies: function(callback) {
                        var query = {"id":id};
                        return nest_get(category, 'biographies', query, callback);
                    }
                };
            }
        };
    }
};
