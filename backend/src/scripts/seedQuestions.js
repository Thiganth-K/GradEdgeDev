const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Question = require('../models/Question');
const Institution = require('../models/Institution');

const aptitudeQuestions = [
  {
    text: 'If a train travels 120 km in 2 hours, what is its average speed?',
    options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'],
    correctIndex: 1,
    category: 'aptitude',
    difficulty: 'easy',
    tags: ['speed', 'distance', 'time'],
  },
  {
    text: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    correctIndex: 1,
    category: 'aptitude',
    difficulty: 'easy',
    tags: ['percentage', 'calculation'],
  },
  {
    text: 'A shopkeeper sells an item for $450 after giving a 10% discount. What was the original price?',
    options: ['$500', '$495', '$505', '$480'],
    correctIndex: 0,
    category: 'aptitude',
    difficulty: 'medium',
    tags: ['discount', 'profit-loss'],
  },
  {
    text: 'If 3x + 5 = 20, what is the value of x?',
    options: ['3', '4', '5', '6'],
    correctIndex: 2,
    category: 'aptitude',
    difficulty: 'easy',
    tags: ['algebra', 'equations'],
  },
  {
    text: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
    options: ['0°', '7.5°', '15°', '22.5°'],
    correctIndex: 1,
    category: 'aptitude',
    difficulty: 'hard',
    tags: ['clock', 'angles'],
  },
  {
    text: 'The ratio of boys to girls in a class is 3:2. If there are 15 boys, how many girls are there?',
    options: ['8', '10', '12', '15'],
    correctIndex: 1,
    category: 'aptitude',
    difficulty: 'medium',
    tags: ['ratio', 'proportion'],
  },
  {
    text: 'What is the next number in the series: 2, 6, 12, 20, 30, ?',
    options: ['38', '40', '42', '44'],
    correctIndex: 2,
    category: 'aptitude',
    difficulty: 'medium',
    tags: ['series', 'patterns'],
  },
  {
    text: 'A man can complete a work in 10 days. If he works with his son, they complete it in 6 days. How long will the son take alone?',
    options: ['12 days', '15 days', '18 days', '20 days'],
    correctIndex: 1,
    category: 'aptitude',
    difficulty: 'hard',
    tags: ['work-time', 'efficiency'],
  },
];

const technicalQuestions = [
  {
    text: 'Which data structure uses LIFO (Last In First Out) principle?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'easy',
    tags: ['data-structures', 'stack'],
  },
  {
    text: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'easy',
    tags: ['algorithms', 'complexity'],
  },
  {
    text: 'Which SQL command is used to retrieve data from a database?',
    options: ['GET', 'RETRIEVE', 'SELECT', 'FETCH'],
    correctIndex: 2,
    category: 'technical',
    difficulty: 'easy',
    tags: ['sql', 'database'],
  },
  {
    text: 'In Object-Oriented Programming, what is encapsulation?',
    options: [
      'Wrapping data and methods into a single unit',
      'Creating multiple instances of a class',
      'Inheriting properties from parent class',
      'Overloading methods',
    ],
    correctIndex: 0,
    category: 'technical',
    difficulty: 'medium',
    tags: ['oop', 'encapsulation'],
  },
  {
    text: 'What does REST stand for in web services?',
    options: [
      'Remote Execution Service Technology',
      'Representational State Transfer',
      'Resource Exchange System Technology',
      'Reliable Execution State Transfer',
    ],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'medium',
    tags: ['rest', 'web-services'],
  },
  {
    text: 'Which HTTP method is idempotent?',
    options: ['POST', 'GET', 'PATCH', 'All of the above'],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'medium',
    tags: ['http', 'rest'],
  },
  {
    text: 'What is a deadlock in operating systems?',
    options: [
      'When a process runs indefinitely',
      'When two or more processes are waiting for each other to release resources',
      'When CPU utilization is 100%',
      'When memory is full',
    ],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'hard',
    tags: ['os', 'deadlock', 'concurrency'],
  },
  {
    text: 'In which layer of the OSI model does HTTP operate?',
    options: ['Transport Layer', 'Network Layer', 'Application Layer', 'Session Layer'],
    correctIndex: 2,
    category: 'technical',
    difficulty: 'medium',
    tags: ['networking', 'osi', 'http'],
  },
  {
    text: 'What is the purpose of an index in a database?',
    options: [
      'To encrypt data',
      'To improve query performance',
      'To backup data',
      'To compress data',
    ],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'medium',
    tags: ['database', 'indexing', 'performance'],
  },
  {
    text: 'Which design pattern ensures a class has only one instance?',
    options: ['Factory Pattern', 'Singleton Pattern', 'Observer Pattern', 'Strategy Pattern'],
    correctIndex: 1,
    category: 'technical',
    difficulty: 'easy',
    tags: ['design-patterns', 'singleton'],
  },
];

