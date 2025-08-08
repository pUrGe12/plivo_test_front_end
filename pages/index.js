import { useState, useEffect } from 'react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function Home() {
  const [mode, setMode] = useState('login'); // or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('plivo_token');
    if (t) setToken(t);
  }, []);

  async function submitAuth() {
    const url = `${API_BASE}/auth/${mode}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (res.ok) {
      localStorage.setItem('plivo_token', j.token);
      setToken(j.token);
      setEmail(''); setPassword('');
    } else {
      alert(j.detail || j.error || 'Auth failed');
    }
  }

  function logout() {
    localStorage.removeItem('plivo_token');
    setToken(null);
    setAnalysis(null);
    setFile(null);
    setPreview(null);
  }

  function onFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnalysis(null);
  }

  async function uploadImage() {
    if (!file) return alert('Choose file first');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file); // <- backend expects 'file'
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('plivo_token')}` },
      body: fd
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert(j.detail || j.error || 'Upload failed');
      return;
    }
    setAnalysis(j);
  }

  if (!token) {
    return (
      <div className="container">
        <div className="header">
          <div className="brand">Plivo Test — Image Analyzer</div>
        </div>
        <div className="form">
          <h3>{mode === 'login' ? 'Login' : 'Register'}</h3>
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="button" onClick={submitAuth}>{mode === 'login' ? 'Login' : 'Register'}</button>
          <div style={{marginTop:12}} className="small">
            <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Create an account' : 'Have an account? Login'}</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div className="brand">Plivo Test — Image Analyzer</div>
          <div className="small">Logged in — token available</div>
        </div>
        <div>
          <button className="button" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700}}>Upload an image</div>
        <input style={{marginTop:8}} type="file" accept="image/*" onChange={onFileChange} />
        {preview && <img className="img-preview" src={preview} alt="preview" />}
        <div style={{marginTop:10}}>
          <button className="button" onClick={uploadImage} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
        </div>
      </div>

      {analysis && (
        <div className="result">
          <div style={{fontWeight:700}}>Analysis</div>
          <div style={{marginTop:8}}><strong>Caption:</strong> {analysis.caption}</div>
          <div style={{marginTop:8}}><strong>Raw:</strong> <pre style={{whiteSpace:'pre-wrap', fontSize:12}}>{JSON.stringify(analysis.raw, null, 2)}</pre></div>
        </div>
      )}
    </div>
  );
}
