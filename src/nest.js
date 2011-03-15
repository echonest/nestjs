// nest.js is a javascript wrapper to the Echo Nest 
// [developer api](http://developer.echonest.com).

// Wrap everything in the `nest` object, as to not clobber the
// global namespace
var nest = (function () {

    // Helper function for iterating through
    // the keys in an object
    function each(obj, func) {
        var key;
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
        each(source, function (key) {
            obj[key] = source[key];
        });
        return obj;
    }

    // return a query string from an object
    function queryString(params) {
        var query = '?', first = true;
        var value;
        each(params, function (key) {
            var i;
            // only prepend `&` when this
            // isn't the first k/v pair
            if (first) {
                first = false;
            } else {
                query += '&';
            }
            value = params[key];
            if (isArray(value)) {
                for (i = 0; i < value.length; i += 1) {
                    query += (encodeURI(key) + '=' + encodeURI(value[i]));
                    if (i < (value.length - 1)) {
                        query += '&';
                    }
                }
            } else {
                query += (encodeURI(key) + '=' + encodeURI(value));
            }
        });
        return query;
    }

    // This is the main object that is used
    // to call the api
    return {
        nest: function (api_key, host) {
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
                url += host;
                url += api_path;
                url += category + '/';
                url += method;
                url += queryString(query);

                request.open('GET', url, true);
                request.onreadystatechange = function () {
                    var sc, json_response, response;
                    // see if the response is ready
                    if (request.readyState === 4) {
                        // get the request status class, ie.
                        // 200 == 2, 404 == 4, etc.
                        sc = Math.floor(request.status / 100);
                        if (sc === 2 || sc === 3) {
                            json_response = JSON.parse(request.responseText);
                            // unwrap the response from the outter
                            // `response` wrapper
                            response = json_response.response;
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

            // Return an object literal as the `nest`
            // object. We do this to create private
            // functions and variables for ourself,
            // through the use of a closure.
            return {
                // return the read-only `api_key`
                getAPIKey: function () {
                    return api_key;
                },
                
                // return the read-only `host` name
                getHost: function () {
                    return host;
                },

                // create a new artist,
                // params should have an
                // `id` or `name` property
                artist: function (params) {
                    var i;
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
                        'blogs',
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

                    // add `id` or `name`
                    // to the artist object
                    update(artist, params);

                    // Return the best way to identify the artist,
                    // first being an ID, second being a name
                    artist.identify = function () {
                        return (this.id) ? {id: this.id} : {name: this.name};
                    };

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
                        return function () {
                            var args = Array.prototype.slice.call(arguments);
                            var callback = args.pop();
                            var query = update({}, artist.identify());
                            var options = args.pop();
                            if (options) {
                                update(query, options);
                            }
                            // TODO:
                            // maybe this should be called with an object,
                            // it has a lot of parameters
                            return nestGet(category, method, query, function (err, results) {
                                if (err) {
                                    callback(err);
                                } else {
                                    if (results.artist) {
                                        // If we get a result back that includes
                                        // information about the artist, fill it
                                        // in the artist object. This means if we 
                                        // create an artist object with a name,
                                        // but later get back a result that tells
                                        // us the artist's ID, we can use it to
                                        // speed up further queries.
                                        artist.name = results.artist.name;
                                        artist.id = results.artist.id;
                                        if (method !== 'profile') {
                                            callback(err, results.artist[method]);
                                        } else {
                                            callback(err, results.artist);
                                        }
                                    } else {
                                        callback(err, results);
                                    }
                                }
                            });
                        };
                    }
                    // go through and attach a function
                    // to each of the `artist` methods
                    for (i = 0; i < methods.length; i += 1) {
                        var method = methods[i];
                        artist[method] = helper(method);
                    }
                    return artist;
                }
            };
        }
    };
}());
