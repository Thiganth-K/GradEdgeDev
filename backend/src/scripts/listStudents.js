const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const StudentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
});

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

async function listStudents() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const students = await Student.find({}, 'username name');
    console.log('Found students:', students);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

listStudents();
