import { toPng } from "html-to-image";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { POSTER_FEE } from "./payment";
import { WantedPoster } from "./components/WantedPoster";
import {
  ArrowRight,
  BeriCoin,
  ChevronDown,
  CompassIcon,
  CompassRose,
  EyeIcon,
  LockIcon,
  ShieldIcon,
  UploadCloudIcon,
  VerifiedBadge,
  WalletIcon,
} from "./components/icons";
import { tornPaper } from "./torn";
import { useWallet } from "./wallet";
import "./CreatePosterPage.css";
import "./CreateReference.css";

const FEE = POSTER_FEE;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const PLACEHOLDER_BOUNTY = "1,250,000";
const DEFAULT_PORTRAIT = "/portraits/home-luffy.jpg";

const TITLES = ["Captain", "First Mate", "Navigator", "Swordsman", "Sniper", "Cook", "Doctor", "Shipwright", "Musician"];

const ART_STYLES = [
  { id: "classic", label: "Classic Ink", sample: "/portraits/home-luffy.jpg" },
  { id: "golden", label: "Golden Age", sample: "/portraits/navigator.jpg" },
  { id: "storm", label: "Storm-Worn", sample: "/portraits/swordsman.jpg" },
] as const;

type ArtStyle = (typeof ART_STYLES)[number]["id"];

const FORM_EDGE = tornPaper(17, 170, 0.7);
const PREVIEW_EDGE = tornPaper(23, 170, 0.8);
const NOTE_EDGE = tornPaper(9, 70, 1.5);

const steps = [
  { title: "1. Upload", text: "Add your photo and choose your details." },
  { title: "2. Customize", text: "Set your name, bounty, title and art style." },
  { title: "3. Pay with BERI", text: `Connect your wallet and confirm the ${FEE} BERI fee.` },
  { title: "4. Get your poster", text: "Receive your One Piece–style wanted poster and share it with the community." },
];

