import { useEffect, useRef, type ReactNode } from "react";
import {
  isMobileDevice,
  METAMASK_DOWNLOAD_URL,
  metamaskBrowseUrl,
  PHANTOM_DOWNLOAD_URL,
  phantomBrowseUrl,
  useWallet,
} from "../wallet";
import { CloseIcon, HelmLogo, MetaMaskIcon, PhantomIcon } from "./icons";

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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(".wallet-option")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen, closeModal]);

  if (!modalOpen) return null;

  const connecting = status === "connecting";
  const mobile = isMobileDevice();

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title" ref={panelRef}>
        <button className="modal__close" type="button" aria-label="Close" onClick={closeModal}>
          <CloseIcon />
        </button>
        <HelmLogo className="modal__logo" />
        <h2 id="wallet-modal-title">Join the Fleet</h2>
        <p className="modal__lede">
          Connect Phantom or MetaMask on Solana. Your $BERI holdings set the bounty on your poster.
        </p>

        {error && (
          <p className="modal__error" role="alert">
            {error}
          </p>
        )}

        <WalletChoice
          name="Phantom"
          icon={<PhantomIcon className="wallet-option__icon" />}
          installed={phantomInstalled}
          busy={connecting && connectingWallet === "phantom"}
          disabled={connecting}
          installHref={mobile ? phantomBrowseUrl() : PHANTOM_DOWNLOAD_URL}
          mobile={mobile}
          onConnect={() => void connect("phantom")}
        />
        <WalletChoice
          name="MetaMask"
          icon={<MetaMaskIcon className="wallet-option__icon" />}
          installed={metamaskInstalled || metamaskExtension}
          statusLabel={metamaskInstalled ? undefined : metamaskExtension ? "Enable Solana" : undefined}
          busy={connecting && connectingWallet === "metamask"}
          disabled={connecting}
          installHref={mobile ? metamaskBrowseUrl() : METAMASK_DOWNLOAD_URL}
          mobile={mobile}
          onConnect={() => void connect("metamask")}
        />

        <p className="modal__note">
          We only read your public address and $BERI balance. Connecting never sends a transaction.
        </p>
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
        {icon}
        <span className="wallet-option__name">
          {name}
          <small>Solana</small>
        </span>
        <span className={`wallet-option__status${statusLabel && !busy ? " wallet-option__status--install" : ""}`}>
          {busy ? `Check ${name}…` : (statusLabel ?? "Detected")}
        </span>
      </button>
    );
  }

  return (
    <a className="wallet-option" href={installHref} {...(mobile ? {} : { target: "_blank", rel: "noreferrer" })}>
      {icon}
      <span className="wallet-option__name">
        {name}
        <small>Solana</small>
      </span>
      <span className="wallet-option__status wallet-option__status--install">{mobile ? "Open in app" : "Install"}</span>
    </a>
  );
}
