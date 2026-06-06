const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./models/Customer');

dotenv.config();

const maleFirstNames = ['Aarav', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Aaryan', 'Krishna', 'Ishaan', 'Shaurya', 'Kabir', 'Rohan', 'Aditya', 'Aniket', 'Rahul', 'Vikram', 'Dev', 'Vivaan', 'Pranav', 'Rudra', 'Manish'];
const femaleFirstNames = ['Ananya', 'Diya', 'Isha', 'Aadhya', 'Saanvi', 'Anika', 'Meera', 'Riya', 'Priya', 'Kavya', 'Sneha', 'Pooja', 'Neha', 'Shruti', 'Tanvi', 'Kriti', 'Ridhima', 'Aditi', 'Mehak', 'Dia'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Mehta', 'Joshi', 'Mishra', 'Kumar', 'Singh', 'Rao', 'Choudhury', 'Kulkarni', 'Banerjee', 'Deshmukh', 'Kapadia', 'Iyer', 'Pillai', 'Goshi'];

const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata'];
const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain'];
const castes = ['Brahmin', 'Kshatriya', 'Vaishya', 'Maratha', 'Kapu', 'Kayastha', 'Not Specific'];
const languages = [['English', 'Hindi'], ['English', 'Hindi', 'Marathi'], ['English', 'Telugu'], ['English', 'Tamil'], ['English', 'Hindi', 'Bengali']];

const colleges = ['IIT Bombay', 'BITS Pilani', 'Delhi University', 'MIT Pune', 'IIM Ahmedabad', 'VIT Vellore', 'RV College of Engineering', 'SRM University'];
const degrees = ['B.Tech Computer Science', 'B.Com Honors', 'BBA', 'MBA', 'M.Tech', 'B.Sc Data Science'];
const companies = ['TCS', 'Infosys', 'Google', 'Microsoft', 'Zomato', 'Deloitte', 'Accenture', 'Reliance Industries'];
const designations = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Financial Analyst', 'Consultant', 'HR Manager', 'Marketing Lead'];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDOB = () => {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - randomRange(22, 35);
  return new Date(birthYear, randomRange(0, 11), randomRange(1, 28));
};

const generateProfiles = () => {
  const profiles = [];
  let idCounter = 1;

  for (let f = 0; f < 5; f++) {
    for (let l = 0; l < 20; l++) {
      const firstName = maleFirstNames[f];
      const lastName = lastNames[l];
      const height = randomRange(165, 188);
      const income = randomRange(8, 45);

      profiles.push({
        firstName,
        lastName,
        gender: 'Male',
        dateOfBirth: generateDOB(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idCounter}@thedatecrew.com`,
        phone: `98765${String(idCounter).padStart(5, '0')}`,
        city: randomChoice(cities),
        religion: randomChoice(religions),
        caste: randomChoice(castes),
        languagesKnown: randomChoice(languages),
        college: randomChoice(colleges),
        degree: randomChoice(degrees),
        company: randomChoice(companies),
        designation: randomChoice(designations),
        income,
        height,
        maritalStatus: randomChoice(['Never Married', 'Never Married', 'Never Married', 'Divorced']),
        siblings: randomRange(0, 2),
        diet: randomChoice(['Veg', 'Non-Veg', 'Eggetarian', 'Jain']),
        wantKids: randomChoice(['Yes', 'No', 'Maybe']),
        openToRelocate: randomChoice(['Yes', 'No', 'Maybe']),
        openToPets: randomChoice(['Yes', 'No', 'Maybe']),
        familyValues: randomChoice(['Traditional', 'Moderate', 'Liberal']),
        journeyStatus: 'Profile Verified',
        matchmakerNotes: [{ note: "Profile screened and documents verified by system automatically." }]
      });
      idCounter++;
    }
  }

  for (let f = 0; f < 5; f++) {
    for (let l = 0; l < 20; l++) {
      const firstName = femaleFirstNames[f];
      const lastName = lastNames[l];
      const height = randomRange(150, 173);
      const income = randomRange(6, 35);

      profiles.push({
        firstName,
        lastName,
        gender: 'Female',
        dateOfBirth: generateDOB(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idCounter}@thedatecrew.com`,
        phone: `98765${String(idCounter).padStart(5, '0')}`,
        city: randomChoice(cities),
        religion: randomChoice(religions),
        caste: randomChoice(castes),
        languagesKnown: randomChoice(languages),
        college: randomChoice(colleges),
        degree: randomChoice(degrees),
        company: randomChoice(companies),
        designation: randomChoice(designations),
        income,
        height,
        maritalStatus: randomChoice(['Never Married', 'Never Married', 'Never Married', 'Divorced']),
        siblings: randomRange(0, 2),
        diet: randomChoice(['Veg', 'Non-Veg', 'Eggetarian', 'Jain']),
        wantKids: randomChoice(['Yes', 'No', 'Maybe']),
        openToRelocate: randomChoice(['Yes', 'No', 'Maybe']),
        openToPets: randomChoice(['Yes', 'No', 'Maybe']),
        familyValues: randomChoice(['Traditional', 'Moderate', 'Liberal']),
        journeyStatus: 'Profile Verified',
        matchmakerNotes: [{ note: "Profile screened and documents verified by system automatically." }]
      });
      idCounter++;
    }
  }

  return profiles;
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔄 Connected to MongoDB. Clearing outdated records...');
    await Customer.deleteMany({});
    
    console.log('🌱 Building clean permutation matrix of 200 non-repeating profiles...');
    const mockData = generateProfiles();
    
    await Customer.insertMany(mockData);
    console.log('✅ Success! 100 unique men and 100 unique women injected into Atlas.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding fault:', err);
    process.exit(1);
  });