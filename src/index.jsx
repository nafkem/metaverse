import phantomModule from "@web3-onboard/phantom";
import { init } from "@web3-onboard/react";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import GameRoutes from "./routes";
import "./styles/auth.css";
import "./styles/style.css";

const phantom = phantomModule();

init({
  wallets: [phantom],
  chains: [
    {
      id: '0x1', // Ethereum Mainnet
      token: 'ETH',
      label: 'Ethereum Mainnet',

    },
    {
      id: '0x89', // Polygon Mainnet
      token: 'MATIC',
      label: 'Polygon',

    }
  ],
  appMetadata: {
    name: '404 Metaverse',
    icon: '/logo.png',
    description: 'Connect your wallet to play 404 Metaverse',
  }
});


const container = document.getElementById("app");

if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GameRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
