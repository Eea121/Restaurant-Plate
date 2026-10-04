import CrudPage from '../CrudPage';
import { entityConfigs } from '../entityConfigs';

const AdminMenuItems = () => <CrudPage config={entityConfigs.menuItems} />;

export default AdminMenuItems;
