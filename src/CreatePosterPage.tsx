import { toPng } from "html-to-image";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { POSTER_FEE, type PaymentToken, type SolQuote } from "./payment";
import { PirateSkullIcon } from "./components/ReferenceIcons";
import { CreatorGuideIcon } from "./components/CreatorGuideIcon";
import { CreatorPoster } from "./components/CreatorPoster";
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
  WalletIcon,
} from "./components/icons";
import { tornPaper } from "./torn";
import { useWallet } from "./wallet";
import "./CreatePosterPage.css";
import "./CreateReference.css";
import "./CreateMobile.css";
import "./CreateDesktop.css";
import { PaymentChoiceIcon, WantedConditionIcon, DesktopGuideIcon } from "./components/CreatorDesktopIcons";

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
  { title: "1. Upload", text: "Upload a clear photo of yourself." },
  { title: "2. Set Details", text: "Enter your pirate name and choose your wanted condition." },
  { title: "3. Pay $5", text: `Pay $5 in USDC, USDT or SOL on Solana with your wallet.` },
  { title: "4. Get your poster", text: "Download your personalized wanted poster and share it with the community." },
];

export function CreatePosterPage() {
  const { address, holdings, isHolder, openModal, payForPoster } = useWallet();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("DEAD OR ALIVE");
  const [conditionHelp, setConditionHelp] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [customBounty, setCustomBounty] = useState("");
  const uploadSequence = useRef(0);
  const [title, setTitle] = useState<string>(TITLES[0]);
  const [artStyle, setArtStyle] = useState<ArtStyle>("classic");
  const [payNote, setPayNote] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "signing" | "confirming" | "paid">("idle");
  const [paymentToken, setPaymentToken] = useState<PaymentToken>("USDC");
  const [solQuote, setSolQuote] = useState<SolQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const refreshQuote = async () => {
    setSolQuote(null); setQuoteLoading(true); setPayNote(null);
    try {
      const response = await fetch("/api/sol-quote", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "SOL pricing unavailable.");
      setSolQuote(data); setNow(Date.now());
    } catch { setPayNote("SOL pricing unavailable. Retry or choose USDC or USDT."); }
    finally { setQuoteLoading(false); }
  };
  useEffect(() => {
    if (paymentToken !== "SOL") return;
    void refreshQuote();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [paymentToken]);
  const quoteValid = solQuote !== null && solQuote.expiresAt > now;
  const [receipt, setReceipt] = useState<string | null>(null);

  const bounty = customBounty ? Number(customBounty).toLocaleString("en-US") : isHolder && holdings.state === "ready" ? holdings.display : PLACEHOLDER_BOUNTY;

  useEffect(() => {
    document.title = "Create Your Wanted Poster | Wanted Bounty";
  }, []);
  const posterName = name.trim() || "Your Name";

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
      const signature = await payForPoster(paymentToken, () => setPhase("confirming"), solQuote ?? undefined);
      setReceipt(signature);
      setPhase("paid");
    } catch (error) {
      setPhase("idle");
      setPayNote(error instanceof Error ? error.message : "The payment couldn't be sent.");
    }
  };

  let payLabel = "Pay $5 & Generate My Poster";
  if (!address) payLabel = "Connect Wallet to Pay";
  else if (phase === "paid") payLabel = "Download Your Poster";
  else if (phase === "signing") payLabel = "Approve in your wallet…";
  else if (phase === "confirming") payLabel = "Confirming payment…";

  const payDisabled = phase === "signing" || phase === "confirming" || (phase !== "paid" && paymentToken === "SOL" && (!quoteValid || quoteLoading));

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
                    <strong>Turn your photo into a legendary bounty.</strong>
                    <br />
                    Upload your image and create your own wanted poster. Your connected wallet supplies the default bounty amount.
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

            <section className="create-mobile-guide" aria-labelledby="mobile-guide-title">
              <h2 id="mobile-guide-title">How It Works</h2>
              <ol>{steps.map(({title: label, text}, index) => <li key={label}><CreatorGuideIcon step={index} /><h3>{label}</h3><p>{text}</p></li>)}</ol>
            </section>

            <div className="create__grid">
              <div className="create__panel-shadow">
                <form className="create__panel create__form" style={{ clipPath: FORM_EDGE }} onSubmit={(event) => event.preventDefault()}>
                  <Step number={1} title="Upload Your Image" hint="Use a clear photo of yourself. Choose a vintage finish for your wanted poster.">
                    <div className="upload">
                      <div className="upload__thumb">
                        {photo ? <><img src={photo.url} alt="Your uploaded photo" /><button className="upload__remove" type="button" aria-label="Remove photo" onClick={() => { ++uploadSequence.current; setPhoto(null); }}>×</button></> : <span>Your photo</span>}
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

                  <Step number={2} title="Set Your Details">
                    <div className="fields">
                      <fieldset className="condition-field desktop-only">
                        <legend>Wanted Condition <button className="condition-help-toggle" type="button" aria-label="About wanted conditions" aria-expanded={conditionHelp} aria-controls="condition-help" onClick={() => setConditionHelp(!conditionHelp)}>?</button></legend>
                        {conditionHelp && <p id="condition-help" className="condition-help">Choose the wording displayed above your name on the poster. This is decorative and does not affect the price or bounty.</p>}
                        <div className="condition-options">{["DEAD OR ALIVE", "DEAD", "ALIVE"].map(option => <button key={option} type="button" aria-pressed={condition === option} className={condition === option ? "is-selected" : ""} onClick={() => setCondition(option)}><WantedConditionIcon alive={option === "ALIVE"}/><span>{option}</span></button>)}</div>
                      </fieldset>
                      <div className="field pirate-name-field">
                        <label htmlFor="pirate-name" className="field__label">Pirate Name</label>
                        <div className="name-input-wrap"><input
                          ref={nameRef}
                          id="pirate-name"
                          className="field__control"
                          value={name}
                          maxLength={24}
                          placeholder="Your Name"
                          onChange={(event) => setName(event.target.value)}
                        />{name && <button className="name-clear desktop-only" type="button" aria-label="Clear pirate name" onClick={() => { setName(""); nameRef.current?.focus(); }}>×</button>}</div>
                      </div>

                      <label className="field desktop-legacy">
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

                      <div className="field desktop-legacy">
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

                      <div className="field desktop-legacy">
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

                  <Step number={3} title="Pay $5 to Create">
                    <p className="desktop-only pay__description">A one-time fee of $5 to create your wanted poster.<br/>Includes a photo filter and download; supports the BERI community.</p>
                    <div className="desktop-only payment-choices" role="group" aria-label="Payment currency">{(["USDC", "USDT", "SOL"] as PaymentToken[]).map(token => <button key={token} type="button" disabled={phase !== "idle"} aria-pressed={paymentToken === token} className={paymentToken === token ? "is-selected" : ""} onClick={() => { setPaymentToken(token); setPayNote(null); }}><PaymentChoiceIcon token={token}/><span>{token === "SOL" ? "$5 worth of SOL" : `5 ${token}`}</span></button>)}</div>
                    <div className="pay">
                      <div className="pay__wallet">
                        <span className="pay__wallet-icon">
                          <WalletIcon />
                        </span>
                        <div>
                          <label className="pay__wallet-label" htmlFor="payment-token">Pay with · Solana</label>
                          <select id="payment-token" className="pay__currency" value={paymentToken}
                            disabled={phase !== "idle"}
                            onChange={(event) => { setPaymentToken(event.target.value as PaymentToken); setPayNote(null); }}>
                            <option value="USDC">5 USDC</option>
                            <option value="USDT">5 USDT</option>
                            <option value="SOL">$5 in SOL</option>
                          </select>
                        </div>
                      </div>
                      <div className="pay__action">
                        <button
                          type="button"
                          className="pay__button"
                          disabled={payDisabled}
                          onClick={onPay}
                        >
                          <LockIcon />{payLabel}
                          <ArrowRight />
                        </button>
                        <p>
                          {paymentToken === "SOL" ? <>
                            {quoteLoading ? "Getting SOL quote…" : solQuote ? `${(solQuote.lamports / 1e9).toFixed(9)} SOL · ${quoteValid ? Math.ceil((solQuote.expiresAt - now) / 1000) + "s to approve" : "Quote expired"}` : "Quote unavailable"}
                            {phase === "idle" && !quoteLoading && <button type="button" onClick={refreshQuote} className="pay__quote-refresh">Refresh quote</button>}
                            <br />$5 at quoted rate. SOL network fee is additional.
                          </> : <>{FEE} {paymentToken} for your poster. SOL is needed for network and any token-account setup fees.</>}
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
                    <div className="desktop-only payment-trust"><span><ShieldIcon/>Secure Payment</span><span><BeriCoin/>One-time fee only</span><span><CompassIcon/>Supports BERI</span></div>
                    <p className="pay__secure">
                      <ShieldIcon />
                      <span>
                        The $5 fee is paid in USDC, USDT or SOL with your wallet approval.
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
                  <CreatorPoster
                    name={posterName}
                    condition={condition}
                    bounty={bounty}
                    portrait={photo?.url ?? DEFAULT_PORTRAIT}
                    photoClassName={`art--${artStyle}`}
                    fine="KONO SAKUHIN WA FICTION DESUNODE JITSUZAISURU JINBUTSU DANTAI SONOTA NO SOSHIKI TO DOITSU NO MEISHOU GA GEKICHU NI TOUJYOU SHITATOSHITEMO JITSUZAI NA MONOTOWA ISSAI MUKANKEIDESU"
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
            <div className="desktop-only creator-guide-divider" aria-hidden="true"><span/><PirateSkullIcon/><span/></div>
            <div className="steps__row">
              <ol className="steps__list">
                {steps.map(({ title: stepTitle, text }, index) => (
                  <li key={stepTitle}>
                    <span className="mobile-guide-icon"><CreatorGuideIcon step={index} /></span><DesktopGuideIcon step={index}/>
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
