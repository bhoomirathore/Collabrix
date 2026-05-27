import { createBrowserRouter } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import EngineersSpace from "./pages/EngineersSpace";
import ResourceHub from "./pages/ResourceHub";
import Wiki from "./pages/Wiki";
import Snippets from "./pages/Snippets";
import CodeReview from "./pages/CodeReview";
import Billing from "./pages/Billing";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <Dashboard />,
      },
      {
        path: "engineers-space",
        element: <EngineersSpace />,
      },
      {
        path: "resource-hub",
        element: <ResourceHub />,
      },
      {
        path: "wiki",
        element: <Wiki />,
      },
      {
        path: "snippets",
        element: <Snippets />,
      },
      {
        path: "code-review",
        element: <CodeReview />,
      },
      {
        path: "billing",
        element: <Billing />,
      },
    ],
  },
]);

export default router;