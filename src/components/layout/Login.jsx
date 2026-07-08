import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';

const Login = () => {
  const { login } = useContext(AppContext);
  const [uid, setUid] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load users from database for display
    const loadUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/users/public');
        if (res.ok) {
          const dbUsers = await res.json();
          const formattedUsers = dbUsers.map(u => ({
            id: u.username,
            name: u.name,
            svc: u.svc,
            role: u.role,
            code: u.code,
            dbId: u.id
          }));
          setUsers(formattedUsers);
          if (formattedUsers.length > 0) {
            setUid(formattedUsers[0].id);
          }
        } else {
          console.error('Failed to load users from database');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      }
      setLoading(false);
    };

    loadUsers();
  }, []);

  const handleLogin = async () => {
    setErr('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uid, password: pass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user && data.token) {
          localStorage.setItem('token', data.token);
          const success = await login(uid, pass, data.user.id, data.user);
          if (!success) setErr('Échec de la connexion.');
          return;
        }
      }

      if (res.status === 401 || res.status === 403) {
        setErr('Identifiants invalides ou accès refusé.');
        return;
      }
      setErr('Erreur lors de la connexion.');
    } catch (error) {
      localStorage.removeItem('token');
      setErr('Impossible de joindre le serveur backend.');
    }
  };

  if (loading) {
    return <div id="login-screen"><div className="login-box">Chargement...</div></div>;
  }

  return (
    <div id="login-screen">
      <div className="login-box">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <img src="/logo-stbg.jpg" alt="STBG Logo" className="stbg-logo-img-lg" />
        </div>
        <div className="login-title">ArchivePro</div>
        <div className="login-sub">Société Tunisienne des Boissons Gazeuses</div>
        <div className="lf">
          <label>Compte utilisateur</label>
          <select value={uid} onChange={e => setUid(e.target.value)}>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.svc})</option>
            ))}
          </select>
        </div>
        <div className="lf">
          <label>Mot de passe</label>
          <input
            type="password"
            placeholder="********"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button className="login-btn" onClick={handleLogin}>Connexion →</button>
        {err && <div className="login-err" style={{ display: 'block' }}>{err}</div>}
      </div>
    </div>
  );
};

export default Login;