const psychometricQuestions = [
  {
    text: 'When working on a team project with a tight deadline, what is your approach?',
    options: [
      'Take charge and assign tasks to team members',
      'Wait for others to suggest a plan',
      'Work independently on your part',
      'Collaborate and discuss the best approach with the team',
    ],
    correctIndex: 3,
    category: 'psychometric',
    difficulty: 'medium',
    tags: ['teamwork', 'leadership'],
  },
  {
    text: 'You receive critical feedback on your work. How do you typically respond?',
    options: [
      'Feel defensive and justify your approach',
      'Accept it gracefully and look for improvement opportunities',
      'Ignore it and continue as before',
      'Ask for specific examples and work on addressing them',
    ],
    correctIndex: 3,
    category: 'psychometric',
    difficulty: 'medium',
    tags: ['feedback', 'growth-mindset'],
  },
  {
    text: 'How do you handle a situation where you disagree with your manager\'s decision?',
    options: [
      'Follow the decision without question',
      'Express your concerns respectfully and provide alternative solutions',
      'Complain to colleagues',
      'Do the minimum required',
    ],
    correctIndex: 1,
    category: 'psychometric',
    difficulty: 'medium',
    tags: ['conflict-resolution', 'communication'],
  },
  {
    text: 'Which statement best describes your work style?',
    options: [
      'I prefer working alone on clearly defined tasks',
      'I thrive in collaborative environments with frequent interaction',
      'I like a mix of independent and team work',
      'I prefer to lead and delegate tasks',
    ],
    correctIndex: 2,
    category: 'psychometric',
    difficulty: 'easy',
    tags: ['work-style', 'personality'],
  },
  {
    text: 'When learning a new technology or skill, what is your preferred method?',
    options: [
      'Reading documentation and tutorials',
      'Hands-on experimentation and projects',
      'Taking structured courses',
      'Learning from colleagues and mentors',
    ],
    correctIndex: 1,
    category: 'psychometric',
    difficulty: 'medium',
    tags: ['learning-style', 'growth'],
  },
  {
    text: 'How do you prioritize tasks when everything seems urgent?',
    options: [
      'Work on the easiest tasks first',
      'Ask someone else to prioritize for me',
      'Assess impact and dependencies, then create a priority list',
      'Work on multiple tasks simultaneously',
    ],
    correctIndex: 2,
    category: 'psychometric',
    difficulty: 'medium',
    tags: ['time-management', 'prioritization'],
  },
  {
    text: 'A colleague is struggling with their workload. What would you do?',
    options: [
      'Focus on your own work',
      'Offer help if you have spare time',
      'Proactively check if they need assistance',
      'Tell the manager about their struggle',
    ],
    correctIndex: 2,
    category: 'psychometric',
    difficulty: 'easy',
    tags: ['empathy', 'teamwork'],
  },
  {
    text: 'How do you handle stress during high-pressure situations?',
    options: [
      'Take short breaks to clear my mind',
      'Work through without stopping',
      'Seek support from colleagues or manager',
      'Break down problems and tackle them systematically',
    ],
    correctIndex: 3,
    category: 'psychometric',
    difficulty: 'medium',
    tags: ['stress-management', 'resilience'],
  },
];

async function seedQuestions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the first institution to associate questions with
    const institution = await Institution.findOne();
    if (!institution) {
      console.log('⚠️  No institution found. Please create an institution first.');
      console.log('   Questions will be created without institution association.');
    }

    const institutionId = institution ? institution._id : null;

    // Clear existing questions (optional - comment out if you want to keep existing)
    // await Question.deleteMany({});
    // console.log('Cleared existing questions');

    // Prepare all questions
    const allQuestions = [
      ...aptitudeQuestions.map(q => ({ ...q, createdBy: institutionId, options: q.options.map(text => ({ text })) })),
      ...technicalQuestions.map(q => ({ ...q, createdBy: institutionId, options: q.options.map(text => ({ text })) })),
      ...psychometricQuestions.map(q => ({ ...q, createdBy: institutionId, options: q.options.map(text => ({ text })) })),
    ];

    // Insert all questions
    const inserted = await Question.insertMany(allQuestions);
    
    console.log(`✅ Successfully seeded ${inserted.length} questions:`);
    console.log(`   - ${aptitudeQuestions.length} Aptitude questions`);
    console.log(`   - ${technicalQuestions.length} Technical questions`);
    console.log(`   - ${psychometricQuestions.length} psychometric questions`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();
