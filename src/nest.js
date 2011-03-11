// nest.js is a javascript wrapper to the Echo Nest 
// [developer api](http://developer.echonest.com).

// Wrap everything in the `nest` object, as to not clobber the
// global namespace
var nest = {
    // This is the main object that is used
    // to call the api
    nest: function(api_key, host) {
        // optionaly take in another host,
        // for testing purposes
        host = host || "developer.echonest.com";
        return {
            // return the read-only `api_key`
            get_api_key: function(){
                return api_key;
            },
            
            // return the read-only `host` name
            get_host: function(){
                return host;
            }
        };
    }
};
