// nest.js is a javascript wrapper to the Echo Nest 
// [developer api](http://developer.echonest.com).

// Wrap everything in the `nest` object, as to not clobber the
// global namespace
var nest = (function () {

    // Function to give javascript something closer
    // to pure prototypal inhereritance
    function clone(obj) {
        function F() {}
        F.prototype = obj;
        return new F;
    }

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


    // This is the main object that will be returned
    // as `nest`
    nest = {};
    nest.nestproto      = {};
    nest.artistproto    = {};
    nest.trackproto     = {};
    nest.songproto      = {};

    nest.nest = function (api_key, host) {
        // this is the object that will
        // returned
        var container = clone(nest.nestproto);
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
                        return;
                    } else {
                        // there was an error,
                        // just return the `status`
                        // as the first paramter
                        callback(request.status);
                        return;
                    }
                }
            };
            // do it
            request.send();
        }

        // return the read-only `api_key`
        container.getAPIKey = function () {
            return api_key;
        };
        
        // return the read-only `host` name
        container.getHost = function () {
            return host;
        };

        function creator (type, methods) {
        // create a new artist, track, song, catalog, etc..
        //
        //
        // params should have an
        // `id` or `name` property
            return function (params) {
                var i;
                // we'll be attaching functions to this
                // object
                var protoname = type + 'proto';
                var container = clone(nest[protoname]);

                // add `id` or `name`
                // to the container object
                update(container, params);

                // Return the best way to identify the container,
                // first being an ID, second being a name
                container.identify = function () {
                    return (this.id) ? {id: this.id} : {name: this.name};
                };

                // helper function for having a closure remember
                // a value in when it changes in a loop
                function methodCreator(method) {
                    // this will be the function that
                    // gets called for each of the methods
                    // on `container`. It can be called
                    // with a variable number of arguments,
                    // the last one always being a callback function.
                    // The callback function will be called like
                    // `callback(err, result)`
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        var callback = args.pop();
                        var query = update({}, container.identify());
                        var options = args.pop();
                        if (options) {
                            update(query, options);
                        }
                        // TODO:
                        // maybe this should be called with an object,
                        // it has a lot of parameters
                        return nestGet(type, method, query, function (err, results) {
                            if (err) {
                                callback(err);
                                return;
                            } else {
                                if (results[type]) {
                                    // If we get a result back that includes
                                    // information about the container, fill it
                                    // in the container object. This means if we 
                                    // create an container object with a name,
                                    // but later get back a result that tells
                                    // us the container's ID, we can use it to
                                    // speed up further queries.
                                    container.name = results[type].name;
                                    container.id = results[type].id;
                                    if (method !== 'profile') {
                                        if (type !== 'song') {
                                            callback(err, results[type][method]);
                                            return;
                                        } else {
                                            callback(err, results[type]['songs'][0]);
                                            return;
                                        }
                                    } else {
                                        callback(err, results[type]);
                                        return;
                                    }
                                } else {
                                    callback(err, results);
                                    return;
                                }
                            }
                        });
                    };
                }
                // go through and attach a function
                // to each of the `artist` methods
                for (i = 0; i < methods.length; i += 1) {
                    var method = methods[i];
                    container[method] = methodCreator(method);
                }
                return container;
            };
        }

        function searchHelper(type) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                var callback = args.pop();
                var params = args.pop() || {};
                nestGet(type, 'search', params, function (err, results) {
                    var output = [];
                    // turn `artist` into `artists`
                    // and `song` into `songs`
                    var resultKey = type + 's';
                    var objects = results[resultKey];

                    if (err) {
                        callback(err);
                        return;
                    } else {
                        // make the artist or song
                        // objects out of the results
                        for (i = 0; i < objects.length; i += 1) {
                            output.push(container[type](objects[i]));
                        }

                        callback(null, output);
                        return;
                    }
                    // this code path should
                    // not be reachable but
                    // it's good style to
                    // keep it in
                    return;
                });
            };
        }

        var artist_methods = [
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
        container.artist = creator("artist", artist_methods);
        container.track  = creator("track", ["profile"]);
        container.song   = creator("song", ["profile"]);
        container.searchArtists  = searchHelper('artist');
        container.searchSongs    = searchHelper('song');
        return container; 
    };
    return nest;
}());
