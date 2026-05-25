import { BrowserRouter as Router,Routes, Route, Navigate, Outlet} from "react-router-dom";
import { GlobalStyles } from "./styles/GlobalStyles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";

// Auth & Protected Routes
import { AuthProvider } from "./context/AuthContext";
import PurchaseRequisitionScreen from "./pages/PurchaseRequisitionScreen";
import SupplierDashboard from "./pages/SupplierDashboard";
import QC_Screen from "./pages/QcScreen";
import QCManager from "./pages/QCManagerScreen";
import QCView from "./components/Modal/QCView";
import QcTesterDashboard from "./pages/QcTesterScreen";
import SampleTestScreen from "./pages/SampleTestingScreen";
import POCreationScreen from "./pages/POCreationScreen";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import EmpLogin from "./pages/EmpLogin";
import UserLogin from "./pages/UserLogin";
import PrawnProductionPlanner from "./pages/Referance Screen/prawn-production-planning";
import Orders from "./pages/Referance Screen/orders";
import ConfigDashboardV3 from "./pages/Referance Screen/config-dashboard-v3";
import ConfigDashboard from "./pages/ConfigDashboard";
import OrdersScreen from "./pages/OrdersScreen";
import PlanGenerator from "./pages/Referance Screen/plan-generator-v3";
import InventoryScreen from "./pages/InventoryScreen";
import CapacityPlanning from "./pages/CapacityPlanning";
import DaliyProductionPlan from "./pages/DaliyProductionPlan";
import BatchScreen from "./pages/BatchScreen";
// import UnifiedPlanGenerator from "../unified-plan-generator-v3";
import DailyProductionPlanInner from "./pages/Dailyproductionplan ";
import ProductionPlannerV4 from "./pages/Referance Screen/production-planner-v4";
import Inventory from "./pages/inventory";
import UnifiedPlanGenerator from "./pages/Referance Screen/unified-plan-generator-v3";
import NotFound from "./pages/NotFound";
import ProcurementManagerScreen from "./pages/Procurement Module/ProcurementManagerScreen";
// import WorkForceAllocation from "./pages/Production Module/WorkForceAllocation";
import ProcurementPlanning from "./pages/Procurement Module/ProcurementPlanning";
import ProductionPipelineDashboard from "./pages/Production Module/ProductionPipelineDashboard";


function App() {
  return (
      <AuthProvider>
        <ThemeProvider>
            <Router basename="/seafood">
              <Routes>
                {/* Login Route */}
                <Route path="/emp/login" element={<EmpLogin />} />
                 <Route path="/user/login" element={<UserLogin />} />
                 <Route path="/dummy" element={<PrawnProductionPlanner />} />
                 <Route path="/dummy1" element={<ProductionPlannerV4 />} />
                 <Route path="/config" element={<ConfigDashboardV3 />} />
                 <Route path="/order" element={<Orders />} />
                 {/* <Route path="/inventorys" element={<InventoryScreen />} /> */}
                 <Route path="/plan-generator" element={<PlanGenerator />} />
                 <Route path="/production-plan" element={<DaliyProductionPlan />} />
                 <Route path="/batch" element={<BatchScreen />} />
                 <Route path="/new" element={<UnifiedPlanGenerator />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <>
                        <GlobalStyles />
                        <Outlet />
                      </>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/capacity" element={<CapacityPlanning />} />
                    <Route path="/production-plan2" element={<DailyProductionPlanInner />} />
                 <Route path="/inventory" element={<Inventory />} />
                  <Route path="/orders" element={<OrdersScreen />} />
                  <Route path="/config1" element={<ConfigDashboard />} />
                  <Route path="/purchase-requisition" element={<PurchaseRequisitionScreen />} />
                  <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
                  <Route path="/qc-check" element={<QC_Screen />} />
                  <Route path="/qc/manager-dashboard" element={<QCManager />} />
                  <Route path="/qc/view" element={<QCView />} />
                  <Route path="/qc/tester-dashboard" element={<QcTesterDashboard />} />
                  <Route path="/qc/sampleTestScreen" element={<SampleTestScreen />} />
                  <Route path="/POCreationScreen" element={<POCreationScreen />} />
                  <Route path="/procurement-screen" element={<ProcurementManagerScreen />} />
                  {/* <Route path="/work-force" element={<WorkForceAllocation />} /> */}
                  <Route path="/procurement-plan" element={<ProcurementPlanning />} />
                  <Route path="/unsorted-material" element={<ProductionPipelineDashboard />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Catch All */}
                {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <ToastContainer position="top-right" autoClose={3000} />
        </ThemeProvider>
      </AuthProvider>
  );

}

export default App;
