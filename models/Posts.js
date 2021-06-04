const mongoose = require('mongoose');
let Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: {
    // this is connecting the user to the posts
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  text: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  avatar: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  likes: [
    //we are setting it to an array which holds the id of the user who liked
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
      },
    },
  ],
  comments: [
    //we are setting it to an array which holds the id of the user who liked
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
      },
      text: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
      avatar: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('post', PostSchema);
