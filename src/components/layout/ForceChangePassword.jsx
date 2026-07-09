import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const ForceChangePassword = () => {
  const { logout, changePasswordSuccess, fetchWithAuth } = useContext(AppContext);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Check rules dynamically
  const rules = [
    { label: 'Au moins 8 caractères', valid: newPass.length >= 8 },
    { label: 'Au moins une lettre majuscule (A-Z)', valid: /[A-Z]/.test(newPass) },
    { label: 'Au moins une lettre minuscule (a-z)', valid: /[a-z]/.test(newPass) },
    { label: 'Au moins un chiffre (0-9)', valid: /[0-9]/.test(newPass) },
    { label: 'Au moins un caractère spécial (ex: @, $, !, %, *, ?, &, etc.)', valid: /[!@#$%^&*(),.?":{}|<>\-_]/.test(newPass) }
  ];

  const allRulesValid = rules.every(r => r.valid);

  const handleSubmit = async () => {
    setErr('');
    if (!currentPass) {
      setErr('Veuillez entrer votre mot de passe actuel.');
      return;
    }
    if (!newPass) {
      setErr('Veuillez entrer un nouveau mot de passe.');
      return;
    }
    if (!allRulesValid) {
      setErr('Le nouveau mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (newPass !== confirmPass) {
      setErr('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:3000/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });

      const data = await res.json();
      if (res.ok) {
        changePasswordSuccess(data.token);
      } else {
        setErr(data.message || 'Une erreur est survenue lors du changement de mot de passe.');
      }
    } catch (error) {
      setErr('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen">
      <div className="login-box" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <img src="/logo-stbg.jpg" alt="STBG Logo" className="stbg-logo-img-lg" />
        </div>
        <div className="login-title">Sécuriser votre compte</div>
        <div className="login-sub">Un changement de mot de passe est requis</div>

        <div className="al al-o" style={{ textAlign: 'left', marginBottom: '20px', lineHeight: '1.4' }}>
          Pour la sécurité de votre compte, veuillez remplacer votre mot de passe initial par un mot de passe fort.
        </div>

        {err && <div className="login-err" style={{ display: 'block', marginBottom: '15px' }}>{err}</div>}

        <div className="lf">
          <label>Mot de passe actuel</label>
          <input
            type="password"
            value={currentPass}
            onChange={e => setCurrentPass(e.target.value)}
            placeholder="Entrez votre mot de passe actuel"
          />
        </div>

        <div className="lf">
          <label>Nouveau mot de passe</label>
          <input
            type="password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Entrez le nouveau mot de passe"
          />
        </div>

        <div className="lf">
          <label>Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            placeholder="Confirmez le nouveau mot de passe"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Dynamic rule display */}
        <div style={{ textAlign: 'left', background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', fontWeight: 'bold', marginBottom: '8px' }}>
            Critères du mot de passe fort :
          </div>
          {rules.map((rule, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: rule.valid ? 'var(--green)' : 'var(--text2)', marginBottom: '5px' }}>
              <span style={{ color: rule.valid ? 'var(--green)' : 'var(--text3)' }}>{rule.valid ? '✓' : '○'}</span>
              <span style={{ textDecoration: rule.valid ? 'line-through' : 'none', opacity: rule.valid ? 0.7 : 1 }}>{rule.label}</span>
            </div>
          ))}
        </div>

        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Traitement...' : 'Confirmer et continuer →'}
        </button>

        <button className="logout-btn" onClick={logout} style={{ marginTop: '12px' }}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default ForceChangePassword;
