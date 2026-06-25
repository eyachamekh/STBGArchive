import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

// Import Panels
import Dashboard from '../panels/Dashboard';
import NouvelleDemande from '../panels/NouvelleDemande';
import MesDemandes from '../panels/MesDemandes';
import Consultation from '../panels/Consultation';
import GestionConsultations from '../panels/GestionConsultations';
import Validation from '../panels/Validation';
import Registre from '../panels/Registre';
import Doublons from '../panels/Doublons';
import Delais from '../panels/Delais';
import Locaux from '../panels/Locaux';
import Destruction from '../panels/Destruction';
import Procedure from '../panels/Procedure';
import Users from '../panels/Users';

const AppShell = () => {
  const { activePanel } = useContext(AppContext);

  return (
    <div id="app-shell" className="on">
      <Topbar />
      <div className="app-body">
        <Sidebar />
        <div className="mc">
          {activePanel === 'dashboard' && <Dashboard />}
          {activePanel === 'nouvelle' && <NouvelleDemande />}
          {activePanel === 'mes' && <MesDemandes />}
          {activePanel === 'consultation' && <Consultation />}
          {activePanel === 'gestion-consult' && <GestionConsultations />}
          {activePanel === 'validation' && <Validation />}
          {activePanel === 'registre' && <Registre />}
          {activePanel === 'doublons' && <Doublons />}
          {activePanel === 'delais' && <Delais />}
          {activePanel === 'locaux' && <Locaux />}
          {activePanel === 'destruction' && <Destruction />}
          {activePanel === 'procedure' && <Procedure />}
          {activePanel === 'users' && <Users />}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
