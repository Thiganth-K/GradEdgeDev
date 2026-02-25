const axios = require('axios');

async function test(language, code, version = '*') {
    const PISTON_API = 'http://localhost:2000/api/v2/execute';
    
    const runtimes = {
        'javascript': { language: 'javascript', version: '*' },
        'python': { language: 'python', version: '*' },
        'java': { language: 'java', version: '*' },
        'cpp': { language: 'c++', version: '*' },
        'c': { language: 'c', version: '*' }
    };

    const runtime = runtimes[language] || { language, version: '*' };
    const fileNames = {
        'javascript': 'index.js',
        'python': 'main.py',
        'java': 'Main.java',
        'cpp': 'main.cpp',
        'c': 'main.c'
    };

    const payload = {
        language: runtime.language,
        version: runtime.version,
        files: [{ 
            name: fileNames[language] || 'script',
            content: code 
        }],
        stdin: '',
        run_timeout: 3000, 
    };

    console.log(`\nTesting ${language} (${runtime.language}@${runtime.version})...`);

    try {
        const response = await axios.post(PISTON_API, payload);
        console.log(`SUCCESS [${language}]:`, response.data.run.stdout.trim());
    } catch (err) {
        console.log(`ERROR [${language}]:`, err.message);
        if (err.response) {
            console.log('ERROR DATA:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

async function runTests() {
    await test('javascript', 'console.log("js ok")');
    await test('python', 'print("py ok")');
    await test('java', 'public class Main { public static void main(String[] args) { System.out.println("java ok"); } }');
    await test('cpp', '#include <iostream>\nint main() { std::cout << "cpp ok" << std::endl; return 0; }');
    await test('c', '#include <stdio.h>\nint main() { printf("c ok\\n"); return 0; }');
}

runTests();
