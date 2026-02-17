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

    const targetUser = 'stud1';
    const targetPass = 'stud1';

    const existing = await Student.findOne({ username: targetUser });
    const hash = await bcrypt.hash(targetPass, 10);

    if (existing) {
        console.log(`User ${targetUser} exists. Updating password...`);
        existing.passwordHash = hash;
        await existing.save();
        console.log('Password updated.');
    } else {
        console.log(`Creating user ${targetUser}...`);
        await Student.create({
            username: targetUser,
            passwordHash: hash,
            name: 'Student One'
        });
        console.log('User created.');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
