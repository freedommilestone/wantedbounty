import { useEffect, useRef, type ReactNode } from "react";
import {
  isMobileDevice,
  METAMASK_DOWNLOAD_URL,
  metamaskBrowseUrl,
  PHANTOM_DOWNLOAD_URL,
  phantomBrowseUrl,
  useWallet,
} from "../wallet";
import { CloseIcon, ArrowRight, LockIcon, ShieldIcon } from "./icons";

import { PirateSkullIcon } from "./ReferenceIcons";
import { FleetWalletIcon } from "./FleetWalletIcon";
import "./WalletModal.css";

export function WalletModal() {
  const {
    modalOpen,
    closeModal,
    phantomInstalled,
    metamaskInstalled,
    metamaskExtension,
    connectingWallet,
    connect,
    status,
    error,
  } = useWallet();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? []);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(".wallet-option")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [modalOpen, closeModal]);

  if (!modalOpen) return null;

  const connecting = status === "connecting";
  const mobile = isMobileDevice();

  return (
    <div
      className="modal-backdrop fleet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="modal fleet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title" ref={panelRef}>
        <button className="modal__close" type="button" aria-label="Close" onClick={closeModal}>
          <CloseIcon />
        </button>
        <div className="fleet-modal__content">
        <img className="modal__logo" src="/brand/beri-monogram.png" alt="BERI" />
        <h2 id="wallet-modal-title">Join the Fleet</h2>
        <p className="modal__lede">
          Connect your wallet to view your $BERI holdings and set your bounty on your wanted poster.
        </p>

        <div className="fleet-modal__divider" aria-hidden="true"><span/><PirateSkullIcon/><span/></div>
        {error && (
          <p className="modal__error" role="alert">
            {error}
          </p>
        )}

        <WalletChoice
          name="Phantom"
          icon={<FleetWalletIcon wallet="phantom" />}
          installed={phantomInstalled}
          busy={connecting && connectingWallet === "phantom"}
          disabled={connecting}
          installHref={mobile ? phantomBrowseUrl() : PHANTOM_DOWNLOAD_URL}
          mobile={mobile}
          onConnect={() => void connect("phantom")}
        />
        <WalletChoice
          name="MetaMask"
          icon={<FleetWalletIcon wallet="metamask" />}
          installed={metamaskInstalled || metamaskExtension}
          statusLabel={metamaskInstalled ? undefined : metamaskExtension ? "Enable Solana" : undefined}
          busy={connecting && connectingWallet === "metamask"}
          disabled={connecting}
          installHref={mobile ? metamaskBrowseUrl() : METAMASK_DOWNLOAD_URL}
          mobile={mobile}
          onConnect={() => void connect("metamask")}
        />

        <div className="fleet-modal__trust">
          <div><LockIcon/><p>We only read your public address and $BERI balance.</p></div>
          <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m3 21 18-18M10 6l3-3a4 4 0 0 1 6 6l-3 3M14 18l-3 3a4 4 0 0 1-6-6l3-3M8 16l8-8"/></svg><p>Connecting never sends a transaction.</p></div>
          <div><ShieldIcon/><p>You stay in control of your wallet and funds.</p></div>
        </div>
        </div>
      </div>
    </div>
  );
}

function WalletChoice({
  name,
  icon,
  installed,
  statusLabel,
  busy,
  disabled,
  installHref,
  mobile,
  onConnect,
}: {
  name: string;
  icon: ReactNode;
  installed: boolean;
  statusLabel?: string;
  busy: boolean;
  disabled: boolean;
  installHref: string;
  mobile: boolean;
  onConnect: () => void;
}) {
  if (installed) {
    return (
      <button className="wallet-option" type="button" disabled={disabled} onClick={onConnect}>
        <span className="wallet-option__badge">{icon}</span>
        <span className="wallet-option__name">
          {name}
          <small>Solana</small>
          <span className="wallet-option__hint">{busy ? `Check ${name}…` : statusLabel}</span>
        </span>
        <ArrowRight className="wallet-option__arrow" />
      </button>
    );
  }

  return (
    <a className="wallet-option" href={installHref} {...(mobile ? {} : { target: "_blank", rel: "noreferrer" })}>
      <span className="wallet-option__badge">{icon}</span>
      <span className="wallet-option__name">
        {name}
        <small>Solana</small>
        <span className="wallet-option__hint">{mobile ? "Open in app" : "Install wallet"}</span>
      </span>
      <ArrowRight className="wallet-option__arrow" />
    </a>
  );
}
