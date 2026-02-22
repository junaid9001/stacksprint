'use client';

import { useEffect, useMemo, useState } from 'react';

type Service = { name: string; port: number };
type ToggleItem = { key: string; label: string };
type CustomFileEntry = { path: string; content: string };
type SavedPreset = { name: string; config: Record<string, unknown> };

const PRESET_STORAGE_KEY = 'stacksprint_presets_v1';

const infraKeys: ToggleItem[] = [
  { key: 'redis', label: 'Redis' },
  { key: 'kafka', label: 'Kafka' },
  { key: 'nats', label: 'NATS' }
];

const featureKeys: ToggleItem[] = [
  { key: 'jwt_auth', label: 'JWT Auth' },
  { key: 'swagger', label: 'Swagger / OpenAPI' },
  { key: 'github_actions_ci', label: 'GitHub Actions CI' },
  { key: 'makefile', label: 'Makefile' },
  { key: 'logger', label: 'Logger Setup' },
  { key: 'global_error_handler', label: 'Global Error Handler' },
  { key: 'health_endpoint', label: 'Health Endpoint' },
  { key: 'sample_test', label: 'Sample Test File' }
];

export default function Page() {
  const [language, setLanguage] = useState('go');
  const [framework, setFramework] = useState('fiber');
  const [architecture, setArchitecture] = useState('mvp');
  const [db, setDb] = useState('postgresql');
  const [useORM, setUseORM] = useState(true);
  const [serviceCommunication, setServiceCommunication] = useState('none');
  const [services, setServices] = useState<Service[]>([
    { name: 'users', port: 8081 },
    { name: 'orders', port: 8082 }
  ]);
  const [infra, setInfra] = useState({ redis: false, kafka: false, nats: false });
  const [features, setFeatures] = useState({
    jwt_auth: false,
    swagger: true,
    github_actions_ci: true,
    makefile: true,
    logger: true,
    global_error_handler: true,
    health_endpoint: true,
    sample_test: true
  });
  const [fileToggles, setFileToggles] = useState({
    env: true,
    gitignore: true,
    dockerfile: true,
    docker_compose: true,
    readme: true,
    config_loader: true,
    logger: true,
    base_route: true,
    example_crud: true,
    health_check: true
  });
  const [rootMode, setRootMode] = useState('new');
  const [rootName, setRootName] = useState('my-stacksprint-app');
  const [rootPath, setRootPath] = useState('.');
  const [moduleName, setModuleName] = useState('github.com/example/my-stacksprint-app');
  const [customFolders, setCustomFolders] = useState('');
  const [customFileEntries, setCustomFileEntries] = useState<CustomFileEntry[]>([{ path: '', content: '' }]);
  const [removeFolders, setRemoveFolders] = useState('');
  const [removeFiles, setRemoveFiles] = useState('');
  const [bashScript, setBashScript] = useState('');
  const [powerShellScript, setPowerShellScript] = useState('');
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const frameworkChoices = useMemo(() => {
    if (language === 'go') return ['gin', 'fiber'];
    if (language === 'node') return ['express', 'fastify'];
    return ['fastapi', 'django'];
  }, [language]);

  function parseCsv(v: string): string[] {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const payload = useMemo(() => ({
    language,
    framework,
    architecture,
    services: architecture === 'microservices' ? services : [],
    db,
    use_orm: useORM,
    service_communication: serviceCommunication,
    infra,
    features,
    file_toggles: fileToggles,
    custom: {
      add_folders: parseCsv(customFolders),
      add_files: customFileEntries
        .filter((item) => item.path.trim() !== '')
        .map((item) => ({ path: item.path.trim(), content: item.content })),
      add_service_names: services.map((s) => s.name),
      remove_folders: parseCsv(removeFolders),
      remove_files: parseCsv(removeFiles)
    },
    root: {
      mode: rootMode,
      name: rootName,
      path: rootPath,
      git_init: true,
      module: moduleName
    }
  }), [
    language,
    framework,
    architecture,
    services,
    db,
    useORM,
    serviceCommunication,
    infra,
    features,
    fileToggles,
    customFolders,
    customFileEntries,
    removeFolders,
    removeFiles,
    rootMode,
    rootName,
    rootPath,
    moduleName
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedPreset[];
      if (Array.isArray(parsed)) {
        setPresets(parsed);
      }
    } catch {
      setPresets([]);
    }
  }, []);

  async function fetchScripts(mode: 'manual' | 'preview', signal?: AbortSignal) {
    if (mode === 'manual') {
      setLoading(true);
    } else {
      setPreviewLoading(true);
    }
    setError('');

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${api}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Generation failed');
        return;
      }
      setBashScript(body.bash_script || '');
      setPowerShellScript(body.powershell_script || '');
      setFilePaths(Array.isArray(body.file_paths) ? body.file_paths : []);
      setWarnings(Array.isArray(body.warnings) ? body.warnings : []);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(String(e));
      }
    } finally {
      if (mode === 'manual') {
        setLoading(false);
      } else {
        setPreviewLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchScripts('preview', controller.signal);
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [payload]);

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateCustomFile(index: number, patch: Partial<CustomFileEntry>) {
    setCustomFileEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addCustomFileRow() {
    setCustomFileEntries((prev) => [...prev, { path: '', content: '' }]);
  }

  function removeCustomFileRow(index: number) {
    setCustomFileEntries((prev) => {
      if (prev.length === 1) return [{ path: '', content: '' }];
      return prev.filter((_, i) => i !== index);
    });
  }

  function persistPresets(next: SavedPreset[]) {
    setPresets(next);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(next));
  }

  function savePreset() {
    const name = presetName.trim();
    if (!name) {
      setError('Preset name is required.');
      return;
    }
    const next = [{ name, config: payload }, ...presets.filter((p) => p.name !== name)];
    persistPresets(next);
    setPresetName('');
  }

  function applyPreset(config: Record<string, unknown>) {
    setLanguage((config.language as string) || 'go');
    setFramework((config.framework as string) || 'fiber');
    setArchitecture((config.architecture as string) || 'mvp');
    setDb((config.db as string) || 'postgresql');
    setUseORM(Boolean(config.use_orm));
    setServiceCommunication((config.service_communication as string) || 'none');

    const cfgServices = (config.services as Service[]) || [];
    setServices(cfgServices.length > 0 ? cfgServices : [{ name: 'users', port: 8081 }, { name: 'orders', port: 8082 }]);

    setInfra((config.infra as { redis: boolean; kafka: boolean; nats: boolean }) || { redis: false, kafka: false, nats: false });
    setFeatures((config.features as typeof features) || features);
    setFileToggles((config.file_toggles as typeof fileToggles) || fileToggles);

    const custom = (config.custom as Record<string, unknown>) || {};
    setCustomFolders(Array.isArray(custom.add_folders) ? (custom.add_folders as string[]).join(', ') : '');
    const addFiles = Array.isArray(custom.add_files) ? (custom.add_files as CustomFileEntry[]) : [];
    setCustomFileEntries(addFiles.length > 0 ? addFiles : [{ path: '', content: '' }]);
    setRemoveFolders(Array.isArray(custom.remove_folders) ? (custom.remove_folders as string[]).join(', ') : '');
    setRemoveFiles(Array.isArray(custom.remove_files) ? (custom.remove_files as string[]).join(', ') : '');

    const root = (config.root as Record<string, unknown>) || {};
    setRootMode((root.mode as string) || 'new');
    setRootName((root.name as string) || 'my-stacksprint-app');
    setRootPath((root.path as string) || '.');
    setModuleName((root.module as string) || 'github.com/example/my-stacksprint-app');
  }

  function loadPreset(name: string) {
    const match = presets.find((p) => p.name === name);
    if (!match) return;
    applyPreset(match.config);
  }

  function deletePreset(name: string) {
    persistPresets(presets.filter((p) => p.name !== name));
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-tag">Backend Initialization Engine</div>
        <h1>StackSprint V2</h1>
        <p className="subtitle">
          Design production-ready backend architecture and download one-click Bash or PowerShell setup scripts.
        </p>
      </header>

      <div className="layout">
        <section className="panel">
          <article className="section section-animated">
            <div className="section-head">
              <h2>Preset Library</h2>
              <span className="hint">Save and reuse stack configurations</span>
            </div>
            <div className="row">
              <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Preset name (e.g. go-clean-pg)" />
              <button type="button" className="ghost" onClick={savePreset}>Save Preset</button>
            </div>
            <div className="preset-list">
              {presets.length === 0 && <div className="hint">No presets saved yet.</div>}
              {presets.map((preset) => (
                <div key={preset.name} className="preset-item">
                  <span>{preset.name}</span>
                  <div className="preset-actions">
                    <button type="button" className="ghost" onClick={() => loadPreset(preset.name)}>Load</button>
                    <button type="button" className="ghost" onClick={() => deletePreset(preset.name)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>1. Language and Architecture</h2>
              <span className="hint">Core stack selection</span>
            </div>
            <div className="row">
              <div className="field">
                <label>Language</label>
                <select
                  value={language}
                  onChange={(e) => {
                    const next = e.target.value;
                    setLanguage(next);
                    setFramework(next === 'go' ? 'fiber' : next === 'node' ? 'express' : 'fastapi');
                  }}
                >
                  <option value="go">Go</option>
                  <option value="node">Node</option>
                  <option value="python">Python</option>
                </select>
              </div>
              <div className="field">
                <label>Framework</label>
                <select value={framework} onChange={(e) => setFramework(e.target.value)}>
                  {frameworkChoices.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Architecture</label>
              <select value={architecture} onChange={(e) => setArchitecture(e.target.value)}>
                <option value="mvp">MVP</option>
                <option value="clean">Clean Architecture</option>
                <option value="hexagonal">Hexagonal</option>
                <option value="modular-monolith">Modular Monolith</option>
                <option value="microservices">Microservices (2-5)</option>
              </select>
            </div>

            <div className={`microservices-panel ${architecture === 'microservices' ? 'open' : ''}`}>
              <div className="stack">
                {services.map((s, i) => (
                  <div className="row service-row" key={`${s.name}-${i}`}>
                    <input
                      value={s.name}
                      onChange={(e) => setServices(services.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                      placeholder="service name"
                    />
                    <input
                      type="number"
                      value={s.port}
                      onChange={(e) => setServices(services.map((x, idx) => idx === i ? { ...x, port: Number(e.target.value) } : x))}
                      placeholder="port"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="ghost"
                  onClick={() => services.length < 5 && setServices([...services, { name: `service-${services.length + 1}`, port: 8080 + services.length + 1 }])}
                >
                  Add Service
                </button>
                <div className="hint">Keep service count between 2 and 5.</div>
              </div>
            </div>

            <div className="field">
              <label>Service communication</label>
              <select value={serviceCommunication} onChange={(e) => setServiceCommunication(e.target.value)}>
                <option value="none">None</option>
                <option value="http">HTTP</option>
                <option value="grpc">gRPC (+ shared proto)</option>
              </select>
            </div>
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>2. Database and Infra</h2>
              <span className="hint">Runtime dependencies</span>
            </div>
            <div className="field">
              <label>Database</label>
              <select value={db} onChange={(e) => setDb(e.target.value)}>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="none">None</option>
              </select>
            </div>
            <label className="toggle orm-toggle">
              <input type="checkbox" checked={useORM} onChange={(e) => setUseORM(e.target.checked)} />
              <span>Use ORM (GORM / Prisma / SQLAlchemy)</span>
            </label>
            <div className="toggle-grid">
              {infraKeys.map((item) => (
                <label className="toggle" key={item.key}>
                  <input
                    type="checkbox"
                    checked={(infra as Record<string, boolean>)[item.key]}
                    onChange={(e) => setInfra({ ...infra, [item.key]: e.target.checked })}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>3. Optional Features</h2>
              <span className="hint">Boilerplate extras</span>
            </div>
            <div className="toggle-grid">
              {featureKeys.map((item) => (
                <label className="toggle" key={item.key}>
                  <input
                    type="checkbox"
                    checked={(features as Record<string, boolean>)[item.key]}
                    onChange={(e) => setFeatures({ ...features, [item.key]: e.target.checked })}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>4. File Toggles</h2>
              <span className="hint">Default generated files</span>
            </div>
            <div className="toggle-grid">
              {Object.entries(fileToggles).map(([k, v]) => (
                <label className="toggle" key={k}>
                  <input
                    type="checkbox"
                    checked={v}
                    onChange={(e) => setFileToggles({ ...fileToggles, [k]: e.target.checked })}
                  />
                  <span>{k}</span>
                </label>
              ))}
            </div>
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>5. Root Initialization</h2>
              <span className="hint">Target directory setup</span>
            </div>
            <div className="field">
              <label>Root mode</label>
              <select value={rootMode} onChange={(e) => setRootMode(e.target.value)}>
                <option value="new">Create new root folder</option>
                <option value="existing">Use existing root</option>
              </select>
            </div>
            <div className="field">
              {rootMode === 'new' ? (
                <input value={rootName} onChange={(e) => setRootName(e.target.value)} placeholder="new root folder name" />
              ) : (
                <input value={rootPath} onChange={(e) => setRootPath(e.target.value)} placeholder="existing path" />
              )}
            </div>
            {language === 'go' && (
              <div className="field">
                <input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="go module name" />
              </div>
            )}
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>6. Custom Structure Builder</h2>
              <span className="hint">Add or remove paths dynamically</span>
            </div>
            <div className="field">
              <label>Add folders (comma-separated)</label>
              <input value={customFolders} onChange={(e) => setCustomFolders(e.target.value)} placeholder="internal/payments, scripts/dev" />
            </div>
            <div className="file-builder">
              <label>Custom files</label>
              {customFileEntries.map((entry, idx) => (
                <div className="file-item" key={`custom-file-${idx}`}>
                  <input
                    value={entry.path}
                    onChange={(e) => updateCustomFile(idx, { path: e.target.value })}
                    placeholder="File path (e.g. docs/NOTES.md)"
                  />
                  <textarea
                    rows={4}
                    value={entry.content}
                    onChange={(e) => updateCustomFile(idx, { content: e.target.value })}
                    placeholder="File content"
                  />
                  <button type="button" className="ghost" onClick={() => removeCustomFileRow(idx)}>Remove File</button>
                </div>
              ))}
              <button type="button" className="ghost" onClick={addCustomFileRow}>Add Another File</button>
            </div>
            <div className="field">
              <label>Remove folders (comma-separated)</label>
              <input value={removeFolders} onChange={(e) => setRemoveFolders(e.target.value)} placeholder="internal/logger" />
            </div>
            <div className="field">
              <label>Remove files (comma-separated)</label>
              <input value={removeFiles} onChange={(e) => setRemoveFiles(e.target.value)} placeholder="README.md, .env" />
            </div>
          </article>

          <div className="actions">
            <button className="primary" disabled={loading} onClick={() => fetchScripts('manual')}>
              {loading ? 'Generating...' : 'Generate Scripts'}
            </button>
            {error && <div className="error">{error}</div>}
          </div>
        </section>

        <aside className="panel sticky">
          <article className="section section-animated">
            <div className="section-head">
              <h2>Generated Output</h2>
              <span className="hint">Download script and run locally</span>
            </div>
            <p className="hint">After running your script, execute `docker compose up --build` in the generated project.</p>
            <div className="preview-status">{previewLoading ? 'Updating live preview...' : 'Live preview synced'}</div>
            {warnings.length > 0 && (
              <div className="warning-box">
                <strong>Configuration Warnings</strong>
                {warnings.map((warning) => <div key={warning} className="warning-item">- {warning}</div>)}
              </div>
            )}
            <div className="download-row">
              <button className="primary" disabled={!bashScript} onClick={() => download('stacksprint-init.sh', bashScript)}>Download Bash</button>
              <button className="ghost" disabled={!powerShellScript} onClick={() => download('stacksprint-init.ps1', powerShellScript)}>Download PowerShell</button>
            </div>
            <label>Project Explorer</label>
            <div className="file-tree">
              {filePaths.length === 0 && <div className="file-tree-empty">No generated paths yet.</div>}
              {filePaths.map((item) => {
                const depth = item.split('/').filter(Boolean).length - 1;
                const isDir = !item.includes('.');
                return (
                  <div key={item} className="file-tree-row" style={{ paddingLeft: `${depth * 14 + 8}px` }}>
                    <span className="file-tree-icon">{isDir ? 'd' : 'f'}</span>
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
            <label>Script Preview</label>
            <pre>{bashScript || '# script preview will appear here after configuration is valid'}</pre>
          </article>
        </aside>
      </div>
    </main>
  );
}