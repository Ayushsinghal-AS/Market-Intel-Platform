import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import Portfolio from "../pages/Portfolio";
import Backtest from "../pages/Backtest";
import StockDetail from "../pages/StockDetail";
import StockSearchLanding from "../pages/StockSearchLanding";
import EtfScanner from "../pages/EtfScanner";
import NiftyScanner from "../pages/NiftyScanner";
import Calculators from "../pages/Calculators";
import FnoAnalytics from "../pages/FnoAnalytics";
import SipCalculator from "../components/calculators/SipCalculator";
import LumpsumCalculator from "../components/calculators/LumpsumCalculator";
import CagrCalculator from "../components/calculators/CagrCalculator";
import OptionsPayoffVisualizer from "../components/calculators/OptionsPayoffVisualizer";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stock" element={<StockSearchLanding />} />
        <Route path="stock/:ticker" element={<StockDetail />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="etf-scanner" element={<EtfScanner />} />
        <Route path="nifty-scanner" element={<NiftyScanner />} />
        <Route path="backtest" element={<Backtest />} />
        <Route path="fno-analytics" element={<FnoAnalytics />} />
        <Route path="calculators" element={<Calculators />}>
          <Route index element={<Navigate to="sip" replace />} />
          <Route path="sip" element={<SipCalculator />} />
          <Route path="lumpsum" element={<LumpsumCalculator />} />
          <Route path="cagr" element={<CagrCalculator />} />
          <Route path="options-payoff" element={<OptionsPayoffVisualizer />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
