// nest.js is a javascript wrapper to the Echo Nest 
// [developer api](http://developer.echonest.com).

// Wrap everything in the `nest` object, as to not clobber the
// global namespace
var nest = (function(){
    // Helper function for iterating through
    // the keys in an object
    function each(obj, func) {
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                func.call(obj, key);
            }
        }
    }

    // Helper function to see if an object is
    // really an array. Taken from
    // `Javascript: The Good Parts` by
    // Douglas Crockford
    function isArray(obj) {
        return Object.prototype.toString.apply(obj) === '[object Array]';
    }

    // Update `obj` with all of the
    // key/values of `source`, not
    // following the prototype
    // chain
    function update(obj, source) {
        each(source, function(key) {
            obj[key] = source[key];
        });
        return obj;
    }
    // return a query string from an object
    function queryString(params) {
        var query = '?';
        var first = true;
        each(params, function(key){
            // only prepend `&` when this
            // isn't the first k/v pair
            if (first) {
                first = false;
            } else {
                query+= '&';
            }
            var value = params[key];
            if (isArray(value)) {
                for (i = 0; i < value.length; i++) {
                    query+= (encodeURI(key) + '=' + encodeURI(value[i]));
                    if (i < (value.length - 1)) {
                        query+= '&';
                    }
                }
            } else {
                query+= (encodeURI(key) + '=' + encodeURI(value));
            }
        });
        return query;
    }

    // This is the main object that is used
    // to call the api
    return {
        nest: function(api_key, host) {
            // optionaly take in another host,
            // for testing purposes
            host = host || "developer.echonest.com";
            var api_path = "/api/v4/";

            // make HTTP GET requests and call `callbacks.success`
            // or `callbacks.error` with the
            // response object, or the `status`, on error
            function nestGet(category, method, query, callback) {
                query.api_key = api_key;
                query.format = 'json';
                var request = new XMLHttpRequest();
                var url = 'http://';
                url+= host;
                url+= api_path;
                url+= category + '/';
                url+= method;
                url+= queryString(query);

                request.open('GET', url, true);
                request.onreadystatechange = function() {
                    // see if the response is ready
                    if (request.readyState === 4) {
                        // get the request status class, ie.
                        // 200 == 2, 404 == 4, etc.
                        var sc = Math.floor(request.status / 100);
                        if (sc === 2 || sc === 3) {
                            var json_response = JSON.parse(request.responseText);
                            // unwrap the response from the outter
                            // `response` wrapper
                            var response = json_response.response;
                            callback(null, response);
                        } else {
                            // there was an error,
                            // just return the `status`
                            // as the first paramter
                            callback(request.status);
                        }
                    }
                };
                // do it
                request.send();
            }
            return {
                // return the read-only `api_key`
                getAPIKey: function() {
                    return api_key;
                },
                
                // return the read-only `host` name
                getHost: function() {
                    return host;
                },

                // create a new artist
                // params should have an
                // `id` or `name` property
                artist: function(params) {
                    // the method category
                    var category = 'artist';
                    // we'll be attaching functions to this
                    // object
                    var artist = {};
                    // enumerate the list of methods
                    // we'll be attaching to `artist`
                    var methods = [
                    'audio',
                    'biographies',
                    'blog',
                    'familiarity',
                    'hotttnesss',
                    'images',
                    'profile',
                    'news',
                    'reviews',
                    'songs',
                    'similar',
                    'terms',
                    'video'];
                    // helper function for having a closure remember
                    // a value in when it changes in a loop
                    function helper(method) {
                        // this will be the function that
                        // gets called for each of the methods
                        // on `artist`. It can be called
                        // with a variable number of arguments,
                        // the last one always being a callback function.
                        // The callback function will be called like
                        // `callback(err, result)`
                        return function() {
                            var args = Array.prototype.slice.call(arguments);
                            var callback = args.pop();
                            var query = update({}, params);
                            var options = args.pop();
                            if (options) {
                                update(query, options);
                            }
                            // TODO:
                            // maybe this should be called with an object,
                            // it has a lot of parameters
                            return nestGet(category, method, query, function(err, results) {
                                if (err) {
                                    callback(err);
                                } else {
                                    if (results.artist) {
                                        artist.name = results.artist.name;
                                        artist.id   = results.artist.id;
                                        callback(err, results.artist[method]);
                                    } else {
                                        callback(err, results);
                                    }
                                }
                            });
                        };
                    }
                    for (i = 0; i < methods.length; i++) {
                        // go through and attach a function
                        // to each of the `artist` methods
                        var method = methods[i];
                        artist[method] = helper(method);
                    }
                    return artist;
                }
            };
        }
    };
})();
