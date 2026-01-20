import { Refine } from "@refinedev/core";
import {
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  ThemedTitleV2,
  useNotificationProvider,
} from "@refinedev/antd";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import "@refinedev/antd/dist/reset.css";

import { supabaseClient } from "./supabaseClient";
import {
  FeatureRequestList,
  FeatureRequestEdit,
  FeatureRequestShow,
} from "./pages/feature-requests";

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/admin">
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#00d8ff",
            colorBgBase: "#0a0a0f",
            colorBgContainer: "#141419",
            colorBgLayout: "#0a0a0f",
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>
          <Refine
            dataProvider={dataProvider(supabaseClient)}
            liveProvider={liveProvider(supabaseClient)}
            routerProvider={routerBindings}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "feature_requests",
                list: "/feature-requests",
                edit: "/feature-requests/edit/:id",
                show: "/feature-requests/show/:id",
                meta: {
                  label: "Feature Requests",
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              liveMode: "auto",
            }}
          >
            <Routes>
              <Route
                element={
                  <ThemedLayoutV2
                    Title={({ collapsed }) => (
                      <ThemedTitleV2
                        collapsed={collapsed}
                        text="FutureAtoms Admin"
                      />
                    )}
                    Sider={() => <ThemedSiderV2 />}
                  >
                    <Outlet />
                  </ThemedLayoutV2>
                }
              >
                <Route
                  index
                  element={<NavigateToResource resource="feature_requests" />}
                />
                <Route path="/feature-requests">
                  <Route index element={<FeatureRequestList />} />
                  <Route path="edit/:id" element={<FeatureRequestEdit />} />
                  <Route path="show/:id" element={<FeatureRequestShow />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
