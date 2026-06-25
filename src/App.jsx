import { useContext } from 'react';
import './App.css';
import { AppContext } from './context/AppContext';
import Login from './components/layout/Login';
import AppShell from './components/layout/AppShell';
import PrintLayout from './components/common/PrintLayout';

function App() {
  const { currentUser, printDemande } = useContext(AppContext);

  return (
    <>
      <PrintLayout demande={printDemande} />
      {!currentUser ? <Login /> : <AppShell />}
    </>
  );
}

export default App;
