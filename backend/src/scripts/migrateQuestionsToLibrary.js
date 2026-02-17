const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Question = require('../models/Question');
const Library = require('../models/Library');

/**
 * Migration script to add existing questions to library
 * This script will:
 * 1. Set inLibrary flag to true for all questions
 * 2. Add all questions to the Library collection
 */

async function migrateQuestions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all questions
    const questions = await Question.find({});
    console.log(`📊 Found ${questions.length} questions in database`);

    if (questions.length === 0) {
      console.log('⚠️  No questions found. Please run seed script first.');
      process.exit(0);
    }

    let updatedCount = 0;
    let libraryCount = 0;
    let errors = [];

    for (const q of questions) {
      try {
        // Ensure subtopic exists FIRST (required for Library and Question model)
        let needsUpdate = false;
        
        if (!q.subtopic) {
          const defaultSubtopics = {
            aptitude: 'General Aptitude',
            technical: 'General Technical',
            psychometric: 'General Psychometric'
          };
          q.subtopic = defaultSubtopics[q.category] || 'General';
          needsUpdate = true;
          console.log(`  Updated subtopic for question: ${q._id}`);
        }

        // Update inLibrary flag if not already set
        if (!q.inLibrary) {
          q.inLibrary = true;
          needsUpdate = true;
        }
        
        // Save if any updates needed
        if (needsUpdate) {
          await q.save();
          updatedCount++;
        }

        // Map category to main topic
        const topicMap = {
          'aptitude': 'Aptitude',
          'technical': 'Technical',
          'psychometric': 'Psychometric'
        };
        const topic = topicMap[q.category] || 'Aptitude';

        // Add to Library collection (will skip if already exists)
        await Library.addQuestionToLibrary(q._id, topic, q.subtopic);
        libraryCount++;

      } catch (err) {
        errors.push({
          questionId: q._id,
          error: err.message
        });
        console.error(`⚠️  Error processing question ${q._id}:`, err.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated inLibrary flag: ${updatedCount} questions`);
    console.log(`   ✅ Added to Library collection: ${libraryCount} questions`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors encountered: ${errors.length}`);
      errors.forEach(e => {
        console.log(`      - Question ${e.questionId}: ${e.error}`);
      });
    }

    // Verify Library entries
    const libraryEntries = await Library.countDocuments();
    console.log(`\n📚 Total Library entries: ${libraryEntries}`);

    // Show breakdown by category
    const aptitudeCount = await Question.countDocuments({ category: 'aptitude', inLibrary: true });
    const technicalCount = await Question.countDocuments({ category: 'technical', inLibrary: true });
    const psychometricCount = await Question.countDocuments({ category: 'psychometric', inLibrary: true });

    console.log('\n📊 Questions by Category (inLibrary=true):');
    console.log(`   📚 Aptitude: ${aptitudeCount}`);
    console.log(`   💻 Technical: ${technicalCount}`);
    console.log(`   🧠 Psychometric: ${psychometricCount}`);
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateQuestions();
