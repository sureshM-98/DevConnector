const express = require('express');
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Posts');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// @route        GET api/profile/me
// @description  Get current user profile
// @access       Private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route        POST api/profile
// @description  Create or update user profile
// @access       Private

router.post('/', [auth, check('status', 'Status is required').not().isEmpty(), check('skills', 'skills is required').not().isEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  }
  const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;

  //build profile object
  const profileField = {};
  profileField.user = req.user.id;
  if (company) profileField.company = company;
  if (website) profileField.website = website;
  if (location) profileField.location = location;
  if (bio) profileField.bio = bio;
  if (status) profileField.status = status;
  if (githubusername) profileField.githubusername = githubusername;

  if (skills) {
    profileField.skills = skills
      .toString()
      .split(',')
      .map(skill => skill.trim());
  }
  //build social object
  profileField.social = {}; //initializing the social object
  if (youtube) profileField.social.youtube = youtube;
  if (twitter) profileField.social.twitter = twitter;
  if (facebook) profileField.social.facebook = facebook;
  if (linkedin) profileField.social.linkedin = linkedin;
  if (instagram) profileField.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      profile = await Profile.findOneAndUpdate(
        //updating an already existing profile
        { user: req.user.id },
        { $set: profileField },
        { new: true },
      );
      return res.json(profile); //send back the profile
    }
    //create a profile
    profile = new Profile(profileField); //creating an instance of the Profile model
    await profile.save(); // save the created profile
    res.json(profile); //send back the profile
  } catch (err) {
    console.log(err.message);
    res.status(500).send('SERVER ERROR');
  }
});

// @route        GET api/profile
// @description  Get all profiles
// @access       Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route        GET api/profile/user/:userId
// @description  Get profile by user ID
// @access       Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if (!profile) res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route        DELETE api/profile
// @description  Delete profile, user & posts
// @access       Private
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: req.user.id });
    // Remove profile
    await Profile.findOneAndDelete({ user: req.user.id });
    // Remove user
    await User.findOneAndDelete({ user: req.user._id });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route        PUT api/profile/experience
// @description  Add profile experience
// @access       Private
router.put(
  '/experience',
  [auth, [check('title', 'Title is required').not().isEmpty(), check('company', 'Company is required').not().isEmpty(), check('from', 'From date is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, company, location, from, to, current, description } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route        DELETE api/profile/experience/:exp_id
// @description  Delete experience from profile
// @access       Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.experience.map(item => item._id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route        PUT api/profile/education
// @description  Add profile education
// @access       Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route        DELETE api/profile/education/:edu_id
// @description  Delete education from profile
// @access       Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.education.map(item => item._id).indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route        GET api/profile/github/:username
// @description  Get user repos from github
// @access       Public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
			sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
