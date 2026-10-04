import CrudPage from '../CrudPage';
import { entityConfigs } from '../entityConfigs';

const AdminReservations = () => <CrudPage config={entityConfigs.reservations} />;

export default AdminReservations;
