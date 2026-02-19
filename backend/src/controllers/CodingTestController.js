const axios = require('axios');
const Question = require('../models/Question');
const Test = require('../models/Test');

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const runCode = async (req, res) => {
  const { code, language, questionId, testId } = req.body;

  if (!code || !language || !questionId) {
    return res.status(400).json({ success: false, message: 'Code, language, and questionId are required' });
  }

  try {
    let question;
    
    // First, check if it's a custom question in a test
    if (testId) {
      const test = await Test.findById(testId);
      if (test && test.customQuestions) {
        question = test.customQuestions.find(q => q._id.toString() === questionId);
      }
    }

    // If not found in customQuestions (or no testId), check main Question library
    if (!question) {
      question = await Question.findById(questionId);
    }

    if (!question || !question.isCoding) {
      return res.status(404).json({ success: false, message: 'Coding question not found' });
    }

    const { testCases } = question;
    const results = [];
    let allPassed = true;

    // Use a map to handle language versioning if needed, or default
    // Piston needs version. We can hardcode commonly used versions or pass from frontend.
    // For now, let's use some reasonable defaults or expect frontend to send it.
    // If frontend sends 'python', we map to 'python' version '3.10.0' etc.
    const runtimes = {
        'javascript': { language: 'javascript', version: '18.15.0' },
        'python': { language: 'python', version: '3.10.0' },
        'java': { language: 'java', version: '15.0.2' },
        'cpp': { language: 'c++', version: '10.2.0' },
        'c': { language: 'c', version: '10.2.0' }
    };

    const runtime = runtimes[language] || { language, version: '*' };

    const fileNames = {
        'javascript': 'index.js',
        'python': 'main.py',
        'java': 'Main.java',
        'cpp': 'main.cpp',
        'c': 'main.c'
    };

    for (const testCase of testCases) {
      try {
        const payload = {
            language: runtime.language,
            version: runtime.version,
            files: [{ 
                name: fileNames[language] || 'script',
                content: code 
            }],
            stdin: testCase.input || '',
            run_timeout: 5000, 
        };

        const response = await axios.post(PISTON_API, payload);
        const { run } = response.data;
        
        const actualOutput = (run.output || '').trim();
        const expectedOutput = (testCase.output || '').trim();
        
        let status = 'Accepted';
        if (run.stderr) {
            status = 'Runtime Error';
        } else if (actualOutput !== expectedOutput) {
            status = 'Wrong Answer';
        } else if (run.signal === 'SIGKILL') {
            status = 'Time Limit Exceeded';
        }

        const passed = status === 'Accepted';
        if (!passed) allPassed = false;

        results.push({
            input: testCase.isHidden ? 'Hidden' : testCase.input,
            expectedOutput: testCase.isHidden ? 'Hidden' : testCase.output,
            actualOutput: testCase.isHidden ? (passed ? 'Hidden' : 'Output Hidden') : actualOutput,
            passed,
            status,
            isHidden: testCase.isHidden,
            stderr: run.stderr,
            stdout: run.stdout,
            time: run.time || 0,
            memory: run.memory || 0,
            signal: run.signal,
            exitCode: run.code
        });

      } catch (err) {
        console.error('Piston execution error:', err.message);
        results.push({
            input: testCase.isHidden ? 'Hidden' : testCase.input,
            passed: false,
            status: 'Execution Error',
            error: 'Execution failed: ' + (err.response?.data?.message || err.message),
            isHidden: testCase.isHidden
        });
        allPassed = false;
      }
    }

    return res.json({ success: true, allPassed, results });

  } catch (error) {
    console.error('CodingController.runCode error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing code' });
  }
};

module.exports = {
    runCode
};
