import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Flame,
  Check,
  X,
  FileCheck2,
  RefreshCw,
  Eye,
  Sliders,
  FolderGit2,
  Plus,
  Clock,
  Settings as SettingsIcon,
  FileText,
  CheckSquare,
  Globe,
  Copy,
  Download,
  LayoutDashboard,
  ListFilter,
  Zap,
  Activity,
  History,
  HardDrive,
  Folder,
  File,
  AlertTriangle,
  ChevronDown,
  Bug,
  Wrench
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Intro3D from './Intro3D';

export default function App() {
  // 3D Cinematic Intro Session Flag
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('ps001_intro_seen'));

  // Active Navigation View ('dashboard' | 'agents' | 'progress' | 'files' | 'preview' | 'tests' | 'logs' | 'recent' | 'settings')
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Backend Health & Model State
  const [backendReady, setBackendReady] = useState(false);
  const [backendInfo, setBackendInfo] = useState({
    model: 'gemini-3.5-flash-lite',
    has_api_key: true,
    sandbox: 'Restricted strictly to workspace/',
    test_timeout_seconds: 15,
    files: ['workspace/hello.py', 'tests/test_hello.py', 'tests/test_server.py'],
  });

  // Project & Workflow State
  const [projectTitle, setProjectTitle] = useState('Student Management Website');
  const [userRequest, setUserRequest] = useState('Create a student management website using Python and HTML.');
  const [step, setStep] = useState('IDLE'); // 'IDLE' | 'PLANNING' | 'PLANNED' | 'DEVELOPING' | 'DEVELOPED' | 'APPLIED' | 'TESTING' | 'TESTED'
  const [plan, setPlan] = useState('');
  
  // Multi-file generated project state
  const [generatedFiles, setGeneratedFiles] = useState({
    'workspace/hello.py': '"""Sample module for PS-001 autonomous software development team workspace."""\n\n\ndef greet(name: str) -> str:\n    """Return a greeting message for the given name."""\n    if not name or not name.strip():\n        return "Hello, Stranger!"\n    return f"Hello, {name.strip()}!"\n',
  });
  const [fileDiffs, setFileDiffs] = useState({});
  const [selectedFile, setSelectedFile] = useState('workspace/hello.py');
  const [previewMode, setPreviewMode] = useState('code'); // 'code' | 'diff' | 'html'
  const [copiedFile, setCopiedFile] = useState(false);

  // Agent Results
  const [primaryFile, setPrimaryFile] = useState('workspace/hello.py');
  const [originalCode, setOriginalCode] = useState('');
  const [proposedCode, setProposedCode] = useState('');
  const [proposedTests, setProposedTests] = useState('');
  const [diffText, setDiffText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [reviewReport, setReviewReport] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [attempt, setAttempt] = useState(1);
  const [errorFeedback, setErrorFeedback] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Advanced Testing Interface States
  const [selectedTestTarget, setSelectedTestTarget] = useState('tests');
  const [testFilter, setTestFilter] = useState('ALL'); // 'ALL' | 'PASSED' | 'FAILED' | 'NOT_RUN'
  const [expandedTestKeys, setExpandedTestKeys] = useState({});
  const [debuggerLoading, setDebuggerLoading] = useState(false);
  const [debuggerResult, setDebuggerResult] = useState(null);
  const [showRawConsole, setShowRawConsole] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // System & Error Logs Stream
  const [logs, setLogs] = useState([
    { id: 1, time: 'Initial', type: 'INFO', msg: 'PS-001 Autonomous Platform online.' },
    { id: 2, time: 'Initial', type: 'AGENT', msg: 'Planner, Developer, Reviewer, and Tester agents active.' },
    { id: 3, time: 'Initial', type: 'SYSTEM', msg: 'Workspace jail active on workspace/ and tests/.' },
  ]);
  const [logFilter, setLogFilter] = useState('ALL');

  // Recent Projects History
  const [recentProjects, setRecentProjects] = useState([
    {
      id: 1,
      title: 'Student Management Website',
      requirement: 'Create a student management website using Python and HTML.',
      timestamp: 'Today, 04:30 AM',
      filesCount: 3,
      status: 'Ready',
      testPassed: true,
    },
    {
      id: 2,
      title: 'Pangram & Palindrome Validator',
      requirement: 'Implement algorithmic is_pangram and is_palindrome text analyzers with edge tests.',
      timestamp: 'Yesterday',
      filesCount: 2,
      status: 'Verified',
      testPassed: true,
    },
    {
      id: 3,
      title: 'Initial Workspace Setup',
      requirement: 'Initialize sample hello.py with greeting logic and pytest test suite.',
      timestamp: '2 days ago',
      filesCount: 2,
      status: 'Verified',
      testPassed: true,
    },
  ]);

  const addLog = (type, msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Date.now() + Math.random(), time, type, msg }, ...prev]);
  };

  // Check Backend Status periodically
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setBackendInfo(data);
        setBackendReady(data.has_api_key);
      }
    } catch (err) {
      console.warn('Backend not yet reachable:', err);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Preset Requirement Templates
  const presetTemplates = [
    {
      title: 'Student Management Website',
      icon: '🎓',
      text: 'Create a student management website using Python and HTML.',
    },
    {
      title: 'Inventory Tracking System',
      icon: '📦',
      text: 'Build an inventory tracking system with SQLite storage and a modern HTML dashboard.',
    },
    {
      title: 'Weather Forecast Dashboard',
      icon: '🌦️',
      text: 'Create a weather forecast and atmospheric analysis dashboard in Python with responsive HTML.',
    },
    {
      title: 'Pangram & Palindrome Suite',
      icon: '🔤',
      text: 'Implement an algorithmic Pangram and Palindrome text analysis suite with full pytest coverage.',
    },
  ];

  // 1. New Project Trigger
  const handleNewProject = async () => {
    try {
      addLog('INFO', 'Initializing new project workspace...');
      const res = await fetch('/api/project/new', { method: 'POST' });
      const data = await res.json();
      
      setStep('IDLE');
      setPlan('');
      setProposedCode('');
      setProposedTests('');
      setDiffText('');
      setFileDiffs({});
      setExplanation('');
      setReviewReport('');
      setTestResults(null);
      setDebuggerResult(null);
      setDebuggerLoading(false);
      setExpandedTestKeys({});
      setTestFilter('ALL');
      setSelectedTestTarget('tests');
      setAttempt(1);
      setErrorFeedback(null);
      setErrorMessage(null);
      setProjectTitle('New AI Project');
      setUserRequest('');
      setSelectedFile('workspace/hello.py');
      setGeneratedFiles({
        'workspace/hello.py': '"""Sample module for PS-001 autonomous software development team workspace."""\n\n\ndef greet(name: str) -> str:\n    """Return a greeting message for the given name."""\n    if not name or not name.strip():\n        return "Hello, Stranger!"\n    return f"Hello, {name.strip()}!"\n'
      });
      addLog('SUCCESS', 'New project workspace ready. Enter requirement to begin.');
      setActiveNav('dashboard');
    } catch (err) {
      setErrorMessage('Failed to initialize new project: ' + err.message);
    }
  };

  // 2. Start Autonomous Development Pipeline
  const handleStartDevelopment = async () => {
    if (!userRequest.trim()) return;
    setErrorMessage(null);
    setStep('PLANNING');
    addLog('PLAN', `Planner Agent analyzing requirement: "${userRequest.slice(0, 48)}..."`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      // Step A: Planner Agent
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: userRequest }),
        signal: controller.signal,
      });

      const planData = await planRes.json();
      if (!planRes.ok) throw new Error(planData.error || 'Planning phase failed');

      setPlan(planData.plan);
      setStep('PLANNED');
      addLog('PLAN', 'Architecture checklist formulated successfully.');

      // Auto-transition to Developer & Reviewer Agents
      setStep('DEVELOPING');
      addLog('DEV', 'Developer Agent generating code, HTML templates, and unit tests...');

      const devRes = await fetch('/api/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planData.plan,
          target_file: 'workspace/hello.py',
          test_file: 'tests/test_hello.py',
          error_feedback: null,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const devData = await devRes.json();
      if (!devRes.ok) throw new Error(devData.error || 'Development phase failed');

      const files = devData.files || {};
      if (devData.proposed_code && !files[devData.target_file]) {
        files[devData.target_file] = devData.proposed_code;
      }
      if (devData.proposed_tests && !files['tests/test_hello.py']) {
        files['tests/test_hello.py'] = devData.proposed_tests;
      }

      setGeneratedFiles(files);
      setFileDiffs(devData.file_diffs || {});
      setPrimaryFile(devData.target_file || Object.keys(files)[0] || 'workspace/hello.py');
      setSelectedFile(Object.keys(files)[0] || 'workspace/hello.py');
      setOriginalCode(devData.original_code || '');
      setProposedCode(devData.proposed_code || '');
      setProposedTests(devData.proposed_tests || '');
      setExplanation(devData.explanation || '');
      setReviewReport(devData.review_report || '');
      setDiffText(devData.diff || '');
      setStep('DEVELOPED');

      addLog('SEC', 'Reviewer Agent audited security & quality standards.');
      addLog('DEV', `Generated ${Object.keys(files).length} project files. Awaiting Human Approval.`);

    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err.name === 'AbortError' ? 'Request timed out after 60s. Please check API connection.' : err.message;
      setErrorMessage(msg);
      addLog('ERROR', msg);
      setStep('IDLE');
    }
  };

  // 3. Apply Code Changes (Human Approval Gate)
  const handleApplyCode = async () => {
    setErrorMessage(null);
    addLog('SYSTEM', 'Human Approval granted. Committing files to workspace/...');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: generatedFiles,
          target_file: primaryFile,
          content: proposedCode,
          test_file: 'tests/test_hello.py',
          test_content: proposedTests,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply files to workspace');

      setStep('APPLIED');
      addLog('SUCCESS', `Committed ${data.written_files?.length || 1} files to disk.`);

      // Refresh status file list
      checkStatus();

      // Trigger Pytest Test Runner
      handleRunTests();
    } catch (err) {
      setErrorMessage(err.message);
      addLog('ERROR', err.message);
    }
  };

  // 4. Run Pytest Tests (Tester Agent)
  const handleRunTests = async (customTarget = null) => {
    const target = customTarget || selectedTestTarget || 'tests';
    setErrorMessage(null);
    setStep('TESTING');
    setIsTesting(true);
    addLog('TEST', `Tester Agent executing verified sandboxed pytest on "${target}"...`);

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_target: target }),
      });

      const data = await res.json();
      setTestResults(data);
      setStep('TESTED');
      setIsTesting(false);

      if (data.success) {
        addLog('SUCCESS', `All ${data.passed_count || data.total} pytest test cases passed (Exit Code 0).`);
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0070f3', '#38bdf8', '#10b981'],
        });
        setRecentProjects((prev) => [
          {
            id: Date.now(),
            title: userRequest.slice(0, 36) + (userRequest.length > 36 ? '...' : ''),
            requirement: userRequest,
            timestamp: 'Just now',
            filesCount: Object.keys(generatedFiles).length || 2,
            status: 'Verified',
            testPassed: true,
          },
          ...prev,
        ]);
      } else {
        const failCount = data.failed_count || 1;
        addLog('ERROR', `Pytest failed (${failCount} failing, exit code ${data.exit_code}). Debugging Agent available.`);
        setErrorFeedback((data.stdout || '') + '\n' + (data.stderr || ''));
      }
    } catch (err) {
      setIsTesting(false);
      setErrorMessage(err.message);
      addLog('ERROR', err.message);
      setStep('APPLIED');
    }
  };

  // 5. Debugging Agent: Root Cause Analysis on Test Failures
  const handleDebugFailure = async (testCase) => {
    setDebuggerLoading(true);
    setDebuggerResult(null);
    const targetFileForDebug = primaryFile || 'workspace/hello.py';
    const testFileForDebug = testCase?.file || 'tests/test_hello.py';
    const testNameForDebug = testCase?.name || 'test_failure';
    const errorDetailsForDebug = testCase?.error || testCase?.summary || errorFeedback || 'Pytest assertion error';

    addLog('AGENT', `Debugging Agent analyzing failure in "${testNameForDebug}"...`);

    try {
      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_name: testNameForDebug,
          error_details: errorDetailsForDebug,
          target_file: targetFileForDebug,
          test_file: testFileForDebug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Debugging Agent failed to analyze test failure');

      setDebuggerResult(data);
      addLog('SUCCESS', `Debugging Agent completed RCA: ${data.root_cause?.slice(0, 75) || 'Diagnosis ready'}`);
    } catch (err) {
      setErrorMessage('Debugger Agent error: ' + err.message);
      addLog('ERROR', 'Debugger Agent error: ' + err.message);
    } finally {
      setDebuggerLoading(false);
    }
  };

  // 6. Apply Bug Fix & Automatically Re-run Tests
  const handleApplyFixAndRetest = async (fixedFiles) => {
    if (!fixedFiles || Object.keys(fixedFiles).length === 0) return;
    setErrorMessage(null);
    addLog('DEV', `Applying Debugger fix across ${Object.keys(fixedFiles).length} files...`);

    try {
      const applyRes = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: fixedFiles,
          target_file: primaryFile,
          content: fixedFiles[primaryFile] || '',
        }),
      });

      const applyData = await applyRes.json();
      if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply bug fix to workspace');

      // Update state files
      setGeneratedFiles((prev) => ({ ...prev, ...fixedFiles }));
      addLog('SUCCESS', `Fixed files committed to workspace. Automatically re-testing...`);

      // Re-run Pytest
      await handleRunTests(selectedTestTarget || 'tests');
      
      // If tests now pass, clear debugger diagnosis
      setDebuggerResult(null);
    } catch (err) {
      setErrorMessage('Failed to apply fix & re-run: ' + err.message);
      addLog('ERROR', 'Failed to apply fix & re-run: ' + err.message);
    }
  };

  // Toggle Test Case Accordion
  const toggleTestExpanded = (key) => {
    setExpandedTestKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 5. Auto-Repair Loop (Attempt 2 & 3)
  const handleAutoRepair = async () => {
    if (attempt >= 3) return;
    setAttempt((prev) => prev + 1);
    setStep('DEVELOPING');
    addLog('AGENT', `Initiating Auto-Repair attempt ${attempt + 1}/3 with traceback feedback...`);

    try {
      const devRes = await fetch('/api/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          target_file: primaryFile,
          test_file: 'tests/test_hello.py',
          error_feedback: errorFeedback,
        }),
      });

      const devData = await devRes.json();
      if (!devRes.ok) throw new Error(devData.error || 'Auto-repair generation failed');

      const files = devData.files || {};
      if (devData.proposed_code) files[primaryFile] = devData.proposed_code;
      if (devData.proposed_tests) files['tests/test_hello.py'] = devData.proposed_tests;

      setGeneratedFiles(files);
      setFileDiffs(devData.file_diffs || {});
      setProposedCode(devData.proposed_code || '');
      setProposedTests(devData.proposed_tests || '');
      setExplanation(devData.explanation || '');
      setReviewReport(devData.review_report || '');
      setDiffText(devData.diff || '');
      setStep('DEVELOPED');
      addLog('SUCCESS', `Auto-Repair attempt ${attempt + 1} generated. Ready for approval.`);
    } catch (err) {
      setErrorMessage(err.message);
      addLog('ERROR', err.message);
    }
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // 6. Download ZIP Handler
  const handleDownloadZip = () => {
    window.location.href = '/api/download/zip';
    addLog('SUCCESS', 'Downloaded generated project as ps001_project.zip.');
  };

  // 7. Download Single File Handler
  const handleDownloadFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.split('/').pop() || 'file.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog('INFO', `Downloaded file: ${filename}`);
  };

  // Overwrite Analysis: Count which files already exist on disk
  const getOverwriteAnalysis = () => {
    const existingList = backendInfo.files || [];
    const proposed = Object.keys(generatedFiles);
    const overwriting = proposed.filter((f) => existingList.includes(f));
    const newFiles = proposed.filter((f) => !existingList.includes(f));
    return { overwriting, newFiles };
  };

  const { overwriting, newFiles } = getOverwriteAnalysis();

  // Calculate Progress Percentage
  const getProgressPercentage = () => {
    switch (step) {
      case 'IDLE': return 10;
      case 'PLANNING': return 25;
      case 'PLANNED': return 40;
      case 'DEVELOPING': return 60;
      case 'DEVELOPED': return 75;
      case 'APPLIED': return 85;
      case 'TESTING': return 92;
      case 'TESTED': return testResults?.success ? 100 : 80;
      default: return 10;
    }
  };

  // Active diff text for currently selected file
  const activeDiff = fileDiffs[selectedFile] || diffText || `--- ${selectedFile} (current)\n+++ ${selectedFile} (proposed)\n@@ Generated File @@\n+ ${selectedFile} ready for commit`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#030712', color: '#f8fafc' }}>
      {/* 3D Cinematic Intro Overlay */}
      {showIntro && <Intro3D onComplete={() => setShowIntro(false)} />}

      {/* ============================================================================== */}
      {/* 1. PROFESSIONAL SIDEBAR NAVIGATION */}
      {/* ============================================================================== */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#070c14',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Logo & Platform Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '0 8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0070f3, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 112, 243, 0.4)',
              }}
            >
              <Cpu size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                PS-001
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Autonomous AI Dev Team</span>
              </div>
            </div>
          </div>

          {/* SECTION: NEW PROJECT ACTION */}
          <button
            onClick={handleNewProject}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0070f3, #2563eb)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              marginBottom: '20px',
              boxShadow: '0 4px 14px rgba(0, 112, 243, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard & Workspace', icon: LayoutDashboard },
              { id: 'agents', label: 'Active AI Agents', icon: Bot, badge: '4 Active' },
              { id: 'progress', label: 'Project Progress', icon: Activity, badge: `${getProgressPercentage()}%` },
              { id: 'files', label: 'Generated Files', icon: FolderGit2, badge: Object.keys(generatedFiles).length },
              { id: 'preview', label: 'Code Preview', icon: Code2 },
              { id: 'tests', label: 'Testing Results', icon: Terminal, badge: testResults?.success ? 'Passing' : null },
              { id: 'logs', label: 'Error Logs & Stream', icon: FileText, badge: logs.length },
              { id: 'recent', label: 'Recent Projects', icon: History },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? 'rgba(0, 112, 243, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(0, 112, 243, 0.25)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? '#38bdf8' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        backgroundColor: isActive ? 'rgba(0, 112, 243, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#38bdf8' : '#94a3b8',
                        fontWeight: 600,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Settings & Engine Status */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={16} color="#94a3b8" />
              <span>Settings</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>v2.5 Ready</span>
          </button>

          <div style={{ marginTop: '12px', padding: '0 4px', fontSize: '0.72rem', color: '#64748b' }}>
            <div>Engine: <span style={{ color: '#38bdf8' }}>{backendInfo.model}</span></div>
            <div>Jail: <span style={{ color: '#10b981' }}>workspace/ strictly locked</span></div>
          </div>
        </div>
      </aside>

      {/* ============================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================================== */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            backgroundColor: '#070c14',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              Autonomous AI Software Development Platform
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 112, 243, 0.15)',
                color: '#38bdf8',
                fontWeight: 600,
                border: '1px solid rgba(0, 112, 243, 0.3)',
              }}
            >
              Enterprise v2.5
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* DOWNLOAD PROJECT ZIP BUTTON IN HEADER */}
            <button
              onClick={handleDownloadZip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Download entire workspace as ZIP"
            >
              <Download size={14} color="#34d399" />
              <span>Download ZIP</span>
            </button>

            <button
              onClick={() => handleRunTests()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <Terminal size={14} color="#38bdf8" />
              <span>Run Pytest</span>
            </button>

            <button
              onClick={() => setShowIntro(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} color="#818cf8" />
              <span>3D Intro</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body Container */}
        <div style={{ padding: '32px', maxWidth: '1420px', margin: '0 auto', width: '100%' }}>
          
          {/* Active Error Notice */}
          {errorMessage && (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.88rem' }}>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ============================================================================== */}
          {/* SECTION 1: ENTER YOUR REQUIREMENT & START DEVELOPMENT */}
          {/* ============================================================================== */}
          <section className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                  What would you like to build today?
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  Enter your project requirements. The autonomous engineering team will formulate architecture, write code and HTML templates, audit security, and execute real pytest tests.
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.78rem',
                  color: '#34d399',
                  fontWeight: 600,
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Backend Ready</span>
              </div>
            </div>

            {/* Template Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {presetTemplates.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserRequest(preset.text);
                    setProjectTitle(preset.title);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: userRequest === preset.text ? 'rgba(0, 112, 243, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: userRequest === preset.text ? '1px solid #0070f3' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: userRequest === preset.text ? '#38bdf8' : '#cbd5e1',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>

            {/* Requirement Input Textarea */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="Enter your requirement (e.g. Create a student management website using Python and HTML.)"
                rows={4}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '12px',
                  fontSize: '0.72rem',
                  color: '#64748b',
                }}
              >
                {userRequest.length} characters
              </div>
            </div>

            {/* Action Bar: Start Development */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <Shield size={14} color="#10b981" />
                <span>Dedicated workspace/ isolation. Unrelated user files strictly protected.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {userRequest && (
                  <button
                    onClick={() => setUserRequest('')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}

                <button
                  onClick={handleStartDevelopment}
                  disabled={!userRequest.trim() || step === 'PLANNING' || step === 'DEVELOPING' || step === 'TESTING'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0070f3, #0284c7)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: userRequest.trim() ? 'pointer' : 'not-allowed',
                    opacity: userRequest.trim() ? 1 : 0.6,
                    boxShadow: '0 4px 18px rgba(0, 112, 243, 0.45)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Zap size={18} />
                  <span>
                    {step === 'PLANNING'
                      ? 'Planner Analyzing...'
                      : step === 'DEVELOPING'
                      ? 'Developer Generating...'
                      : step === 'TESTING'
                      ? 'Running Pytest...'
                      : 'Start Development'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* ============================================================================== */}
          {/* SECTION 2: ACTIVE AI AGENTS */}
          {/* ============================================================================== */}
          <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bot size={20} color="#38bdf8" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Active AI Agents
                </h2>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                4 Specialized Autonomous Engineering Agents
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Agent 1: Planner */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: step === 'PLANNING' ? 'rgba(0, 112, 243, 0.12)' : '#070c14',
                  border: step === 'PLANNING' ? '1px solid #0070f3' : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: step === 'PLANNING' ? '#38bdf8' : '#64748b' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Planner Agent</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: step === 'PLANNING' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: step === 'PLANNING' ? '#38bdf8' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {step === 'PLANNING' ? 'ANALYZING' : plan ? 'DONE' : 'IDLE'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  Software Architect formulating precise implementation specifications and modular checklists.
                </p>
              </div>

              {/* Agent 2: Developer */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: step === 'DEVELOPING' ? 'rgba(129, 140, 248, 0.12)' : '#070c14',
                  border: step === 'DEVELOPING' ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: step === 'DEVELOPING' ? '#818cf8' : '#64748b' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Developer Agent</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: step === 'DEVELOPING' ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: step === 'DEVELOPING' ? '#818cf8' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {step === 'DEVELOPING' ? 'GENERATING' : proposedCode ? 'DONE' : 'IDLE'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  Senior Full-Stack Engineer producing Python backend code, HTML templates, and pytest test suites.
                </p>
              </div>

              {/* Agent 3: Reviewer */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: step === 'DEVELOPING' ? 'rgba(52, 211, 153, 0.08)' : '#070c14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: reviewReport ? '#10b981' : '#64748b' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Reviewer Agent</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: reviewReport ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: reviewReport ? '#34d399' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {reviewReport ? 'AUDITED' : 'IDLE'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  Senior Security Auditor auditing for path injection, subprocess jailing, and PEP 8 compliance.
                </p>
              </div>

              {/* Agent 4: Tester */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: step === 'TESTING' ? 'rgba(245, 158, 11, 0.12)' : '#070c14',
                  border: step === 'TESTING' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: testResults?.success ? '#10b981' : step === 'TESTING' ? '#f59e0b' : '#64748b' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Tester Agent</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: testResults?.success ? 'rgba(16, 185, 129, 0.2)' : step === 'TESTING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: testResults?.success ? '#34d399' : step === 'TESTING' ? '#f59e0b' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {step === 'TESTING' ? 'RUNNING' : testResults?.success ? 'PASSED' : testResults ? 'FAILED' : 'IDLE'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  QA Engineer executing real pytest test suites in sandboxed subprocesses with diagnostic reporting.
                </p>
              </div>
            </div>
          </section>

          {/* ============================================================================== */}
          {/* SECTION 3: PROJECT PROGRESS TRACKER */}
          {/* ============================================================================== */}
          <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="#818cf8" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Project Progress
                </h2>
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8' }}>
                {getProgressPercentage()}% Completed
              </span>
            </div>

            {/* Progress Bar Track */}
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  width: `${getProgressPercentage()}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0070f3, #38bdf8, #10b981)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* Stage Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {[
                { title: '1. Requirement', active: step !== 'IDLE' },
                { title: '2. Architecture', active: ['PLANNED', 'DEVELOPING', 'DEVELOPED', 'APPLIED', 'TESTING', 'TESTED'].includes(step) },
                { title: '3. Code & HTML', active: ['DEVELOPED', 'APPLIED', 'TESTING', 'TESTED'].includes(step) },
                { title: '4. Security Audit', active: ['DEVELOPED', 'APPLIED', 'TESTING', 'TESTED'].includes(step) },
                { title: '5. Human Approval', active: ['APPLIED', 'TESTING', 'TESTED'].includes(step) },
                { title: '6. Pytest Verified', active: step === 'TESTED' && testResults?.success },
              ].map((stg, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: stg.active ? 'rgba(0, 112, 243, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: stg.active ? '1px solid rgba(0, 112, 243, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.74rem',
                    color: stg.active ? '#38bdf8' : '#64748b',
                    fontWeight: stg.active ? 600 : 400,
                    textAlign: 'center',
                  }}
                >
                  {stg.title}
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================================== */}
          {/* SECTION 4 & 5: GENERATED FILES EXPLORER & CODE PREVIEW WORKBENCH */}
          {/* ============================================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', marginBottom: '28px' }}>
            
            {/* SUB-SECTION 4: GENERATED FILES EXPLORER */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderGit2 size={18} color="#38bdf8" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                    Generated Files
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  {Object.keys(generatedFiles).length} Files
                </span>
              </div>

              {/* ZIP DOWNLOAD ACTION BUTTON IN EXPLORER */}
              <button
                onClick={handleDownloadZip}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={15} />
                <span>Download Project as ZIP</span>
              </button>

              {/* File List Tree */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, maxHeight: '420px', overflowY: 'auto' }}>
                {Object.keys(generatedFiles).map((filename) => {
                  const isSelected = selectedFile === filename;
                  const isHtml = filename.endsWith('.html');
                  const isTest = filename.includes('test');
                  const willOverwrite = backendInfo.files?.includes(filename);

                  return (
                    <div
                      key={filename}
                      onClick={() => setSelectedFile(filename)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#0070f3' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid #0070f3' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {isHtml ? (
                          <Globe size={15} color={isSelected ? '#fff' : '#f59e0b'} />
                        ) : isTest ? (
                          <Terminal size={15} color={isSelected ? '#fff' : '#38bdf8'} />
                        ) : (
                          <FileCode size={15} color={isSelected ? '#fff' : '#34d399'} />
                        )}
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {filename}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {willOverwrite ? (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              color: '#f59e0b',
                              fontWeight: 700,
                            }}
                            title="Will overwrite existing file"
                          >
                            MOD
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#34d399',
                              fontWeight: 700,
                            }}
                            title="New file"
                          >
                            NEW
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#64748b',
                          }}
                        >
                          {isHtml ? 'HTML' : isTest ? 'TEST' : 'PY'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Workspace Boundary Notice */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.74rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginBottom: '2px' }}>
                  <HardDrive size={13} />
                  <span>Dedicated Workspace: <code>workspace/</code></span>
                </div>
                <div>Unrelated system files are write-protected.</div>
              </div>
            </div>

            {/* SUB-SECTION 5: CODE PREVIEW & DIFFERENCES WORKBENCH */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Code2 size={18} color="#818cf8" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                    Code & Changes: <code style={{ color: '#38bdf8' }}>{selectedFile}</code>
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Mode Switcher */}
                  <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '2px' }}>
                    <button
                      onClick={() => setPreviewMode('code')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: previewMode === 'code' ? '#0070f3' : 'transparent',
                        color: previewMode === 'code' ? '#fff' : '#94a3b8',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      View Code
                    </button>
                    <button
                      onClick={() => setPreviewMode('diff')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: previewMode === 'diff' ? '#0070f3' : 'transparent',
                        color: previewMode === 'diff' ? '#fff' : '#94a3b8',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      File Differences
                    </button>
                    {selectedFile.endsWith('.html') && (
                      <button
                        onClick={() => setPreviewMode('html')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          backgroundColor: previewMode === 'html' ? '#0070f3' : 'transparent',
                          color: previewMode === 'html' ? '#fff' : '#94a3b8',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Live UI Preview
                      </button>
                    )}
                  </div>

                  {/* Download single file */}
                  <button
                    onClick={() => handleDownloadFile(selectedFile, generatedFiles[selectedFile] || '')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                    title="Download this file"
                  >
                    <Download size={12} />
                    <span>Save</span>
                  </button>

                  {/* Copy button */}
                  <button
                    onClick={() => handleCopyCode(generatedFiles[selectedFile] || '')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: copiedFile ? '#34d399' : '#cbd5e1',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedFile ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* View Container */}
              <div
                style={{
                  flex: 1,
                  borderRadius: '8px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: '380px',
                }}
              >
                {previewMode === 'code' && (
                  <div style={{ display: 'flex', maxHeight: '420px', overflowY: 'auto' }}>
                    {/* Line numbers margin */}
                    <div
                      style={{
                        padding: '16px 10px',
                        backgroundColor: '#04070d',
                        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                        color: '#475569',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        userSelect: 'none',
                        textAlign: 'right',
                        minWidth: '40px',
                      }}
                    >
                      {(generatedFiles[selectedFile] || '').split('\n').map((_, idx) => (
                        <div key={idx}>{idx + 1}</div>
                      ))}
                    </div>

                    {/* Code body */}
                    <pre
                      style={{
                        margin: 0,
                        padding: '16px',
                        fontSize: '0.84rem',
                        lineHeight: '1.5',
                        color: '#e2e8f0',
                        overflowX: 'auto',
                        flex: 1,
                      }}
                    >
                      <code>{generatedFiles[selectedFile] || '# Select a generated file to preview'}</code>
                    </pre>
                  </div>
                )}

                {previewMode === 'diff' && (
                  <pre
                    style={{
                      margin: 0,
                      padding: '16px',
                      fontSize: '0.82rem',
                      lineHeight: '1.5',
                      maxHeight: '420px',
                      overflowY: 'auto',
                    }}
                  >
                    {activeDiff.split('\n').map((line, i) => {
                      let color = '#94a3b8';
                      let bg = 'transparent';
                      if (line.startsWith('+') && !line.startsWith('+++')) {
                        color = '#34d399';
                        bg = 'rgba(16, 185, 129, 0.12)';
                      } else if (line.startsWith('-') && !line.startsWith('---')) {
                        color = '#f87171';
                        bg = 'rgba(239, 68, 68, 0.12)';
                      } else if (line.startsWith('@@')) {
                        color = '#818cf8';
                      }
                      return (
                        <div key={i} style={{ color, backgroundColor: bg, padding: '1px 6px', borderRadius: '2px' }}>
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                )}

                {previewMode === 'html' && selectedFile.endsWith('.html') && (
                  <iframe
                    title="Live HTML Preview"
                    srcDoc={generatedFiles[selectedFile] || ''}
                    style={{
                      width: '100%',
                      height: '420px',
                      border: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />
                )}
              </div>

              {/* HUMAN APPROVAL & OVERWRITE CONFIRMATION GATE */}
              {step === 'DEVELOPED' && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    backgroundColor: overwriting.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0, 112, 243, 0.08)',
                    border: overwriting.length > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(0, 112, 243, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertTriangle size={20} color={overwriting.length > 0 ? '#f59e0b' : '#38bdf8'} />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: overwriting.length > 0 ? '#f59e0b' : '#38bdf8' }}>
                          {overwriting.length > 0 ? 'Human Approval Gate: Overwrite Existing Files?' : 'Human Approval Gate: Write Generated Files?'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {overwriting.length > 0
                            ? `Warning: ${overwriting.length} existing file(s) will be overwritten on disk: ${overwriting.join(', ')}.`
                            : `Review the proposed files above before committing to the workspace.`}
                          {' '}{newFiles.length > 0 && `(${newFiles.length} new file(s) will be created).`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setStep('PLANNED');
                          addLog('INFO', 'User rejected proposed file changes.');
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#94a3b8',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reject Changes
                      </button>
                      <button
                        onClick={handleApplyCode}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '6px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        Approve & Commit to workspace/
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================================== */}
          {/* SECTION 6: TESTING RESULTS PANEL */}
          {/* ============================================================================== */}
          <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
            {/* Header with Title, Status Pill, Target Selector, and Re-run Button */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={22} color="#38bdf8" />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Testing Results
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    Isolated Pytest Execution Engine · Sandboxed 15s Timeout
                  </div>
                </div>
              </div>

              {/* Target Selector & Run Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target:</span>
                  <select
                    value={selectedTestTarget}
                    onChange={(e) => setSelectedTestTarget(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#070c14',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  >
                    <option value="tests">All Test Suites (tests/)</option>
                    {(backendInfo.files || [])
                      .filter((f) => f.startsWith('tests/') && f.endsWith('.py'))
                      .map((tf) => (
                        <option key={tf} value={tf}>
                          {tf}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  onClick={() => handleRunTests(selectedTestTarget)}
                  disabled={isTesting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    backgroundColor: isTesting ? '#1e293b' : '#0070f3',
                    color: '#ffffff',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: isTesting ? 'not-allowed' : 'pointer',
                    boxShadow: isTesting ? 'none' : '0 2px 10px rgba(0, 112, 243, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RefreshCw size={14} className={isTesting ? 'spin' : ''} />
                  <span>{isTesting ? 'Running Pytest...' : 'Re-run Pytest'}</span>
                </button>
              </div>
            </div>

            {/* Overall Status Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: testResults
                  ? testResults.success
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(100, 116, 139, 0.12)',
                border: `1px solid ${
                  testResults
                    ? testResults.success
                      ? 'rgba(16, 185, 129, 0.35)'
                      : 'rgba(239, 68, 68, 0.35)'
                    : 'rgba(100, 116, 139, 0.25)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {testResults ? (
                  testResults.success ? (
                    <CheckCircle2 size={22} color="#10b981" />
                  ) : (
                    <AlertCircle size={22} color="#f87171" />
                  )
                ) : (
                  <Clock size={22} color="#94a3b8" />
                )}
                <div>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: testResults
                        ? testResults.success
                          ? '#34d399'
                          : '#fca5a5'
                        : '#cbd5e1',
                    }}
                  >
                    {testResults
                      ? testResults.success
                        ? `ALL ${testResults.passed_count || testResults.total} TESTS PASSED (EXIT CODE 0)`
                        : `TEST SUITE FAILED (EXIT CODE ${testResults.exit_code})`
                      : 'TESTS NOT EXECUTED YET'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    {testResults
                      ? testResults.summary || (testResults.success ? 'All assertions verified.' : 'Failures detected.')
                      : 'Click "Re-run Pytest" above or "Start Development" to run test cases.'}
                  </div>
                </div>
              </div>

              {testResults && !testResults.success && (
                <button
                  onClick={() => {
                    const failingTest = (testResults.test_cases || []).find((t) => t.status === 'FAILED' || t.status === 'ERROR') || {
                      name: 'pytest_failure',
                      error: testResults.stdout + '\n' + testResults.stderr,
                    };
                    handleDebugFailure(failingTest);
                  }}
                  disabled={debuggerLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    backgroundColor: '#f59e0b',
                    color: '#000000',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: debuggerLoading ? 'wait' : 'pointer',
                  }}
                >
                  <Bug size={14} />
                  <span>{debuggerLoading ? 'Analyzing...' : 'Debug Failures with AI'}</span>
                </button>
              )}
            </div>

            {/* Metric Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Tests</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  {testResults ? testResults.total : 0}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#34d399' }}>Passed</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                  {testResults ? testResults.passed_count : 0}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#f87171' }}>Failed</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                  {testResults ? testResults.failed_count : 0}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Skipped / Not Run</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8', marginTop: '4px' }}>
                  {testResults ? testResults.skipped_count : 'Pending'}
                </div>
              </div>
            </div>

            {/* AI Debugger Diagnosis Panel (if active or loading) */}
            {debuggerLoading && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <RefreshCw size={20} color="#f59e0b" className="spin" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>
                    Debugging Agent Analyzing Test Failure...
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                    Examining traceback, inspecting variable states, and generating verified fix.
                  </div>
                </div>
              </div>
            )}

            {debuggerResult && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '22px',
                  backgroundColor: '#0b1322',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 4px 20px rgba(0, 112, 243, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bug size={18} color="#38bdf8" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>
                      AI Debugger Agent Diagnosis: {debuggerResult.test_name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontWeight: 600,
                    }}
                  >
                    Root Cause Identified
                  </span>
                </div>

                {/* Root Cause Box */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                    Root Cause Analysis
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginTop: '4px', lineHeight: '1.5' }}>
                    {debuggerResult.root_cause || 'Logic or assertion mismatch detected.'}
                  </div>
                </div>

                {/* Diagnosis Full Text */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    padding: '12px',
                    backgroundColor: '#070c14',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {debuggerResult.diagnosis}
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setDebuggerResult(null)}
                    style={{
                      padding: '7px 14px',
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Dismiss
                  </button>

                  {debuggerResult.files && Object.keys(debuggerResult.files).length > 0 && (
                    <button
                      onClick={() => handleApplyFixAndRetest(debuggerResult.files)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 18px',
                        backgroundColor: '#10b981',
                        color: '#000000',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      <Check size={15} />
                      <span>Apply Fix & Re-run Tests ({Object.keys(debuggerResult.files).length} files)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Test Case Filter Tabs */}
            {testResults && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '10px',
                }}
              >
                {[
                  { id: 'ALL', label: `All Tests (${testResults.total || 0})` },
                  { id: 'PASSED', label: `Passed (${testResults.passed_count || 0})`, color: '#10b981' },
                  { id: 'FAILED', label: `Failed (${testResults.failed_count || 0})`, color: '#ef4444' },
                  { id: 'NOT_RUN', label: `Skipped / Not Run (${testResults.skipped_count || 0})` },
                ].map((tab) => {
                  const isActive = testFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTestFilter(tab.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                        backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: isActive ? '#38bdf8' : tab.color || '#94a3b8',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Test Cases List */}
            {testResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {(testResults.test_cases || [])
                  .filter((tc) => {
                    if (testFilter === 'ALL') return true;
                    if (testFilter === 'PASSED') return tc.status === 'PASSED';
                    if (testFilter === 'FAILED') return tc.status === 'FAILED' || tc.status === 'ERROR';
                    if (testFilter === 'NOT_RUN') return tc.status === 'SKIPPED' || tc.status === 'NOT_RUN';
                    return true;
                  })
                  .map((tc, idx) => {
                    const testKey = `${tc.file}::${tc.name}-${idx}`;
                    const isExpanded = expandedTestKeys[testKey] || tc.status === 'FAILED' || tc.status === 'ERROR';
                    const isPassed = tc.status === 'PASSED';
                    const isFailed = tc.status === 'FAILED' || tc.status === 'ERROR';

                    return (
                      <div
                        key={testKey}
                        style={{
                          borderRadius: '8px',
                          backgroundColor: '#070c14',
                          border: `1px solid ${
                            isFailed
                              ? 'rgba(239, 68, 68, 0.3)'
                              : isPassed
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)'
                          }`,
                          overflow: 'hidden',
                          transition: 'border-color 0.2s ease',
                        }}
                      >
                        {/* Summary Row */}
                        <div
                          onClick={() => toggleTestExpanded(testKey)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            backgroundColor: isFailed ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isPassed ? (
                              <CheckCircle2 size={16} color="#10b981" />
                            ) : isFailed ? (
                              <AlertCircle size={16} color="#ef4444" />
                            ) : (
                              <Clock size={16} color="#64748b" />
                            )}

                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#38bdf8',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {tc.file}
                            </span>

                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>
                              {tc.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: isPassed
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : isFailed
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(100, 116, 139, 0.15)',
                                color: isPassed ? '#10b981' : isFailed ? '#f87171' : '#94a3b8',
                              }}
                            >
                              {tc.status}
                            </span>
                            {isExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                          </div>
                        </div>

                        {/* Expandable Failure / Error Details */}
                        {isExpanded && (
                          <div
                            style={{
                              padding: '12px 16px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              backgroundColor: '#04070d',
                            }}
                          >
                            {tc.summary && (
                              <div style={{ fontSize: '0.8rem', color: isFailed ? '#fca5a5' : '#94a3b8', marginBottom: '8px' }}>
                                {tc.summary}
                              </div>
                            )}

                            {tc.error ? (
                              <div>
                                <pre
                                  style={{
                                    fontSize: '0.76rem',
                                    color: '#f87171',
                                    backgroundColor: '#0a0e17',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    overflowX: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.45',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                  }}
                                >
                                  {tc.error}
                                </pre>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDebugFailure(tc);
                                    }}
                                    disabled={debuggerLoading}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 12px',
                                      backgroundColor: '#f59e0b',
                                      color: '#000000',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: debuggerLoading ? 'wait' : 'pointer',
                                    }}
                                  >
                                    <Bug size={13} />
                                    <span>Debug with AI</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.78rem', color: '#10b981' }}>
                                ✓ Test execution completed with exit code 0. All assertions succeeded.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Empty State when Filter has 0 items */}
                {(testResults.test_cases || []).filter((tc) => {
                  if (testFilter === 'ALL') return true;
                  if (testFilter === 'PASSED') return tc.status === 'PASSED';
                  if (testFilter === 'FAILED') return tc.status === 'FAILED' || tc.status === 'ERROR';
                  if (testFilter === 'NOT_RUN') return tc.status === 'SKIPPED' || tc.status === 'NOT_RUN';
                  return true;
                }).length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                    No test cases match filter "{testFilter}".
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                Pytest has not been executed yet. Click "Re-run Pytest" above or "Start Development" to run verified test suites.
              </div>
            )}

            {/* Raw Terminal Console Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                onClick={() => setShowRawConsole(!showRawConsole)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                }}
              >
                <Terminal size={13} />
                <span>{showRawConsole ? 'Hide Raw Pytest Console' : 'View Raw Pytest Console Output'}</span>
              </button>

              {/* Legacy Auto-Repair Option */}
              {testResults && !testResults.success && attempt < 3 && (
                <button
                  onClick={handleAutoRepair}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Full Auto-Repair (Attempt {attempt + 1}/3)</span>
                </button>
              )}
            </div>

            {/* Raw Console Output Block */}
            {showRawConsole && testResults && (
              <pre
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#070c14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.78rem',
                  lineHeight: '1.45',
                  color: '#94a3b8',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {testResults.stdout || testResults.stderr || 'No raw console output.'}
              </pre>
            )}
          </section>

          {/* ============================================================================== */}
          {/* SECTION 7: ERROR LOGS & SYSTEM STREAM */}
          {/* ============================================================================== */}
          <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#f59e0b" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Error Logs & System Console
                </h2>
              </div>

              {/* Log filter */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'INFO', 'DEV', 'TEST', 'ERROR'].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setLogFilter(flt)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: logFilter === flt ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: logFilter === flt ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#070c14',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
              }}
            >
              {logs
                .filter((l) => logFilter === 'ALL' || l.type === logFilter)
                .map((l) => {
                  let color = '#94a3b8';
                  if (l.type === 'ERROR') color = '#f87171';
                  if (l.type === 'SUCCESS') color = '#34d399';
                  if (l.type === 'DEV' || l.type === 'PLAN') color = '#38bdf8';
                  return (
                    <div key={l.id} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>[{l.time}]</span>
                      <span style={{ color, fontWeight: 600, fontSize: '0.76rem' }}>[{l.type}]</span>
                      <span style={{ color: '#cbd5e1' }}>{l.msg}</span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* ============================================================================== */}
          {/* SECTION 8: RECENT PROJECTS */}
          {/* ============================================================================== */}
          <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="#38bdf8" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Recent Projects
                </h2>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Stored Sessions & Project History
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '18px',
                    borderRadius: '10px',
                    backgroundColor: '#070c14',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>{p.title}</h4>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: p.testPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: p.testPassed ? '#34d399' : '#f87171',
                          fontWeight: 600,
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '14px' }}>
                      {p.requirement}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.timestamp} • {p.filesCount} files</span>
                    <button
                      onClick={() => {
                        setUserRequest(p.requirement);
                        setProjectTitle(p.title);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 112, 243, 0.15)',
                        border: '1px solid rgba(0, 112, 243, 0.3)',
                        color: '#38bdf8',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Load Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* ============================================================================== */}
      {/* 9. SETTINGS MODAL */}
      {/* ============================================================================== */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '520px',
              padding: '28px',
              borderRadius: '12px',
              backgroundColor: '#0d1524',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SettingsIcon size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Platform Settings & Configuration
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.86rem' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#070c14' }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>Gemini Model Engine</div>
                <div style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{backendInfo.model} (with smart fallback enabled)</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#070c14' }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>API Key Security</div>
                <div style={{ color: '#10b981', fontSize: '0.82rem' }}>Server-side .env loaded securely. Zero browser exposure.</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#070c14' }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>Workspace Sandbox Jail</div>
                <div style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Strictly restricted to workspace/ and tests/. Path traversal blocked.</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#070c14' }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>Pytest Process Timeout</div>
                <div style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>15 seconds per execution run.</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowIntro(true);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Replay 3D Intro
                </button>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: '#0070f3',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
