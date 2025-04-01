import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

// 監聽路由變化的組件
const RouteChangeHandler = () => {
  const { setSelectedItem } = useApp();
  const location = useLocation();

  useEffect(() => {
    setSelectedItem(null);
  }, [location.pathname, setSelectedItem]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1 pb-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <BottomNav />
            {/* 使用內部自定義組件監聽路由變化 */}
            <RouteWrapper />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

// 因為 useApp 和 useLocation 必須在 AppProvider 和 Router 內部使用，所以需要單獨封裝
const RouteWrapper = () => {
  return (
    <Routes>
      <Route path="*" element={<RouteChangeHandler />} />
    </Routes>
  );
};

export default App;
