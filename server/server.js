
// BASE SETUP
// =============================================================================

var mongoose   = require('mongoose');
mongoose.connect("mongodb://localhost/beer"); // connect to our database

var Brewery = require("./models/breweries");
var Drink = require("./models/drinks");
var Type = require("./models/types");
var Vote = require("./models/votes");


// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');
var extend		 = require('extend');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; 		// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

function _sort(a,b) {
	var prop = "no";
	if (a[prop] == b[prop]) return 0;
	if (a[prop] > b[prop]) return -1;
	if (a[prop] < b[prop]) return 1;
};

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here
router.route('/breweries')
	.get(function(req, res) {

		Drink.find().distinct('brewery', function(error, data) {
			res.json(data);
		});
	});

router.route('/types')
	.get(function(req, res) {

		Drink.find().distinct('type', function(error, data) {
		  res.json(data);
		});
	});

router.route('/drinks')
	.post(function(req, res) {

		var drink = new Drink();
		extend (drink, req.body);

		// save the drink and check for errors
		drink.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Drink created!' });
		});

	})
	.get(function(req, res) {
		Drink.find(function(err, data) {
			if (err) {
				res.send(err);
			}
			res.json(data);
		});
	});

router.route('/drinks/top')
	.get(function(req, res) {
		Drink.aggregate([
				// First sort all the docs by name
				{$sort: {avg: 1}},
				// Take the first 100 of those
				{$limit: 10},
				// Of those, take only ones where marks > 35
				{$match: {avg: {$gte: 4}}}
		], function(err, data) {
			console.log("ERROR: " + err);
			console.log (data);
			res.json(data);
		});
	});

router.route('/drinks/query')
	.post(function(req, res) {
		console.log(req.body);
		Drink.find(req.body, function(err, data) {
			if (err) {
				res.send(err);
			}
			data = data.sort(_sort);
			res.json(data);
		});
	});

router.route('/drinks/:id')
	.get(function(req, res) {
		Drink.findById(req.params.id, function(err, data) {
			if (err) {
				res.send(err);
			}
			res.json(data);
		});
	});

router.route('/drinks/score')
	.post(function(req, res) {
		Drink.find(req.body.drinkId, function(err, data) {
			if (err) {
				res.send(err);
			}
			res.json(data);
		});
	});

router.route('/vote')
	.post(function(req, res) {
		var avg = 0;

		Drink.findById(req.body.drinkId, function(err, data) {
			if (data)
			{
				var drink = new Drink();
				extend (drink, data);

				drink.total += req.body.score;
				drink.votes++;
				drink.avg = Math.round(drink.total / drink.votes);
				drink.save(data, function(err) {

				});
			}
		});

		var vote = new Vote();
		extend(vote, req.body);

		vote.save(req.body, function(err, data) {
			// Do nothing as this is a simple logging process.
		});

		// Assume all was well, as this is a non-invasive process.
		res.json(req.body);
	});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
