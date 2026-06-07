const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./models/Customer');

dotenv.config();

const culturalBlueprints = [
  {
    religion: 'Hindu',
    castes: ['Brahmin', 'Kshatriya', 'Vaishya', 'Maratha', 'Kunbi', 'Kapu', 'Kayastha', 'Saraswat', 'Nair'],
    maleFirstNames: ['Aarav', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Aaryan', 'Krishna', 'Ishaan', 'Shaurya', 'Kabir', 'Rohan', 'Aditya', 'Aniket', 'Rahul', 'Vikram', 'Dev', 'Pranav', 'Rudra', 'Manish', 'Gaurav', 'Vivek', 'Siddharth', 'Mayank', 'Alok', 'Rishabh'],
    femaleFirstNames: ['Ananya', 'Diya', 'Isha', 'Aadhya', 'Saanvi', 'Anika', 'Meera', 'Riya', 'Priya', 'Kavya', 'Sneha', 'Pooja', 'Neha', 'Shruti', 'Tanvi', 'Kriti', 'Ridhima', 'Aditi', 'Mehak', 'Dia', 'Shreya', 'Payal', 'Kajal', 'Ritu', 'Nisha'],
    lastNames: ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Mehta', 'Joshi', 'Mishra', 'Choudhury', 'Kulkarni', 'Deshmukh', 'Iyer', 'Pillai', 'Patil', 'Pawar', 'Nair', 'Boshi', 'Kadam', 'Shinde', 'Tripathi']
  },
  {
    religion: 'Muslim',
    castes: ['None'],
    maleFirstNames: ['Zaid', 'Faizan', 'Imran', 'Farhan', 'Kabir', 'Arshad', 'Asif', 'Sajid', 'Yousef', 'Tariq', 'Rayan', 'Aadil', 'Sameer', 'Rehan', 'Zane'],
    femaleFirstNames: ['Zara', 'Sana', 'Alia', 'Fatima', 'Aisha', 'Mehak', 'Yasmin', 'Farha', 'Nadia', 'Inaya', 'Samira', 'Mariam', 'Zoya', 'Sadia', 'Hena'],
    lastNames: ['Khan', 'Sheikh', 'Syed', 'Ahmed', 'Qureshi', 'Ali', 'Malik', 'Ansari', 'Siddiqui', 'Mirza']
  },
  {
    religion: 'Christian',
    castes: ['None'],
    maleFirstNames: ['Jerome', 'Kevin', 'Ryan', 'Chris', 'Dev', 'David', 'John', 'Matthew', 'Luke', 'Andrew', 'Daniel', 'Thomas', 'Peter', 'Mark'],
    femaleFirstNames: ['Michelle', 'Alisha', 'Riya', 'Elena', 'Dia', 'Sarah', 'Rachel', 'Rebecca', 'Jessica', 'Emily', 'Ashley', 'Grace', 'Emma'],
    lastNames: ['Fernandes', 'D\'Souza', 'Pinto', 'Dias', 'Kapadia', 'Thomas', 'Joseph', 'Mathew', 'Rodrigues', 'Almeida', 'Cardozo']
  },
  {
    religion: 'Sikh',
    castes: ['None'],
    maleFirstNames: ['Gurpreet', 'Harpreet', 'Manpreet', 'Navjot', 'Rajdeep', 'Angad', 'Diljit', 'Ishwar', 'Prabhjot', 'Jasmeet'],
    femaleFirstNames: ['Kriti', 'Ridhima', 'Dia', 'Isha', 'Simran', 'Jasleen', 'Kirandeep', 'Avneet', 'Harleen', 'Gurleen'],
    lastNames: ['Singh', 'Kaur', 'Ahluwalia', 'Grewal', 'Gill', 'Dhillon', 'Sandhu', 'Siddhu']
  },
  {
    religion: 'Jain',
    castes: ['None'],
    maleFirstNames: ['Aarav', 'Rohan', 'Pranav', 'Manish', 'Rishabh', 'Akshat', 'Shreyans', 'Samyak', 'Anant', 'Jinay'],
    femaleFirstNames: ['Tanvi', 'Kavya', 'Diya', 'Sneha', 'Prachi', 'Vidhi', 'Riddhi', 'Aachal', 'Palak'],
    lastNames: ['Shah', 'Jain', 'Mehta', 'Kothari', 'Sanghvi', 'Chordia', 'Mutha', 'Bafna']
  }
];

const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata', 'Nagpur', 'Chandrapur'];
const languages = [['English', 'Hindi'], ['English', 'Hindi', 'Marathi'], ['English', 'Telugu'], ['English', 'Tamil'], ['English', 'Hindi', 'Bengali'], ['English', 'Punjabi']];

const colleges = ['IIT Bombay', 'BITS Pilani', 'Delhi University', 'MIT Pune', 'IIM Ahmedabad', 'VIT Vellore', 'RV College of Engineering', 'SRM University', 'Priyadarshini College of Engineering'];
const degrees = ['B.Tech Computer Science', 'B.Com Honors', 'BBA', 'MBA', 'M.Tech', 'B.Sc Data Science'];
const companies = ['TCS', 'Infosys', 'Google', 'Microsoft', 'Zomato', 'Deloitte', 'Accenture', 'Reliance Industries'];
const designations = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Financial Analyst', 'Consultant', 'HR Manager', 'Marketing Lead'];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDOB = () => {
  const currentYear = new Date().getFullYear();
  return new Date(currentYear - randomRange(22, 35), randomRange(0, 11), randomRange(1, 28));
};

