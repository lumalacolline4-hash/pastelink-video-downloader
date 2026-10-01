import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Server, Shield, FileText } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'docker' | 'architecture'>('endpoints');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <Code2 className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">ClipVault REST API & Architecture</h3>
              <p className="text-xs text-slate-400">Headless media extraction & streaming endpoints</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-2">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'endpoints'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'docker'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Docker & Deployment
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Security & SSRF
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              {/* Endpoint 1: /api/parse */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-400 border border-indigo-500/30">
                      POST
                    </span>
                    <span className="font-mono text-xs font-bold text-white">/api/parse</span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST http://localhost:3000/api/parse \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://www.youtube.com/watch?v=aqz-KE-bpKQ"}'`,
                        'curl-parse'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white"
                  >
                    {copiedKey === 'curl-parse' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>cURL</span>
                  </button>
                </div>
                <p className="mt-2 text-slate-400">
                  Validates target media URL and extracts metadata (title, formats, durations, resolutions) without downloading media bytes.
                </p>
                <div className="mt-2.5 rounded bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300">
                  <span className="text-slate-500">// Request Payload</span>
                  <br />
                  {`{ "url": "https://www.tiktok.com/@user/video/123456" }`}
                </div>
              </div>

              {/* Endpoint 2: /api/download/start */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      POST
                    </span>
                    <span className="font-mono text-xs font-bold text-white">/api/download/start</span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST http://localhost:3000/api/download/start \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://...","formatType":"video","format":"mp4","resolution":"1080p","stripWatermark":true}'`,
                        'curl-start'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white"
                  >
                    {copiedKey === 'curl-start' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>cURL</span>
                  </button>
                </div>
                <p className="mt-2 text-slate-400">
                  Creates an asynchronous download job with FFmpeg multiplexing and returns a unique <code className="text-indigo-400">taskId</code>.
                </p>
                <div className="mt-2.5 rounded bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300">
                  <span className="text-slate-500">// Response</span>
                  <br />
                  {`{ "taskId": "550e8400-e29b-41d4-a716-446655440000", "message": "Download task scheduled" }`}
                </div>
              </div>

              {/* Endpoint 3: /api/download/progress/:taskId */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-400 border border-sky-500/30">
                      GET
                    </span>
                    <span className="font-mono text-xs font-bold text-white">/api/download/progress/:taskId</span>
                  </div>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    text/event-stream
                  </span>
                </div>
                <p className="mt-2 text-slate-400">
                  Server-Sent Events (SSE) stream emitting real-time percentage, download speed, ETA, and final download URLs.
                </p>
              </div>

              {/* Endpoint 4: /api/download/file/:taskId */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-400 border border-purple-500/30">
                      GET
                    </span>
                    <span className="font-mono text-xs font-bold text-white">/api/download/file/:taskId</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Content-Disposition: attachment</span>
                </div>
                <p className="mt-2 text-slate-400">
                  Streams the finalized MP4/MP3 media file directly to the client browser with automatic buffer cleanup.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Server className="h-4 w-4 text-indigo-400" />
                <span>Production Containerization</span>
              </div>
              <p className="text-slate-400">
                ClipVault ships with a ready-to-run multi-stage <code className="text-indigo-300">Dockerfile</code> and <code className="text-indigo-300">docker-compose.yml</code> configured with FFmpeg, Cobalt API engine, and Node 22.
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-[11px] text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span># Build and run containers in background</span>
                  <button
                    onClick={() => copyToClipboard('docker compose up -d --build', 'docker-cmd')}
                    className="hover:text-white"
                  >
                    {copiedKey === 'docker-cmd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <code>docker compose up -d --build</code>
                <div className="text-slate-500 mt-2"># View real-time streaming logs</div>
                <code>docker compose logs -f clipvault-web</code>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Security Protections</span>
              </div>
              <ul className="list-disc pl-4 space-y-2 text-slate-400">
                <li>
                  <strong className="text-white">SSRF Defense:</strong> Restricts all loopbacks, local subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and cloud metadata endpoints (169.254.169.254).
                </li>
                <li>
                  <strong className="text-white">Command Injection Mitigation:</strong> Processes are spawned strictly via <code className="text-indigo-300">child_process.spawn</code> with explicit string arrays, disabling any shell command interpolation.
                </li>
                <li>
                  <strong className="text-white">Automated Cleanup:</strong> Downloaded files are quarantined in <code className="text-indigo-300">/tmp/clipvault-downloads</code> and pruned every 30 minutes.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 p-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
