const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const mongoUri = 'mongodb+srv://thiganthworkspace02:Dart2.6D@cluster0.ailjz9l.mongodb.net/';

const StudentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: 'student' }
});

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

async function main() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const students = await Student.find({}, 'username name');
    console.log('Found students:', students);

    if (students.length === 0) {
        console.log('No students found. Creating test student...');
        const testStudent = {
            username: 'student1',
            password: 'password123',
            name: 'Test Student'
        };
        const hash = await bcrypt.hash(testStudent.password, 10);
        await Student.create({
            username: testStudent.username,
            passwordHash: hash,
            name: testStudent.name
        });
        console.log(`Created test student: ${testStudent.username} / ${testStudent.password}`);
    } else {
        console.log('You can use one of the existing usernames. Password might be "password" or "123456" or similar if seeded.');
        // If I can't know the password, I'll create a new known user
        const testUser = await Student.findOne({ username: 'antigravity_test' });
        if (!testUser) {
             const hash = await bcrypt.hash('password123', 10);
             await Student.create({
                username: 'antigravity_test',
                passwordHash: hash,
                name: 'Antigravity Test Student'
            });
            console.log('Created specific test user: antigravity_test / password123');
        } else {
            console.log('Test user exists: antigravity_test / password123');
        }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
