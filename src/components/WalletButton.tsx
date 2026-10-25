import { HeaderWalletIcon as WalletIcon } from "./ReferenceIcons";
import { useEffect, useRef, useState } from "react";
import { shortAddress, useWallet, type BeriHoldings } from "../wallet";
import {
  CheckIcon,
  ChevronDown,
  CopyIcon,
  LogoutIcon,
  MetaMaskIcon,
  PhantomIcon,
  RefreshIcon,
  VerifiedBadge,
} from "./icons";

function connectedLabel(holdings: BeriHoldings, address: string) {
  if (holdings.state === "ready") return `฿ ${holdings.display} BERI`;
  if (holdings.state === "loading") return "Scanning…";
  return shortAddress(address);
}

function holdingsLabel(holdings: BeriHoldings) {
  switch (holdings.state) {
    case "loading":
      return "Scanning…";
    case "ready":
      return `฿ ${holdings.display}`;
    case "unconfigured":
      return "Mint not set";
    case "error":
      return "Unavailable";
    default:
      return "—";
  }
}

export function WalletButton() {
  const { address, status, holdings, wallet, openModal, disconnect, refreshHoldings } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!address) {
    return (
      <button className="wallet-btn" type="button" onClick={openModal} disabled={status === "connecting"}>
        <WalletIcon />
        {status === "connecting" ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="wallet-account" ref={rootRef}>
      <button
        className="wallet-btn wallet-btn--connected"
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="wallet-btn__icon">
          <WalletIcon />
        </span>
        <span className="wallet-btn__text">
          <small>
            <VerifiedBadge /> Wallet Connected
          </small>
          <strong>{connectedLabel(holdings, address)}</strong>
        </span>
        <ChevronDown />
      </button>

      {menuOpen && (
        <div className="wallet-menu" role="menu">
          <div className="wallet-menu__head">
            {wallet === "metamask" ? <MetaMaskIcon /> : <PhantomIcon />}
            <div>
              <strong>{wallet === "metamask" ? "MetaMask" : "Phantom"}</strong>
              <span>Solana Mainnet</span>
            </div>
          </div>
          <p className="wallet-menu__address">{address}</p>
          <div className="wallet-menu__balance">
            <span>$BERI held</span>
            <strong>{holdingsLabel(holdings)}</strong>
          </div>
          <button type="button" role="menuitem" onClick={refreshHoldings} disabled={holdings.state === "loading"}>
            <RefreshIcon />
            Rescan balance
          </button>
          <button type="button" role="menuitem" onClick={copyAddress}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy address"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void disconnect();
            }}
          >
            <LogoutIcon />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
