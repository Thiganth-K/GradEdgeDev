const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Question = require('../models/Question');
const Library = require('../models/Library');

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

async function seed() {
    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const codingQuestions = [
            {
                text: "Write a function to find the maximum number in an array.",
                category: 'coding',
                subtopic: 'Algorithms',
                difficulty: 'easy',
                isCoding: true,
                starterCode: `function findMax(arr) {\n    // Your code here\n}\n\n// Example usage for test cases\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\nconst arr = JSON.parse(input);\nconsole.log(findMax(arr));`,
                testCases: [
                    { input: "[1, 2, 3, 4, 5]", output: "5", isHidden: false },
                    { input: "[-10, -5, 0, 5, 10]", output: "10", isHidden: false },
                    { input: "[100, 200, 50, 300]", output: "300", isHidden: true }
                ],
                inLibrary: true
            },
            {
                text: "Write a function to check if a string is a palindrome.",
                category: 'coding',
                subtopic: 'Strings',
                difficulty: 'easy',
                isCoding: true,
                starterCode: `function isPalindrome(str) {\n    // Your code here\n}\n\n// Example usage for test cases\nconst fs = require('fs');\nconst str = fs.readFileSync(0, 'utf8').trim();\nconsole.log(isPalindrome(str));`,
                testCases: [
                    { input: "racecar", output: "true", isHidden: false },
                    { input: "hello", output: "false", isHidden: false },
                    { input: "madam", output: "true", isHidden: true }
                ],
                inLibrary: true
            }
        ];

        for (const qData of codingQuestions) {
            // Check if already exists to avoid duplicates
            const existing = await Question.findOne({ text: qData.text });
            if (existing) {
                console.log(`Question already exists: ${qData.text}`);
                continue;
            }

            const q = await Question.create(qData);
            console.log(`Created question: ${q._id}`);

            // Add to library
            await Library.addQuestionToLibrary(q._id, 'Technical', qData.subtopic);
            console.log(`Added to Library: ${q._id}`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
