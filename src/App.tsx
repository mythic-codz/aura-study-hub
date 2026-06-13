import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Index from "./pages/Index";
import BatchPage from "./pages/BatchPage";
import PlayPage from "./pages/PlayPage";
import LivePage from "./pages/LivePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import AchievementsPage from "./pages/AchievementsPage";
import BlockedPage from "./pages/BlockedPage";
import NotFound from "./pages/NotFound";
import { SecurityProvider } from "./components/SecurityProvider";

const queryClient = new QueryClient();

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Routes location={location}>
          <Route path="/blocked" element={<BlockedPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/batch/:batchId" element={<BatchPage />} />
          <Route path="/play/:batchId/:type/:index" element={<PlayPage />} />
          <Route path="/live/:batchId" element={<LivePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SecurityProvider>
          <AnimatedRoutes />
        </SecurityProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