const generateProfiles = () => {
  const profiles = [];
  let idCounter = 1;

  while (profiles.filter(p => p.gender === 'Male').length < 150) {
    const blueprint = culturalBlueprints[idCounter % culturalBlueprints.length];
    const firstName = randomChoice(blueprint.maleFirstNames);
    const lastName = randomChoice(blueprint.lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idCounter}@thedatecrew.com`;

    if (profiles.some(p => p.email === email)) { idCounter++; continue; }

    profiles.push({
      firstName, lastName, gender: 'Male', dateOfBirth: generateDOB(), email,
      phone: `98765${String(idCounter).padStart(5, '0')}`, city: randomChoice(cities),
      religion: blueprint.religion, caste: randomChoice(blueprint.castes), languagesKnown: randomChoice(languages),
      college: randomChoice(colleges), degree: randomChoice(degrees), company: randomChoice(companies),
      designation: randomChoice(designations), income: randomRange(8, 45), height: randomRange(165, 188),
      maritalStatus: randomChoice(['Never Married', 'Never Married', 'Never Married', 'Divorced']),
      siblings: randomRange(0, 2), diet: blueprint.religion === 'Jain' ? 'Jain' : randomChoice(['Veg', 'Non-Veg', 'Eggetarian']),
      wantKids: randomChoice(['Yes', 'No', 'Maybe']), openToRelocate: randomChoice(['Yes', 'No', 'Maybe']),
      openToPets: randomChoice(['Yes', 'No', 'Maybe']), familyValues: randomChoice(['Traditional', 'Moderate', 'Liberal']),
      journeyStatus: 'Profile Verified', matchmakerNotes: [{ note: "Profile screened and documents verified automatically." }]
    });
    idCounter++;
  }

  while (profiles.filter(p => p.gender === 'Female').length < 150) {
    const blueprint = culturalBlueprints[idCounter % culturalBlueprints.length];
    const firstName = randomChoice(blueprint.femaleFirstNames);
    const lastName = randomChoice(blueprint.lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idCounter}@thedatecrew.com`;

    if (profiles.some(p => p.email === email)) { idCounter++; continue; }

    profiles.push({
      firstName, lastName, gender: 'Female', dateOfBirth: generateDOB(), email,
      phone: `98765${String(idCounter).padStart(5, '0')}`, city: randomChoice(cities),
      religion: blueprint.religion, caste: randomChoice(blueprint.castes), languagesKnown: randomChoice(languages),
      college: randomChoice(colleges), degree: randomChoice(degrees), company: randomChoice(companies),
      designation: randomChoice(designations), income: randomRange(6, 35), height: randomRange(150, 173),
      maritalStatus: randomChoice(['Never Married', 'Never Married', 'Never Married', 'Divorced']),
      siblings: randomRange(0, 2), diet: blueprint.religion === 'Jain' ? 'Jain' : randomChoice(['Veg', 'Non-Veg', 'Eggetarian']),
      wantKids: randomChoice(['Yes', 'No', 'Maybe']), openToRelocate: randomChoice(['Yes', 'No', 'Maybe']),
      openToPets: randomChoice(['Yes', 'No', 'Maybe']), familyValues: randomChoice(['Traditional', 'Moderate', 'Liberal']),
      journeyStatus: 'Profile Verified', matchmakerNotes: [{ note: "Profile screened and documents verified automatically." }]
    });
    idCounter++;
  }
  return profiles;
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔄 Connected to MongoDB. Clearing outdated records...');
    await Customer.deleteMany({});
    console.log('🌱 Building clean balanced matrix of 300 unique profiles...');
    await Customer.insertMany(generateProfiles());
    console.log('✅ Success! Database injected with clean profile distribution.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding fault:', err);
    process.exit(1);
  });