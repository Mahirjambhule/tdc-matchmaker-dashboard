const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  dateOfBirth: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },

  country: { type: String, default: 'India' },
  city: { type: String, required: true },
  religion: { type: String, required: true },
  caste: { type: String, required: true },
  languagesKnown: [{ type: String }],

  college: { type: String, required: true },
  degree: { type: String, required: true },
  company: { type: String, required: true },
  designation: { type: String, required: true },
  income: { type: Number, required: true },

  height: { type: Number, required: true },
  maritalStatus: { type: String, enum: ['Never Married', 'Divorced', 'Widowed'], required: true },
  siblings: { type: Number, default: 0 },
  diet: { type: String, enum: ['Veg', 'Non-Veg', 'Eggetarian', 'Jain'], required: true },

  wantKids: { type: String, enum: ['Yes', 'No', 'Maybe'], required: true },
  openToRelocate: { type: String, enum: ['Yes', 'No', 'Maybe'], required: true },
  openToPets: { type: String, enum: ['Yes', 'No', 'Maybe'], required: true },
  familyValues: { type: String, enum: ['Traditional', 'Moderate', 'Liberal'], required: true },

  journeyStatus: {
    type: String,
    enum: ['Onboarding', 'Profile Verified', 'Searching Matches', 'Interaction Stage', 'Matched'],
    default: 'Profile Verified'
  },
  matchmakerNotes: [{
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);