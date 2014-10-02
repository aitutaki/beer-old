var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var DrinkSchema   = new Schema({
  no: Number,
  name: String,
  type: String,
  notes: String,
  abv: Number,
  tags: [String],
  score: Number,
  brewery: String,
  bar: String,
  votes: Number,
  total: Number,
  avg: Number
});

module.exports = mongoose.model('Drink', DrinkSchema);
