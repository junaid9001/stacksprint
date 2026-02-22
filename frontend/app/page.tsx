'use client';

import { useEffect, useMemo, useState } from 'react';

type Service = { name: string; port: number };
type ToggleItem = { key: string; label: string };
type CustomFileEntry = { path: string; content: string };
type SchemaField = { name: string; type: string };
type SchemaModel = { name: string; fields: SchemaField[] };
type SavedPreset = { name: string; config: Record<string, unknown> };
type DecisionEntry = { code: string; category: string; message: string };
type ScriptKind = 'bash' | 'powershell';
type OutputTab = 'scripts' | 'decisions' | 'files';

const PRESET_STORAGE_KEY = 'stacksprint_presets_v1';
const SERVICE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const DEFAULT_SERVICES: Service[] = [
  { name: 'users', port: 8081 },
  { name: 'orders', port: 8082 }
];
const DEFAULT_INFRA = { redis: false, kafka: false, nats: false };
const DEFAULT_FEATURES = {
  jwt_auth: false,
  swagger: true,
  github_actions_ci: true,
  makefile: true,
  logger: true,
  global_error_handler: true,
  health_endpoint: true,
  sample_test: true
};
const DEFAULT_FILE_TOGGLES = {
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
};
const DEFAULT_MODELS: SchemaModel[] = [
  { name: 'Item', fields: [{ name: 'id', type: 'int' }, { name: 'name', type: 'string' }] }
];

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
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [infra, setInfra] = useState(DEFAULT_INFRA);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [fileToggles, setFileToggles] = useState(DEFAULT_FILE_TOGGLES);
  const [rootMode, setRootMode] = useState('new');
  const [gitInit, setGitInit] = useState(true);
  const [rootName, setRootName] = useState('my-stacksprint-app');
  const [rootPath, setRootPath] = useState('.');
  const [moduleName, setModuleName] = useState('github.com/example/my-stacksprint-app');
  const [customFolders, setCustomFolders] = useState('');
  const [schemaModels, setSchemaModels] = useState<SchemaModel[]>(DEFAULT_MODELS);
  const [customFileEntries, setCustomFileEntries] = useState<CustomFileEntry[]>([{ path: '', content: '' }]);
  const [removeFolders, setRemoveFolders] = useState('');
  const [removeFiles, setRemoveFiles] = useState('');
  const [bashScript, setBashScript] = useState('');
  const [powerShellScript, setPowerShellScript] = useState('');
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<DecisionEntry[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [error, setError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeScript, setActiveScript] = useState<ScriptKind>('bash');
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>('scripts');
  const [copyStatus, setCopyStatus] = useState('');

  const frameworkChoices = useMemo(() => {
    if (language === 'go') return ['gin', 'fiber'];
    if (language === 'node') return ['express', 'fastify'];
    return ['fastapi', 'django'];
  }, [language]);

  function parseCsv(v: string): string[] {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }

  function formatKeyLabel(key: string): string {
    return key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function formatCategoryLabel(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
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
      models: schemaModels
        .filter((model) => model.name.trim() !== '')
        .map((model) => ({
          name: model.name.trim(),
          fields: model.fields.filter((field) => field.name.trim() !== '')
        })),
      add_files: customFileEntries
        .filter((item) => item.path.trim() !== '')
        .map((item) => ({ path: item.path.trim(), content: item.content })),
      add_service_names: architecture === 'microservices' ? services.map((s) => s.name) : [],
      remove_folders: parseCsv(removeFolders),
      remove_files: parseCsv(removeFiles)
    },
    root: {
      mode: rootMode,
      name: rootName,
      path: rootPath,
      git_init: gitInit,
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
    schemaModels,
    customFileEntries,
    removeFolders,
    removeFiles,
    rootMode,
    gitInit,
    rootName,
    rootPath,
    moduleName
  ]);

  useEffect(() => {
    if (architecture === 'microservices' && serviceCommunication === 'none') {
      setServiceCommunication('http');
    }
    if (architecture !== 'microservices' && services.length < 2) {
      setServices(DEFAULT_SERVICES);
    }
  }, [architecture, serviceCommunication, services.length]);

  useEffect(() => {
    if (rootMode === 'existing' && gitInit) {
      setGitInit(false);
    }
  }, [rootMode, gitInit]);

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

  const steps = ['Stack', 'Data', 'Features', 'Files', 'Root', 'Custom', 'Review'];

  async function fetchScripts(signal?: AbortSignal) {
    setPreviewLoading(true);
    setError('');

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${api}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });
      const raw = await res.text();
      const body = raw ? JSON.parse(raw) : {};
      if (!res.ok) {
        setError(body.error || 'Generation failed');
        setWarnings([]);
        setDecisions([]);
        return;
      }
      setBashScript(body.bash_script || '');
      setPowerShellScript(body.powershell_script || '');
      setFilePaths(Array.isArray(body.file_paths) ? body.file_paths : []);
      setWarnings(Array.isArray(body.warnings) ? body.warnings : []);
      setDecisions(Array.isArray(body.decisions) ? body.decisions : []);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(String(e));
        setWarnings([]);
        setDecisions([]);
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchScripts(controller.signal);
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

  async function copyToClipboard(content: string, label: string) {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus(`${label} copied`);
      setTimeout(() => setCopyStatus(''), 1800);
    } catch {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 1800);
    }
  }

  function updateCustomFile(index: number, patch: Partial<CustomFileEntry>) {
    setCustomFileEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addCustomFileRow() {
    setCustomFileEntries((prev) => [...prev, { path: '', content: '' }]);
  }

  function addModel() {
    setSchemaModels((prev) => [...prev, { name: '', fields: [{ name: 'name', type: 'string' }] }]);
  }

  function removeModel(index: number) {
    setSchemaModels((prev) => {
      if (prev.length === 1) return [{ name: '', fields: [{ name: 'name', type: 'string' }] }];
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateModelName(index: number, name: string) {
    setSchemaModels((prev) => prev.map((model, i) => (i === index ? { ...model, name } : model)));
  }

  function addField(modelIndex: number) {
    setSchemaModels((prev) =>
      prev.map((model, i) => (
        i === modelIndex ? { ...model, fields: [...model.fields, { name: '', type: 'string' }] } : model
      ))
    );
  }

  function removeField(modelIndex: number, fieldIndex: number) {
    setSchemaModels((prev) =>
      prev.map((model, i) => {
        if (i !== modelIndex) return model;
        if (model.fields.length === 1) return { ...model, fields: [{ name: '', type: 'string' }] };
        return { ...model, fields: model.fields.filter((_, idx) => idx !== fieldIndex) };
      })
    );
  }

  function updateField(modelIndex: number, fieldIndex: number, patch: Partial<SchemaField>) {
    setSchemaModels((prev) =>
      prev.map((model, i) => (
        i === modelIndex
          ? {
            ...model,
            fields: model.fields.map((field, idx) => (idx === fieldIndex ? { ...field, ...patch } : field))
          }
          : model
      ))
    );
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
    setError('');
  }

  function applyPreset(config: Record<string, unknown>) {
    setLanguage((config.language as string) || 'go');
    setFramework((config.framework as string) || 'fiber');
    setArchitecture((config.architecture as string) || 'mvp');
    setDb((config.db as string) || 'postgresql');
    setUseORM(Boolean(config.use_orm));
    setServiceCommunication((config.service_communication as string) || 'none');

    const cfgServices = (config.services as Service[]) || [];
    setServices(cfgServices.length > 0 ? cfgServices : DEFAULT_SERVICES);

    setInfra((config.infra as typeof DEFAULT_INFRA) || DEFAULT_INFRA);
    setFeatures((config.features as typeof DEFAULT_FEATURES) || DEFAULT_FEATURES);
    setFileToggles((config.file_toggles as typeof DEFAULT_FILE_TOGGLES) || DEFAULT_FILE_TOGGLES);

    const custom = (config.custom as Record<string, unknown>) || {};
    setCustomFolders(Array.isArray(custom.add_folders) ? (custom.add_folders as string[]).join(', ') : '');
    const models = Array.isArray(custom.models) ? (custom.models as SchemaModel[]) : [];
    setSchemaModels(models.length > 0 ? models : DEFAULT_MODELS);
    const addFiles = Array.isArray(custom.add_files) ? (custom.add_files as CustomFileEntry[]) : [];
    setCustomFileEntries(addFiles.length > 0 ? addFiles : [{ path: '', content: '' }]);
    setRemoveFolders(Array.isArray(custom.remove_folders) ? (custom.remove_folders as string[]).join(', ') : '');
    setRemoveFiles(Array.isArray(custom.remove_files) ? (custom.remove_files as string[]).join(', ') : '');

    const root = (config.root as Record<string, unknown>) || {};
    setRootMode((root.mode as string) || 'new');
    setGitInit(typeof root.git_init === 'boolean' ? (root.git_init as boolean) : true);
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

  const selectedInfraCount = Object.values(infra).filter(Boolean).length;
  const selectedFeatureCount = Object.values(features).filter(Boolean).length;
  const currentScript = activeScript === 'bash' ? bashScript : powerShellScript;
  const currentScriptName = activeScript === 'bash' ? 'Bash' : 'PowerShell';
  const stepErrors = useMemo(() => {
    const errors: string[] = [];
    if (activeStep === 0 && architecture === 'microservices') {
      if (services.length < 2 || services.length > 5) {
        errors.push('Microservices mode requires 2 to 5 services.');
      }
      const seen = new Set<string>();
      services.forEach((svc, index) => {
        const name = svc.name.trim();
        if (!SERVICE_NAME_REGEX.test(name)) {
          errors.push(`Service ${index + 1} has invalid name.`);
        }
        const key = name.toLowerCase();
        if (seen.has(key)) {
          errors.push(`Duplicate service name: ${name || `service-${index + 1}`}.`);
        }
        seen.add(key);
        if (!Number.isInteger(svc.port) || svc.port <= 0) {
          errors.push(`Service ${index + 1} port must be a positive integer.`);
        }
      });
    }
    if (activeStep === 4) {
      if (rootMode === 'new' && !rootName.trim()) {
        errors.push('Root name is required for new mode.');
      }
      if (rootMode === 'existing' && !rootPath.trim()) {
        errors.push('Root path is required for existing mode.');
      }
    }
    return errors;
  }, [activeStep, architecture, rootMode, rootName, rootPath, services]);
  const directorySet = useMemo(() => {
    const set = new Set<string>();
    for (const item of filePaths) {
      const idx = item.lastIndexOf('/');
      if (idx > 0) {
        set.add(item.slice(0, idx));
      }
    }
    return set;
  }, [filePaths]);

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-tag">Backend Initialization Engine</div>
        <h1>StackSprint V2</h1>
        <p className="subtitle">
          Design production-ready backend architecture and download one-click Bash or PowerShell setup scripts.
        </p>
        <div className="hero-metrics">
          <div className="metric-pill">{language.toUpperCase()}</div>
          <div className="metric-pill">{architecture}</div>
          <div className="metric-pill">{selectedInfraCount} Infra</div>
          <div className="metric-pill">{selectedFeatureCount} Features</div>
        </div>
      </header>

      <div className="layout">
        <section className="panel">
          <article className="section section-animated">
            <div className="stepper">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  className={`step-chip ${activeStep === index ? 'active' : ''}`}
                  onClick={() => setActiveStep(index)}
                >
                  <span>{index + 1}</span>
                  {step}
                </button>
              ))}
            </div>
          </article>

          {stepErrors.length > 0 && (
            <article className="section section-animated">
              <div className="inline-errors">
                <strong>Fix Before Continuing</strong>
                {stepErrors.map((item) => <div key={item} className="inline-error-item">- {item}</div>)}
              </div>
            </article>
          )}

          {activeStep === 0 && (
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
          )}

          {activeStep === 0 && (
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

            {architecture === 'microservices' && (
              <div className="microservices-panel open">
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
                    <button
                      type="button"
                      className="ghost"
                      disabled={services.length <= 2}
                      onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </button>
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
            )}

            <div className="field">
              <label>Service communication</label>
              <select value={serviceCommunication} onChange={(e) => setServiceCommunication(e.target.value)}>
                <option value="none">None</option>
                <option value="http">HTTP</option>
                <option value="grpc">gRPC (+ shared proto)</option>
              </select>
            </div>
            </article>
          )}

          {activeStep === 1 && (
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
            <div className="schema-builder">
              <label>Schema Builder</label>
              {schemaModels.map((model, modelIndex) => (
                <div className="schema-model" key={`model-${modelIndex}`}>
                  <div className="row">
                    <input
                      value={model.name}
                      onChange={(e) => updateModelName(modelIndex, e.target.value)}
                      placeholder="Model Name (e.g. User)"
                    />
                    <button type="button" className="ghost" onClick={() => removeModel(modelIndex)}>Remove Model</button>
                  </div>
                  {model.fields.map((field, fieldIndex) => (
                    <div className="row schema-field" key={`field-${modelIndex}-${fieldIndex}`}>
                      <input
                        value={field.name}
                        onChange={(e) => updateField(modelIndex, fieldIndex, { name: e.target.value })}
                        placeholder="field name"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(modelIndex, fieldIndex, { type: e.target.value })}
                      >
                        <option value="string">string</option>
                        <option value="int">int</option>
                        <option value="float">float</option>
                        <option value="bool">bool</option>
                        <option value="datetime">datetime</option>
                      </select>
                      <button type="button" className="ghost" onClick={() => removeField(modelIndex, fieldIndex)}>Remove Field</button>
                    </div>
                  ))}
                  <button type="button" className="ghost" onClick={() => addField(modelIndex)}>Add Field</button>
                </div>
              ))}
              <button type="button" className="ghost" onClick={addModel}>Add Model</button>
            </div>
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
          )}

          {activeStep === 2 && (
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
          )}

          {activeStep === 3 && (
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
                  <span>{formatKeyLabel(k)}</span>
                </label>
              ))}
            </div>
            </article>
          )}

          {activeStep === 4 && (
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
            <label className="toggle orm-toggle">
              <input
                type="checkbox"
                checked={gitInit}
                disabled={rootMode === 'existing'}
                onChange={(e) => setGitInit(e.target.checked)}
              />
              <span>Initialize git repository</span>
            </label>
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
          )}

          {activeStep === 5 && (
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
          )}

          {activeStep === 6 && (
            <article className="section section-animated">
              <div className="section-head">
                <h2>7. Review</h2>
                <span className="hint">Validate decisions before using scripts</span>
              </div>
              <div className="review-grid">
                <div className="review-item"><strong>Language:</strong> {language}</div>
                <div className="review-item"><strong>Framework:</strong> {framework}</div>
                <div className="review-item"><strong>Architecture:</strong> {architecture}</div>
                <div className="review-item"><strong>Database:</strong> {db}</div>
                <div className="review-item"><strong>Infra:</strong> {selectedInfraCount}</div>
                <div className="review-item"><strong>Features:</strong> {selectedFeatureCount}</div>
              </div>
            </article>
          )}

          <div className="actions">
            <div className="step-actions">
              <button type="button" className="ghost" disabled={activeStep === 0} onClick={() => setActiveStep((s) => Math.max(0, s - 1))}>Previous</button>
              <button type="button" className="primary" disabled={activeStep === steps.length - 1 || stepErrors.length > 0} onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}>Next</button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>
        </section>

        <aside className="panel sticky">
          <article className="section section-animated">
            <div className="section-head">
              <h2>Config Health</h2>
              <span className="hint">{previewLoading ? 'Syncing' : 'Live synced'}</span>
            </div>
            <div className="review-grid">
              <div className="review-item"><strong>Step:</strong> {steps[activeStep]}</div>
              <div className="review-item"><strong>Warnings:</strong> {warnings.length}</div>
              <div className="review-item"><strong>Decisions:</strong> {decisions.length}</div>
              <div className="review-item"><strong>Paths:</strong> {filePaths.length}</div>
            </div>
          </article>

          <article className="section section-animated">
            <div className="section-head">
              <h2>Generated Output</h2>
              <span className="hint">Live preview output</span>
            </div>
            <div className="download-row">
              <button className={`ghost ${activeOutputTab === 'scripts' ? 'tab-active' : ''}`} type="button" onClick={() => setActiveOutputTab('scripts')}>Scripts</button>
              <button className={`ghost ${activeOutputTab === 'decisions' ? 'tab-active' : ''}`} type="button" onClick={() => setActiveOutputTab('decisions')}>Decisions</button>
              <button className={`ghost ${activeOutputTab === 'files' ? 'tab-active' : ''}`} type="button" onClick={() => setActiveOutputTab('files')}>Files</button>
            </div>

            {activeOutputTab === 'scripts' && (
              <>
                <div className="download-row">
                  <button className={`ghost ${activeScript === 'bash' ? 'tab-active' : ''}`} type="button" onClick={() => setActiveScript('bash')}>Bash</button>
                  <button className={`ghost ${activeScript === 'powershell' ? 'tab-active' : ''}`} type="button" onClick={() => setActiveScript('powershell')}>PowerShell</button>
                </div>
                <div className="download-row">
                  <button className="primary" disabled={!currentScript} onClick={() => download(activeScript === 'bash' ? 'stacksprint-init.sh' : 'stacksprint-init.ps1', currentScript)}>Download {currentScriptName}</button>
                  <button className="ghost" disabled={!currentScript} onClick={() => copyToClipboard(currentScript, currentScriptName)}>Copy {currentScriptName}</button>
                </div>
                {copyStatus && <div className="copy-status">{copyStatus}</div>}
                <label>{currentScriptName} Preview</label>
                <pre>{currentScript || '# script preview will appear here after configuration is valid'}</pre>
              </>
            )}

            {activeOutputTab === 'decisions' && (
              <>
                {warnings.length > 0 && (
                  <div className="warning-box">
                    <strong>Configuration Warnings</strong>
                    {warnings.map((warning) => <div key={warning} className="warning-item">- {warning}</div>)}
                  </div>
                )}
                <div className="decision-list">
                  {decisions.length === 0 && <div className="file-tree-empty">No decisions yet.</div>}
                  {decisions.map((decision) => (
                    <div key={decision.code + decision.message} className="decision-item">
                      <div className="decision-meta">
                        <span className="decision-badge">{formatCategoryLabel(decision.category)}</span>
                        <span className="decision-code">{decision.code}</span>
                      </div>
                      <div className="decision-message">{decision.message}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeOutputTab === 'files' && (
              <>
                <label>Project Explorer</label>
                <div className="file-tree">
                  {filePaths.length === 0 && <div className="file-tree-empty">No generated paths yet.</div>}
                  {filePaths.map((item) => {
                    const depth = item.split('/').filter(Boolean).length - 1;
                    const isDir = directorySet.has(item) || !item.includes('.');
                    return (
                      <div key={item} className="file-tree-row" style={{ paddingLeft: `${depth * 14 + 8}px` }}>
                        <span className="file-tree-icon">{isDir ? 'd' : 'f'}</span>
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </article>
        </aside>
      </div>
    </main>
  );
}
