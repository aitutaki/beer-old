var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var VoteSchema   = new Schema({
  drinkId: Schema.Types.ObjectId,
  score: Number,
  user: String,
  timestamp: { type : Date, default: Date.now }
});

module.exports = mongoose.model('Vote', VoteSchema);
