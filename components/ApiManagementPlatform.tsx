import React, { useState, useRef } from 'react';
import { Book, Check, ChevronDown, ChevronRight, Code, Copy, Download, Search, Send, Settings, Wifi, X, Server, Signal, Thermometer, Activity, Upload, Play, RefreshCw, List } from 'lucide-react';

const ApiManagementPlatform = () => {
  const [activeTab, setActiveTab] = useState('docs');
  const [activeCategory, setActiveCategory] = useState('wireless');
  const [activeEndpoint, setActiveEndpoint] = useState('getPower');
  const [expanded, setExpanded] = useState(['wireless']);
  const [selectedExample, setSelectedExample] = useState('cli');
  const [connected, setConnected] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState('https://10.223.106.148/ubus/');
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('DoodleSmartRadio');
  const [importOpen, setImportOpen] = useState(false);
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "call", params: ["00000000000000000000000000000000", "session", "login", { "username": "user", "password": "DoodleSmartRadio" }]
  }, null, 2));
  const [responseBody, setResponseBody] = useState('');
  interface HistoryItem {
    endpoint: string;
    status: string;
    timestamp: string;
    duration: number;
  }
  const [testHistory, setTestHistory] = useState<HistoryItem[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);

  interface CategoryEndpoint {
    id: string;
    name: string;
    method: string;
  }

  interface Category {
    id: string;
    name: string;
    icon: React.ReactNode;
    endpoints: CategoryEndpoint[];
  }

  const categories: Category[] = [
    {
      id: 'wireless', name: 'Wireless Settings', icon: <Wifi size={16} />, endpoints: [
        { id: 'getPower', name: 'Get Power', method: 'GET' },
        { id: 'getAssociations', name: 'Get Associations', method: 'GET' },
        { id: 'getChannel', name: 'Get Channel/Frequency', method: 'GET' },
        { id: 'setPower', name: 'Set Power', method: 'SET' }
      ]
    },
    {
      id: 'system', name: 'System Settings', icon: <Settings size={16} />, endpoints: [
        { id: 'getCPULoad', name: 'Get CPU Load', method: 'GET' },
        { id: 'getMemoryUsage', name: 'Get Memory Usage', method: 'GET' }
      ]
    },
    {
      id: 'calibration', name: 'Calibration', icon: <Thermometer size={16} />, endpoints: [
        { id: 'validateCalibration', name: 'Validate MCU Calibration', method: 'GET' }
      ]
    },
    {
      id: 'noise', name: 'Noise Scanning', icon: <Signal size={16} />, endpoints: [
        { id: 'getScanConfig', name: 'Get Scan Config', method: 'GET' }
      ]
    },
    {
      id: 'services', name: 'Services', icon: <Server size={16} />, endpoints: [
        { id: 'restartNetwork', name: 'Restart Network', method: 'SET' }
      ]
    },
    {
      id: 'traffic', name: 'Traffic Prioritization', icon: <Activity size={16} />, endpoints: [
        { id: 'getDiffservStatus', name: 'Get DiffServ Status', method: 'GET' }
      ]
    }
  ];

  interface RequestTemplate {
    jsonrpc: string;
    id: number;
    method: string;
    params: any[];
  }

  const requestTemplates: Record<string, RequestTemplate> = {
    login: { jsonrpc: "2.0", id: 1, method: "call", params: ["00000000000000000000000000000000", "session", "login", { "username": "user", "password": "DoodleSmartRadio" }] },
    getPower: { jsonrpc: "2.0", id: 1, method: "call", params: ["<session_token>", "file", "exec", { "command": "iw", "params": ["wlan0", "info"] }] },
    getCPULoad: { jsonrpc: "2.0", id: 1, method: "call", params: ["<session_token>", "system", "info", {}] }
  };

  interface ResponseType {
    jsonrpc: string;
    id: number;
    result: any;
  }

  const responseTemplates: Record<string, ResponseType> = {
    login: { jsonrpc: "2.0", id: 1, result: { "ubus_rpc_session": "a7d1a9a0d89cec64c36d7e5ae21f9803", "expires": 300, "data": { "username": "user" } } },
    getPower: { jsonrpc: "2.0", id: 1, result: [0, { stdout: "Interface wlan0\n\ttxpower: 30.00 dBm\n\tSSID: DoodleLabs-Mesh" }] },
    getCPULoad: { jsonrpc: "2.0", id: 1, result: { uptime: 123456, load: [0.52, 0.40, 0.38] } }
  };

  const toggleExpanded = (id: string) => {
    expanded.includes(id) ? setExpanded(expanded.filter(i => i !== id)) : setExpanded([...expanded, id]);
  };

  const handleLogin = () => {
    setIsLoading(true);
    const loginRequest = JSON.parse(JSON.stringify(requestTemplates.login));
    loginRequest.params[3].username = username;
    loginRequest.params[3].password = password;
    setRequestBody(JSON.stringify(loginRequest, null, 2));

    setTimeout(() => {
      const token = Math.random().toString(36).substring(2, 15);
      setSessionToken(token);
      setConnected(true);
      setIsLoading(false);
      const response = { ...responseTemplates['login'] };
      if (response.result) response.result.ubus_rpc_session = token;
      setResponseBody(JSON.stringify(response, null, 2));
      const newItem: HistoryItem = {
        endpoint: "login",
        status: "success",
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 100) + 50
      };
      setTestHistory(prev => [newItem, ...prev]);
      if (historyRef.current) historyRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 800);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSessionToken(null);
      setConnected(false);
      setIsLoading(false);
      setResponseBody('');
      setRequestBody(JSON.stringify(requestTemplates.login, null, 2));
      const newItem: HistoryItem = {
        endpoint: "logout",
        status: "success",
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 100) + 50
      };
      setTestHistory(prev => [newItem, ...prev]);
    }, 600);
  };

  const handleEndpointSelect = (categoryId: string, endpointId: string) => {
    setActiveCategory(categoryId);
    setActiveEndpoint(endpointId);
    if (requestTemplates && endpointId in requestTemplates) {
      const template = { ...requestTemplates[endpointId] };
      if (sessionToken && endpointId !== 'login') {
        const params = [...template.params];
        params[0] = sessionToken;
        template.params = params;
      }
      setRequestBody(JSON.stringify(template, null, 2));
      setResponseBody('');
    }
  };

  const handleExecute = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const response = responseTemplates[activeEndpoint as keyof typeof responseTemplates] ||
        { jsonrpc: "2.0", id: 1, result: [0, { success: true }] };
      setResponseBody(JSON.stringify(response, null, 2));

      const newItem: HistoryItem = {
        endpoint: activeEndpoint,
        status: Math.random() > 0.1 ? "success" : "failed",
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 250) + 50
      };

      setTestHistory(prev => [newItem, ...prev]);
      if (historyRef.current) historyRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 800);
  };

  interface EndpointInfo {
    name: string;
    method: string;
    category: string;
  }

  const getEndpointInfo = (): EndpointInfo => {
    if (activeEndpoint === 'login') return { name: "Login", method: "POST", category: "Authentication" };
    for (const category of categories) {
      const endpoint = category.endpoints.find(e => e.id === activeEndpoint);
      if (endpoint) return { name: endpoint.name, method: endpoint.method, category: category.name };
    }
    return { name: "Unknown", method: "GET", category: "Unknown" };
  };

  const endpointInfo = getEndpointInfo();

  const getDescription = (): string => {
    const descriptions: Record<string, string> = {
      login: "Authenticates with the device and returns a session token for API calls.",
      getPower: "Retrieves the current transmit power setting of the radio in dBm.",
      getCPULoad: "Returns the current CPU load average for the device."
    };
    return descriptions[activeEndpoint] || `API endpoint for ${endpointInfo.name}.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      <div className="h-screen flex flex-col">
        <header className="bg-gray-850 shadow-lg border-b border-gray-700">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <img src="https://learn.doodlelabs.com/hubfs/mesh%20rider%20logo.png" alt="Doodle Labs Logo" className="h-10 w-auto mr-3" />
              <h1 className="text-2xl font-bold text-white">Mesh Rider API Platform</h1>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setActiveTab('docs')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'docs' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <Book className="inline-block mr-1" size={16} />Documentation
              </button>
              <button onClick={() => setActiveTab('testing')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'testing' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <Code className="inline-block mr-1" size={16} />Testing Console
              </button>
              <button onClick={() => setActiveTab('batch')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'batch' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <List className="inline-block mr-1" size={16} />Batch Tests
              </button>
            </div>
            <div className="flex items-center">
              <button onClick={connected ? handleLogout : handleLogin} className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${connected ? 'bg-green-600/20 text-green-400 border border-green-700' : 'bg-violet-600/20 text-violet-400 border border-violet-700'}`}>
                {isLoading ? <RefreshCw className="mr-1 animate-spin" size={14} /> : connected ? <Check className="mr-1" size={14} /> : <Wifi className="mr-1" size={14} />}
                {connected ? 'Connected' : isLoading ? 'Connecting...' : 'Connect Device'}
              </button>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-800/50 flex items-center justify-between border-t border-gray-700">
            <div className="relative">
              <input type="text" placeholder="Search endpoints..." className="pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 w-64 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center text-sm text-gray-300">
                <div className={`relative inline-block w-10 h-5 rounded-full ${mockMode ? 'bg-violet-600' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={mockMode} onChange={() => setMockMode(!mockMode)} />
                  <div className={`absolute inset-y-0 ${mockMode ? 'right-0.5' : 'left-0.5'} w-4 h-4 m-0.5 bg-white rounded-full transition-transform`} />
                </div>
                <span className="ml-2">Mock Mode</span>
              </label>
              <button onClick={() => setImportOpen(true)} className="text-sm text-gray-300 hover:text-white flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg">
                <Upload size={14} className="mr-1" />Import Collection
              </button>
              <button className="text-sm text-gray-300 hover:text-white flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg">
                <Download size={14} className="mr-1" />Export Results
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-gray-850 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700 bg-gray-800/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm text-violet-300">Connection</h3>
                <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${connected ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-gray-700/50 text-gray-400 border border-gray-600'}`}>
                  {connected ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 mb-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">API Endpoint URL</label>
                  <div className="flex">
                    <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="flex-1 px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-l-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                    <button title="Verify connection" className="px-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-r-lg border-y border-r border-gray-700">
                      <Play size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
              </div>
              {!connected ? (
                <button onClick={handleLogin} disabled={isLoading} className={`w-full flex justify-center items-center px-3 py-1.5 rounded-lg text-xs font-medium ${isLoading ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
                  {isLoading ? (<><RefreshCw className="mr-1.5 animate-spin" size={12} />Connecting...</>) : (<><Send className="mr-1.5" size={12} />Connect</>)}
                </button>
              ) : (
                <>
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-gray-400">Session Token</label>
                      <button onClick={() => sessionToken && navigator.clipboard.writeText(sessionToken)} className="text-xs text-violet-400 hover:text-violet-300"><Copy size={12} /></button>
                    </div>
                    <div className="mt-1 px-2 py-1.5 bg-gray-800 rounded-lg text-xs font-mono text-green-300 truncate border border-gray-700">{sessionToken?.substring(0, 14)}...</div>
                  </div>
                  <button onClick={handleLogout} className="w-full mt-3 flex justify-center items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300">Disconnect</button>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {categories.map(category => (
                <div key={category.id} className="border-b border-gray-700">
                  <button onClick={() => toggleExpanded(category.id)} className={`w-full flex items-center px-4 py-2 text-sm text-left ${activeCategory === category.id ? 'bg-violet-900/30 text-violet-300 font-medium' : 'text-gray-300 hover:bg-gray-800'}`}>
                    {category.icon}<span className="ml-2">{category.name}</span>
                    <span className="ml-auto">{expanded.includes(category.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  </button>
                  {expanded.includes(category.id) && (
                    <div className="bg-gray-800/30 pl-4 pr-2 py-1">
                      {category.endpoints.map((endpoint) => (
                        <button key={endpoint.id} onClick={() => handleEndpointSelect(category.id, endpoint.id)} className={`w-full flex items-center px-3 py-2 my-1 text-sm text-left rounded-lg ${activeEndpoint === endpoint.id ? 'bg-violet-900/50 text-violet-200' : 'text-gray-300 hover:bg-gray-800'}`}>
                          <span>{endpoint.name}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded-full text-xs ${endpoint.method === 'GET' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-blue-900/40 text-blue-400 border border-blue-800'}`}>{endpoint.method}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
            <div className="bg-gray-850 p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-100">{endpointInfo.name}</h2>
                  <p className="text-sm text-gray-400">{getDescription()}</p>
                </div>
                <button onClick={handleExecute} disabled={isLoading || (!connected && !mockMode)} className={`inline-flex items-center px-4 py-2 shadow-lg rounded-lg text-sm font-medium ${isLoading || (!connected && !mockMode) ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white'}`}>
                  {isLoading ? (<><RefreshCw className="mr-2 animate-spin" size={16} /><span>Running...</span></>) : (<><Send className="mr-2" size={16} /><span>Execute</span></>)}
                </button>
              </div>
            </div>

            {activeTab === 'testing' && (
              <div className="flex-1 flex p-4 space-x-4 overflow-auto">
                <div className="w-1/2 flex flex-col bg-gray-850 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                  <div className="px-4 py-2 bg-gray-800 text-gray-200 text-sm font-medium flex items-center justify-between border-b border-gray-700">
                    <span className="flex items-center"><Code size={14} className="mr-1.5" />Request</span>
                    <button className="text-gray-400 hover:text-violet-300" onClick={() => navigator.clipboard.writeText(requestBody)}><Copy size={14} /></button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-850">
                    <textarea value={requestBody} onChange={(e) => setRequestBody(e.target.value)} className="w-full h-full font-mono text-sm resize-none bg-gray-850 text-gray-200 focus:outline-none" spellCheck="false" />
                  </div>
                </div>

                <div className="w-1/2 flex flex-col bg-gray-850 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                  <div className="px-4 py-2 bg-gray-800 text-gray-200 text-sm font-medium flex items-center justify-between border-b border-gray-700">
                    <span className="flex items-center"><Activity size={14} className="mr-1.5" />Response</span>
                    <button className="text-gray-400 hover:text-violet-300" onClick={() => responseBody && navigator.clipboard.writeText(responseBody)}><Copy size={14} /></button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-850">
                    {responseBody ? (
                      <pre className="font-mono text-sm whitespace-pre-wrap text-gray-200">{responseBody}</pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <p className="text-sm">No response yet. Click Execute to run the request.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiManagementPlatform;