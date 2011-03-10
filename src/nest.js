// #nest.js 
// nest.js is a javascript wrapper to the Echo Nest 
// [developer api](http://developer.echonest.com).

// Wrap everything in the `nest` object, as to not clobber the
// global namespace
var nest = {
    // This is the main object that is used
    // to call the api
    Nest: function(api_key) {
        return {
            get_api_key: function(){
                return api_key;
            }
        };
    }
};