export function CreatePosterPage() {
  const { address, holdings, isHolder, openModal, payBeri } = useWallet();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState("");
  const [customBounty, setCustomBounty] = useState("");
  const uploadSequence = useRef(0);
  const [title, setTitle] = useState<string>(TITLES[0]);
  const [artStyle, setArtStyle] = useState<ArtStyle>("classic");
  const [payNote, setPayNote] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "signing" | "confirming" | "paid">("idle");
  const [receipt, setReceipt] = useState<string | null>(null);

  const bounty = customBounty ? Number(customBounty).toLocaleString("en-US") : isHolder && holdings.state === "ready" ? holdings.display : PLACEHOLDER_BOUNTY;

  useEffect(() => {
    document.title = "Create Your Wanted Poster | Wanted Bounty";
  }, []);
  const posterName = name.trim() || "Your Name";
  const balance = holdings.state === "ready" ? holdings.amount : 0;
  const canAfford = balance >= FEE;

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    const sequence = ++uploadSequence.current;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setUploadError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("That image is larger than 10MB.");
      return;
    }
    setUploadError(null);
    // A data URL (not a blob URL) so the poster image can be exported to PNG.
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const image = new Image();
      image.onload = () => {
        if (sequence === uploadSequence.current) setPhoto({ url, name: file.name });
      };
      image.onerror = () => {
        if (sequence === uploadSequence.current) setUploadError("This image could not be opened. Try another JPG or PNG.");
      };
      image.src = url;
    };
    reader.onerror = () => setUploadError("Couldn't read that image.");
    reader.readAsDataURL(file);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    takeFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    takeFile(event.dataTransfer.files?.[0]);
  };

  const downloadPoster = async () => {
    const node = previewRef.current?.querySelector<HTMLElement>(".poster-frame");
    if (!node) return;
    node.classList.add("is-exporting");
    try {
      await Promise.all([
        document.fonts.load('900 40px "Roboto Serif"'),
        document.fonts.load('900 40px "Playfair Display"'),
      ]);
      const dataUrl = await toPng(node, { pixelRatio: 2 });
      const link = document.createElement("a");
      const slug = posterName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "poster";
      link.download = `wanted-${slug}.png`;
      link.href = dataUrl;
      link.click();
      setPayNote(null);
    } catch {
      setPayNote("Your payment went through, but the poster image couldn't be saved. Try the download again.");
    } finally {
      node.classList.remove("is-exporting");
    }
  };

  const onPay = async () => {
    if (!address) {
      openModal();
      return;
    }
    if (phase === "paid") {
      await downloadPoster();
      return;
    }
    if (phase !== "idle") return;
    if (!photo) {
      setPayNote("Upload your photo first so we can build your poster.");
      return;
    }
    if (!name.trim()) {
      setPayNote("Add your pirate name before generating.");
      return;
    }
    setPayNote(null);
    setPhase("signing");
    try {
      const signature = await payBeri(FEE, () => setPhase("confirming"));
      setReceipt(signature);
      setPhase("paid");
    } catch (error) {
      setPhase("idle");
      setPayNote(error instanceof Error ? error.message : "The payment couldn't be sent.");
    }
  };

  let payLabel = `Pay ${FEE} BERI & Generate`;
  if (!address) payLabel = "Connect Wallet to Pay";
  else if (phase === "paid") payLabel = "Download Your Poster";
  else if (phase === "signing") payLabel = "Approve in your wallet…";
  else if (phase === "confirming") payLabel = "Confirming payment…";
  else if (holdings.state === "loading") payLabel = "Checking your BERI…";

  const payDisabled =
    phase === "signing" ||
    phase === "confirming" ||
    (phase !== "paid" && Boolean(address) && (holdings.state === "loading" || (holdings.state === "ready" && !canAfford)));

  return (
    <div className="creator-page">
      <SiteHeader active="create" />

      <main className="create">
        <section className="create__stage">
          <div className="container">
            <div className="create__intro">
              <div className="create__banner-shadow">
                <div className="create__banner">
                  <h1 className="create__title">
                    <span>Create your</span>
                    <span>Wanted Poster</span>
                  </h1>
                  <p className="create__lede">
                    <strong>Turn your story into a legendary bounty.</strong>
                    <br />
                    Upload your photo, customize your details, and get your very own One Piece–style wanted poster.
                  </p>
                </div>
              </div>
              <div className="create__motto" aria-hidden="true">
                <p>
                  Every legend
                  <br />
                  has a price.
                </p>
                <CompassRose className="create__compass" />
              </div>
            </div>

            <div className="create__grid">
              <div className="create__panel-shadow">
                <form className="create__panel create__form" style={{ clipPath: FORM_EDGE }} onSubmit={(event) => event.preventDefault()}>
                  <Step number={1} title="Upload Your Photo" hint="Use a clear photo of yourself. Choose a vintage finish for your wanted poster.">
                    <div className="upload">
                      <div className="upload__thumb">
                        {photo ? <img src={photo.url} alt="Your uploaded photo" /> : <span>Your photo</span>}
                      </div>
                      <div className="upload__drop-wrap">
                        <button
                          type="button"
                          className={`upload__drop ${dragging ? "is-dragging" : ""}`}
                          onClick={() => fileRef.current?.click()}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                          }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={onDrop}
                        >
                          <UploadCloudIcon />
                          <strong>{photo ? "Replace photo" : "Click to upload"}</strong>
                          <span>or drag and drop</span>
                        </button>
                        <p role="status" className={`upload__hint ${uploadError ? "is-error" : ""}`}>{uploadError ?? "JPG, PNG (max 10MB)"}</p>
                      </div>
                      <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onFileChange} />
                    </div>
                  </Step>

                  <Step number={2} title="Customize Your Poster">
                    <div className="fields">
                      <label className="field">
                        <span className="field__label">
                          Pirate <u>Name</u>
                        </span>
                        <input
                          className="field__control"
                          value={name}
                          maxLength={24}
                          placeholder="Your Name"
                          onChange={(event) => setName(event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span className="field__label">Wanted Title</span>
                        <span className="field__select">
                          <select className="field__control" value={title} onChange={(event) => setTitle(event.target.value)}>
                            {TITLES.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronDown />
                        </span>
                      </label>

                      <div className="field">
                        <span className="field__label">Bounty Amount</span>
                        <div className="field__control bounty-input">
                          <BeriCoin className="bounty-input__coin" />
                          <input aria-label="Bounty amount" inputMode="numeric" maxLength={15}
                            value={customBounty ? Number(customBounty).toLocaleString("en-US") : ""}
                            placeholder={bounty}
                            onChange={(event) => setCustomBounty(event.target.value.replace(/[^0-9]/g, "").slice(0, 15))} />
                          <span className="bounty-input__unit">
                            <BeriCoin className="bounty-input__unit-coin" />
                            BERI
                            <ChevronDown />
                          </span>
                        </div>
                      </div>

                      <div className="field">
                        <span className="field__label">Art Style</span>
                        <div className="styles" role="radiogroup" aria-label="Art style">
                          {ART_STYLES.map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              role="radio"
                              aria-checked={artStyle === style.id}
                              className={`style-option art--${style.id} ${artStyle === style.id ? "is-selected" : ""}`}
                              onClick={() => setArtStyle(style.id)}
                            >
                              <img src={photo?.url ?? style.sample} alt="" />
                              <span>{style.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Step>

                  <Step number={3} title="Pay with BERI & Generate">
                    <div className="pay">
                      <div className="pay__wallet">
                        <span className="pay__wallet-icon">
                          <WalletIcon />
                        </span>
                        <div>
                          <span className="pay__wallet-label">Your Wallet</span>
                          <WalletBalance />
                        </div>
                      </div>
                      <div className="pay__action">
                        <button
                          type="button"
                          className="pay__button"
                          disabled={payDisabled}
                          onClick={onPay}
                        >
                          {payLabel}
                          <ArrowRight />
                        </button>
                        <p>
                          {address && holdings.state === "ready" && !canAfford
                            ? `You need at least ${FEE} BERI to generate a poster.`
                            : `This will create your poster and deduct ${FEE} BERI from your wallet.`}
                        </p>
                      </div>
                    </div>
                    {phase === "paid" && receipt && (
                      <p className="pay__note" role="status">
                        Payment confirmed, your poster is ready.{" "}
                        <a href={`https://solscan.io/tx/${receipt}`} target="_blank" rel="noreferrer">
                          View transaction
                        </a>
                      </p>
                    )}
                    {payNote && (
                      <p className="pay__note pay__note--alert" role="status">
                        {payNote}
                      </p>
                    )}
                    <p className="pay__secure">
                      <ShieldIcon />
                      <span>
                        The 500 BERI fee requires your wallet approval.
                        <br />
                        Photo finishes are filters, not AI-generated artwork.
                      </span>
                    </p>
                  </Step>
                </form>
              </div>

              <div className="create__panel-shadow create__panel-shadow--preview">
                <aside ref={previewRef} className="create__panel create__preview" style={{ clipPath: PREVIEW_EDGE }} aria-label="Live preview">
                  <p className="create__ribbon">
                    <EyeIcon /> Live Preview
                  </p>
                  <WantedPoster
                    className="create__poster"
                    name={posterName}
                    bounty={bounty}
                    bountySuffix=" BERI"
                    portrait={photo?.url ?? DEFAULT_PORTRAIT}
                    photoClassName={`art--${artStyle}`}
                    seed={31}
                    fine={`By order of the Beri Fleet, ${title} ${posterName} is wanted on every sea. Any crew member who brings word of their whereabouts shall be rewarded in full.`}
                  />
                  <div className="create__assurances">
                    <div>
                      <EyeIcon />
                      <p>
                        <strong>Preview Only</strong>
                        You can edit your details before paying.
                      </p>
                    </div>
                    <div>
                      <LockIcon />
                      <p>
                        <strong>Photo stays local</strong>
                        Your upload stays in this browser.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="steps" id="how-it-works">
          <div className="container">
            <h2 className="steps__ribbon">How It Works</h2>
            <div className="steps__row">
              <ol className="steps__list">
                {steps.map(({ title: stepTitle, text }, index) => (
                  <li key={stepTitle}>
                    <GuideIcon step={index} />
                    <h3>{stepTitle}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
              <div className="steps__note-shadow">
                <CompassIcon className="steps__note-icon" />
                <div className="steps__note" style={{ clipPath: NOTE_EDGE }}>
                  <p className="steps__note-title">Generate. Share. Build the fleet.</p>
                  <p>The more bounties, the stronger our community.</p>
                  <p className="steps__note-sign">— BERI</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function GuideIcon({ step }: { step: number }) {
  if (step === 1) return <svg className="steps__icon" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><path d="m12 8 44 44-8 8L4 16Zm7 8-5 5m15 5-5 5m15 5-5 5M12 46l34-38 10 10-34 38-14 4Z"/><path d="m12 46 10 10M40 14l10 10M8 60l4-14"/></g></svg>;
  if (step === 3) return <svg className="steps__icon" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="32" cy="18" r="9"/><circle cx="13" cy="23" r="7"/><circle cx="51" cy="23" r="7"/><path d="M17 55V43c0-19 30-19 30 0v12ZM17 33C5 29 2 40 3 49h14m30-16c12-4 15 7 14 16H47"/></g></svg>;
  if (step === 2) return <span className="steps__icon steps__wallet-ring"><WalletIcon /></span>;
  return (
    <svg className="steps__icon steps__poster-icon" viewBox="0 0 64 72" aria-hidden="true">
      <g transform="rotate(-5 32 36)" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M15 7 19 9 23 6 27 8 32 6 37 8 42 6 49 8 48 16 50 22 48 28 50 36 48 43 50 51 48 64 43 63 38 65 33 63 27 65 22 63 15 65 16 56 14 49 16 42 14 35 16 27 14 20Z" />
        <text x="32" y="19" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="bold" fontSize="8">WANTED</text>
        <path d="M20 24H44V46H20Z" />
        <circle cx="32" cy="32" r="5" /><path d="M24 44c0-10 16-10 16 0M23 31q9-7 18 0M25 29q7-12 14 0M21 51h22M23 55h18M25 59h14" />
      </g>
    </svg>
  );
}

function Step({ number, title, hint, children }: { number: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="step">
      <span className="step__number">{number}</span>
      <div className="step__body">
        <h2 className="step__title">{title}</h2>
        {hint && <p className="step__hint">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

function WalletBalance() {
  const { address, holdings, openModal } = useWallet();

  if (!address) {
    return (
      <button type="button" className="pay__connect" onClick={openModal}>
        Connect wallet
      </button>
    );
  }
  if (holdings.state === "loading") return <strong className="pay__balance">Scanning…</strong>;
  if (holdings.state !== "ready") return <strong className="pay__balance">Unavailable</strong>;

  return (
    <strong className="pay__balance">
      {holdings.display} BERI
      {holdings.amount > 0 && (
        <span className="pay__verified">
          <VerifiedBadge /> Verified
        </span>
      )}
    </strong>
  );
}
