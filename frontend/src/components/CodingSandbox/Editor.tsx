import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodingSandboxProps {
  initialLanguage?: string;
  initialCode?: string;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', version: '18.15.0' },
  { id: 'python', name: 'Python', version: '3.10.0' },
  { id: 'java', name: 'Java', version: '15.0.2' },
  { id: 'cpp', name: 'C++', version: '10.2.0' },
];

const CODE_SNIPPETS: Record<string, string> = {
  javascript: `console.log("Hello, World!");`,
  python: `print("Hello, World!")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
};

const CodingSandboxEditor: React.FC<CodingSandboxProps> = ({ initialLanguage = 'javascript', initialCode }) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || CODE_SNIPPETS[initialLanguage]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(CODE_SNIPPETS[lang] || '');
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    const langConfig = LANGUAGES.find(l => l.id === language);
    if (!langConfig) return;

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langConfig.id,
          version: langConfig.version,
          files: [{ content: code }],
        }),
      });
      const result = await response.json();
      if (result.run) {
        if (result.run.stderr) {
            setOutput(`Runtime Error:\n${result.run.stderr}`);
        } else {
            setOutput(result.run.output || 'No output');
        }
      } else {
        setOutput('Error executing code');
      }
    } catch (error) {
      setOutput('Failed to connect to execution engine.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Language</span>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className="bg-white/5 text-gray-300 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={runCode} 
          disabled={isRunning}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95 ${
            isRunning 
              ? 'bg-white/5 text-white/20 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
          }`}
        >
          {isRunning ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full"></div>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      {/* Editor & Output Split */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 relative bg-[#1e1e1e]">
          <div className="flex-1">
             <Editor
                height="100%"
                theme="vs-dark" 
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 20, bottom: 20 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                }}
              />
          </div>
        </div>

        {/* Output Area */}
        <div className="lg:w-1/3 bg-[#0a0a0a] flex flex-col border-l border-white/5">
          <div className="bg-[#111] px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em]">Console Output</h3>
            <button 
              onClick={() => setOutput('')}
              className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 p-5 overflow-auto font-mono text-sm custom-scrollbar">
            {output ? (
              <pre className={`whitespace-pre-wrap leading-relaxed ${output.startsWith('Runtime Error') ? 'text-red-400' : 'text-green-400'}`}>{output}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/10 select-none">
                <div className="text-4xl mb-4">⌨️</div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Run code to see output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingSandboxEditor;
