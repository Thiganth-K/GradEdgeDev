const axios = require('axios');
const Question = require('../models/Question');
const Test = require('../models/Test');

const PISTON_API = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
const PISTON_KEY = process.env.PISTON_API_KEY;

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
    const runtimesMap = {
        'javascript': { language: 'javascript', version: '20.11.1' },
        'python': { language: 'python', version: '3.12.0' },
        'java': { language: 'java', version: '15.0.2' },
        'cpp': { language: 'c++', version: '10.2.0' },
        'c': { language: 'c', version: '10.2.0' }
    };

    const runtime = runtimesMap[language] || { language, version: '*' };

    const fileNamesMap = {
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
                name: fileNamesMap[language] || 'script',
                content: code 
            }],
            stdin: testCase.input || '',
            run_timeout: 2000, 
        };

        console.log('Sending Piston Payload for TestCase:', JSON.stringify(payload, null, 2));

        const config = {};
        if (PISTON_KEY) {
            config.headers = { 'Authorization': PISTON_KEY };
        }

        const response = await axios.post(PISTON_API, payload, config);
        const { run } = response.data;
        
        const actualOutput = (run.output || '').trim();
        const expectedOutput = (testCase.output || '').trim();
        
        let status = 'Accepted';
        const runtimeTime = run.time ? parseFloat(run.time) * 1000 : 0; // Convert to ms
        const runtimeMemory = run.memory ? parseInt(run.memory) : 0; // In KB

        if (run.stderr && !run.stdout) {
            status = 'Runtime Error';
        } else if (actualOutput !== expectedOutput) {
            status = 'Wrong Answer';
        } else if (run.signal === 'SIGKILL' || (question.maxTimeMs && runtimeTime > question.maxTimeMs)) {
            status = 'Time Limit Exceeded';
        } else if (question.maxMemoryKb && runtimeMemory > question.maxMemoryKb) {
            status = 'Memory Limit Exceeded';
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
        if (err.response) {
            console.error('Piston Error Data:', JSON.stringify(err.response.data, null, 2));
        }
        results.push({
            input: testCase.isHidden ? 'Hidden' : testCase.input,
            passed: false,
            status: 'Execution Error',
            error: 'Execution failed: ' + (err.response?.data?.message || err.message),
            payload: {
                language: language,
                version: runtime.version,
                stdin: testCase.input
            },
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
