import { wholeBounty } from "./bountyFormat";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { orderRequest, readOrder, saveOrder, type SavedOrder, type OrderResult } from "./posterOrder";
import { TREASURY_ADDRESS, POSTER_FEE, type PaymentToken, type SolQuote } from "./payment";
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
import "./CreateMobileReference.css";
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
  const conditionRef = useRef<HTMLFieldSetElement>(null);
  const conditionToggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!conditionHelp) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!conditionRef.current?.querySelector(".condition-help")?.contains(target) && !conditionToggleRef.current?.contains(target)) setConditionHelp(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setConditionHelp(false); conditionToggleRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [conditionHelp]);
  const nameRef = useRef<HTMLInputElement>(null);
  const [customBounty, setCustomBounty] = useState("");
  const uploadSequence = useRef(0);
  const [title, setTitle] = useState<string>(TITLES[0]);
  const [artStyle, setArtStyle] = useState<ArtStyle>("classic");
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [payNote, setPayNote] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "signing" | "confirming" | "generating" | "retry" | "review" | "paid">("idle");
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
  const [order, setOrder] = useState<SavedOrder | null>(readOrder);
  const [generated, setGenerated] = useState<string | null>(null);
  const applyResult = (data: OrderResult) => {
    if (data.details) {
      setName(data.details.name); setCondition(data.details.condition);
      setCustomBounty(wholeBounty(data.details.bounty).replace(/[^0-9]/g, ""));
    }
    if (data.signature) setReceipt(data.signature);
    if (data.status === "ready" && data.image) { setGenerated(data.image); setPhase("paid"); setPayNote(null); }
    else if (data.status === "review") { setPhase("review"); setPayNote(data.message || "Please keep your receipt and contact support. Do not pay again."); }
    else if (data.status === "generating") setPhase("generating");
    else setPhase("retry");
  };
  useEffect(() => {
    const saved = readOrder();
    if (!saved) return;
    setPhase("confirming");
    orderRequest<OrderResult>({ action: "status", id: saved.id, token: saved.token }).then(applyResult)
      .catch(() => { setPhase("retry"); setPayNote("Your previous order was saved. Check its status before paying again."); });
  }, []);
  useEffect(() => {
    if (phase !== "generating" || !order) return;
    const timer = window.setInterval(() => {
      orderRequest<OrderResult>({action:"status",id:order.id,token:order.token}).then(applyResult)
        .catch(() => setPayNote("Still checking your saved order. You can refresh safely; do not pay again."));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [phase, order]);
  const [receipt, setReceipt] = useState<string | null>(null);

  const bounty = customBounty ? Number(customBounty).toLocaleString("en-US") : isHolder && holdings.state === "ready" ? holdings.display : PLACEHOLDER_BOUNTY;

  useEffect(() => {
    document.title = "Create Your Wanted Poster | Wanted Bounty";
  }, []);
  const posterName = name.trim() || "Your Name Here";

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
        if (sequence === uploadSequence.current) {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
          canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) { setUploadError("Cannot prepare this photo."); return; }
          context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          setPhoto({ url: canvas.toDataURL("image/jpeg", 0.85), name: file.name });
        }
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
    setFeedbackOpen(true);
    if (phase === "paid") {
      await downloadPoster();
      return;
    }
    if (phase === "retry" && order) {
      setPayNote(null); setPhase("confirming");
      try {
        if (!order.signature) {
          const data = await orderRequest<OrderResult>({action:"status",id:order.id,token:order.token});
          if (data.status === "pending") {
            setPhase("retry"); setPayNote("No receipt was saved. If you approved a payment, paste its transaction signature below to recover it. If you cancelled, clear this unpaid order.");
          } else applyResult(data);
        } else {
          applyResult(await orderRequest<OrderResult>({action:"generate",id:order.id,token:order.token,signature:order.signature}));
        }
      } catch (error) { setPhase("retry"); setPayNote(error instanceof Error ? error.message : "Retry this saved order without paying again."); }
      return;
    }
    if (phase !== "idle") return;
    if (!address) { openModal(); return; }
    if (!photo || !name.trim()) { setPayNote("Upload your photo and add your pirate name first."); return; }
    setPayNote(null); setPhase("confirming");
    let saved: SavedOrder | null = null;
    try {
      saved = await orderRequest<SavedOrder>({action:"prepare",owner:address,currency:paymentToken,photo:photo.url,name:name.trim(),condition,bounty});
      if (saved.treasury !== TREASURY_ADDRESS) throw new Error("Payment configuration mismatch. No payment was requested.");
      saveOrder(saved); setOrder(saved);
      if (saved.quote) { setSolQuote(saved.quote); setNow(Date.now()); }
      setPhase("signing");
      const prepared = saved;
      const signature = await payForPoster(paymentToken, (signature) => {
        prepared.signature = signature; saveOrder(prepared); setOrder({...prepared});
        setReceipt(signature); setPhase("confirming");
      }, saved.quote, saved.id);
      setPhase("generating");
      applyResult(await orderRequest<OrderResult>({action:"generate",id:saved.id,token:saved.token,signature}));
    } catch (error) {
      setPhase(saved && readOrder()?.id === saved.id ? "retry" : "idle");
      setPayNote(error instanceof Error ? error.message : "Unable to finish. Your saved order can be retried without paying again.");
    }
  };

  let payLabel = "Pay $5 & Generate My Poster";
  if (phase === "paid") payLabel = "Download Your Poster";
  else if (phase === "retry") payLabel = "Recover My Order";
  else if (phase === "review") payLabel = "Order Needs Assistance";
  else if (phase === "generating") payLabel = "Creating your anime portrait…";
  else if (phase === "signing") payLabel = "Approve in your wallet…";
  else if (phase === "confirming") payLabel = "Checking your order…";
  else if (!address) payLabel = "Connect Wallet to Pay";

  const payDisabled = phase === "signing" || phase === "confirming" || phase === "generating" || phase === "review" || (phase === "idle" && paymentToken === "SOL" && (!quoteValid || quoteLoading));

  return (
    <div className="creator-page">
      <SiteHeader active="create" />

      <main className="create">
        <section className="create__stage">
          <div className="container">
            <div className="create__intro">
              <img className="create__exact-mobile-hero" src="/scene/create-mobile-reference-original.png" alt="" aria-hidden="true" width="813" height="1935" />
              <div className="create__banner-shadow">
                <div className="create__banner">
                  <h1 className="create__title">
                    <span>Create your</span>
                    <span>Wanted Poster</span>
                  </h1>
                  <p className="create__lede">
                    <strong>Turn your photo into a legendary bounty.</strong>
                    <br />
                    <span className="create__hero-description">Turn your uploaded photo into a pirate-anime wanted poster. Your connected wallet supplies the default bounty amount.</span>
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
                  <Step number={1} title="Upload Your Image" hint="Upload your photo. After payment, AI creates your pirate-anime portrait.">
                    <fieldset className="upload" disabled={phase !== "idle"} style={{border:0,padding:0,margin:0,minWidth:0}}>
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
                    </fieldset>
                  </Step>

                  <Step number={2} title="Set Your Details">
                    <div className="fields">
                      <fieldset ref={conditionRef} className="condition-field desktop-only">
                        <legend>Wanted Condition <button ref={conditionToggleRef} className="condition-help-toggle" type="button" aria-label="About wanted conditions" aria-expanded={conditionHelp} aria-controls="condition-help" onClick={() => setConditionHelp(!conditionHelp)}>?</button></legend>
                        {conditionHelp && <div id="condition-help" className="condition-help" role="dialog" aria-label="Wanted condition help"><button type="button" className="condition-help-close" aria-label="Close condition help" onClick={() => { setConditionHelp(false); conditionToggleRef.current?.focus(); }}>×</button><p>Choose the wording displayed above your name on the poster. This is decorative and does not affect the price or bounty.</p></div>}
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
                    <p className="desktop-only pay__description">A one-time fee of <Price/> to create your wanted poster.<br/>Includes AI artwork and a download; supports the BERI community.</p>
                    <div className="desktop-only payment-choices" role="group" aria-label="Payment currency">{(["USDC", "USDT", "SOL"] as PaymentToken[]).map(token => <button key={token} type="button" disabled={phase !== "idle"} aria-pressed={paymentToken === token} className={paymentToken === token ? "is-selected" : ""} onClick={() => { setPaymentToken(token); setPayNote(null); }}><PaymentChoiceIcon token={token}/><span>{token}</span></button>)}</div>
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
                            <option value="USDC">USDC</option>
                            <option value="USDT">USDT</option>
                            <option value="SOL">SOL</option>
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
                          <LockIcon /><span>{priceText(payLabel)}</span>
                          <ArrowRight />
                        </button>
                        <p>
                          {paymentToken === "SOL" ? <>
                            {quoteLoading ? "Getting SOL quote…" : solQuote ? `${(solQuote.lamports / 1e9).toFixed(9)} SOL · ${quoteValid ? Math.ceil((solQuote.expiresAt - now) / 1000) + "s to approve" : "Quote expired"}` : "Quote unavailable"}
                            {phase === "idle" && !quoteLoading && <button type="button" onClick={refreshQuote} className="pay__quote-refresh">Refresh quote</button>}
                            <br /><Price/> at quoted rate. SOL network fee is additional.
                          </> : <>{FEE} {paymentToken} for your poster. SOL is needed for network and any token-account setup fees.</>}
                        </p>
                      </div>
                    </div>
                    <div className="payment-feedback" aria-live="polite" hidden={!feedbackOpen}>
                    {(payNote || (phase === "paid" && receipt) || (phase === "retry" && order && !order.signature)) && <button className="payment-feedback-close" type="button" aria-label="Close payment message" onClick={() => setFeedbackOpen(false)}>×</button>}
                    {phase === "paid" && receipt && (
                      <p className="pay__note" role="status">
                        Payment confirmed, your poster is ready.{" "}
                        <a href={`https://solscan.io/tx/${receipt}`} target="_blank" rel="noreferrer">
                          View transaction
                        </a>
                      </p>
                    )}
                    {phase === "retry" && order && !order.signature && <div className="order-recovery">
                      <input aria-label="Payment transaction signature" placeholder="Paste transaction signature if paid" onChange={(event) => {
                        const signature = event.target.value.trim();
                        if (/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) { const recovered = {...order,signature}; saveOrder(recovered); setOrder(recovered); }
                      }}/>
                      <button type="button" onClick={() => {
                        if (window.confirm("Only clear this order if you did NOT approve a payment. If you paid, keep this order and recover using your transaction signature.")) {
                          localStorage.removeItem("wanted-poster-order-v1"); setOrder(null); setPhase("idle"); setPayNote(null);
                        }
                      }}>Clear unpaid order</button>
                    </div>}
                    {payNote && (
                      <p className="pay__note pay__note--alert" role="status">
                        {payNote}
                      </p>
                    )}
                    </div>
                    <div className="desktop-only payment-trust"><span><ShieldIcon/>Secure Payment</span><span><BeriCoin/>One-time fee only</span><span><CompassIcon/>Supports BERI</span></div>
                    <p className="pay__secure">
                      <ShieldIcon />
                      <span>
                        The <Price/> fee is paid in USDC, USDT or SOL with your wallet approval.
                        <br />
                        Your photo is sent to OpenAI to create your anime portrait after payment.
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
                    portrait={generated ?? photo?.url ?? DEFAULT_PORTRAIT}
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
                        <strong>Private upload</strong>
                        Stored privately; sent to OpenAI after payment.
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
                    <h3>{priceText(stepTitle)}</h3>
                    <p>{priceText(text)}</p>
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
        <h2 className="step__title">{priceText(title)}</h2>
        {hint && <p className="step__hint">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

// Lining figures keep the currency sign and amount aligned in every serif text style.
function Price() { return <span className="creator-price">$5</span>; }
function priceText(text: string) {
  return text.split(/(\$5)/g).map((part, index) => part === "$5" ? <Price key={index}/> : part);
}
