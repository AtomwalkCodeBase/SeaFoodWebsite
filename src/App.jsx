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
import PrawnProductionPlanner from "./pages/prawn-production-planning";
import Orders from "./pages/orders";
import Inventory from "./pages/inventory";
import ConfigDashboardV3 from "./pages/config-dashboard-v3";
import ConfigDashboard from "./pages/ConfigDashboard";
import OrdersScreen from "./pages/OrdersScreen";
import ProductionPlannerV3 from "./pages/production-planner-v3";
import PlanGenerator from "./pages/plan-generator-v3";
import InventoryScreen from "./pages/InventoryScreen";
import CapacityPlanning from "./pages/CapacityPlanning";
import DaliyProductionPlan from "./pages/DaliyProductionPlan";
import BatchScreen from "./pages/BatchScreen";
import UnifiedPlanGenerator from "./pages/unified-plan-generator-v3";
import DailyProductionPlanInner from "./pages/Dailyproductionplan ";


function App() {
  return (
      <AuthProvider>
        <ThemeProvider>
            <Router>
              <Routes>
                {/* Login Route */}
                <Route path="/emp/login" element={<EmpLogin />} />
                 <Route path="/user/login" element={<UserLogin />} />
                 <Route path="/dummy" element={<PrawnProductionPlanner />} />
                 <Route path="/dummy1" element={<ProductionPlannerV3 />} />
                 <Route path="/config" element={<ConfigDashboardV3 />} />
                 <Route path="/order" element={<Orders />} />
                 <Route path="/orders" element={<OrdersScreen />} />
                 <Route path="/inventory" element={<Inventory />} />
                 <Route path="/inventorys" element={<InventoryScreen />} />
                 <Route path="/plan-generator" element={<PlanGenerator />} />
                 <Route path="/capacity" element={<CapacityPlanning />} />
                 <Route path="/production-plan" element={<DaliyProductionPlan />} />
                 <Route path="/batch" element={<BatchScreen />} />
                 <Route path="/new" element={<UnifiedPlanGenerator />} />
                 <Route path="/production-plan2" element={<DailyProductionPlanInner />} />

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
                  <Route path="/config1" element={<ConfigDashboard />} />
                  <Route path="/purchase-requisition" element={<PurchaseRequisitionScreen />} />
                  <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
                  <Route path="/qc-check" element={<QC_Screen />} />
                  <Route path="/qc/manager-dashboard" element={<QCManager />} />
                  <Route path="/qc/view" element={<QCView />} />
                  <Route path="/qc/tester-dashboard" element={<QcTesterDashboard />} />
                  <Route path="/qc/sampleTestScreen" element={<SampleTestScreen />} />
                  <Route path="/POCreationScreen" element={<POCreationScreen />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Catch All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
            <ToastContainer position="top-right" autoClose={3000} />
        </ThemeProvider>
      </AuthProvider>
  );

}

export default App;
