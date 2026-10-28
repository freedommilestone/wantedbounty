import { HeaderWalletIcon as WalletIcon } from "./ReferenceIcons";
import { useWallet, type BeriHoldings } from "../wallet";
import { ChevronDown, VerifiedBadge } from "./icons";

function connectedLabel(holdings: BeriHoldings) {
  if (holdings.state === "ready") return `฿ ${holdings.display} BERI`;
  if (holdings.state === "loading") return "Scanning…";
  return "Balance unavailable";
}

export function WalletButton() {
  const { address, status, holdings, modalOpen, openModal } = useWallet();

  if (!address) {
    return (
      <button className="wallet-btn" type="button" aria-haspopup="dialog" onClick={openModal} disabled={status === "connecting"}>
        <WalletIcon />
        {status === "connecting" ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="wallet-account">
      <button
        className="wallet-btn wallet-btn--connected"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        onClick={openModal}
      >
        <WalletIcon />
        <span className="wallet-btn__text">
          <small><VerifiedBadge /> Wallet Connected</small>
          <strong>{connectedLabel(holdings)}</strong>
        </span>
        <ChevronDown />
      </button>
    </div>
  );
}
