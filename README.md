#nest.js 
nest.js is a thin javascript wrapper to the Echo Nest 
[developer API](http://developer.echonest.com).

It is currently a work-in-progress.

To get started, [you'll need to get an API key](http://developer.echonest.com/account/register).

## Documentation
In addition to this document, source documentation can be generated
by running `generate_docs.sh`. This requires [docco](http://jashkenas.github.com/docco/).

## Usage
`nest.js` provides everything in a global `nest` object. We can create
a new `nest` object like this

`var myNest = nest.nest("your API key here");`

Once you have your `nest` object, you can create a new `artist`. `artist` can
be created with either a name, or an [Echo Nest ID](http://developer.echonest.com/docs/v4/index.html#identifiers).

    var a = myNest.artist({name: "The Sea and Cake"});
    var b = myNest.artist({id: "AR94EZ61187B990729"});

Once we have our artist object, we can start calling the API. All methods take a
callback function as their last argument. The callback will be called like `callback(err, results)`. `err` will be null if the request was successful.

    myArtist.biographies({results: 10, start: 5}, function(err, results) {
        if (err) {
            console.log("there was an error...");
            return;
        }
        console.log(results);
    });
