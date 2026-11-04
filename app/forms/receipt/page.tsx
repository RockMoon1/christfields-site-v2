'use client';
import {useEffect, useRef, useState} from 'react';

type SavedReceipt = {id:string; form_slug:string; created_at:string; interest:string; available:string[]; unavailable:string[]};
const receivedTime = new Intl.DateTimeFormat('en-US', {dateStyle:'long', timeStyle:'short', timeZone:'UTC'});

export default function Receipt() {
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [receipt, setReceipt] = useState<SavedReceipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setToken(window.location.hash.slice(1));
    history.replaceState(null, '', window.location.pathname);
    setReady(true);
  }, []);
  useEffect(() => { if (receipt) heading.current?.focus(); }, [receipt]);

  async function confirm() {
    if (inFlight.current || receipt || expired || !token) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/forms/receipt', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token}),
      });
      const data = await response.json();
      if (response.ok && data.receipt) {
        setReceipt(data.receipt);
        setToken('');
      } else {
        if (response.status === 404) setExpired(true);
        setError(typeof data.error === 'string' ? data.error : 'Receipt unavailable. Try again later.');
      }
    } catch {
      setError('Receipt unavailable. Check your connection and try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <section className="my-10 space-y-5 break-words">
    <h1 className="font-display text-4xl">Your response receipt</h1>
    <p>Keep this link private. Anyone with the link can view this receipt until it expires, 24 hours after it was issued. Forwarding it shares access to your response reference, event, received time, interest and date choices.</p>
    {receipt ? <>
      <h2 ref={heading} tabIndex={-1} className="font-display text-3xl">Email confirmed</h2>
      <p role="status">Your saved receipt is ready. Confirmation verifies access through the emailed link, not your identity, attendance or a ticket.</p>
      <dl className="space-y-4">
        <div><dt className="font-semibold">Response reference</dt><dd className="break-all">{receipt.id}</dd></div>
        <div><dt className="font-semibold">Event</dt><dd>{receipt.form_slug}</dd></div>
        <div><dt className="font-semibold">Received</dt><dd><time dateTime={receipt.created_at}>{receivedTime.format(new Date(receipt.created_at))} UTC</time></dd></div>
        <div><dt className="font-semibold">Interest</dt><dd>{({yes:'Interested',maybe:'Maybe',no:'Cannot attend'} as Record<string,string>)[receipt.interest] || receipt.interest}</dd></div>
        <div><dt className="font-semibold">Available dates</dt><dd>{receipt.available.join(', ') || 'Not specified'}</dd></div>
        <div><dt className="font-semibold">Unavailable dates</dt><dd>{receipt.unavailable.join(', ') || 'Not specified'}</dd></div>
      </dl>
    </> : <>
      <p>Only confirm if you requested this receipt. This verifies access through the emailed link; it does not establish your identity or confirm attendance.</p>
      {ready && !token ? <p role="status">Open the complete private link from your receipt email to continue.</p> : !expired && <button disabled={!ready || busy} onClick={confirm} className="min-h-12 rounded bg-gold px-6 py-3 text-black disabled:opacity-50">{busy ? 'Checking…' : 'Confirm and view receipt'}</button>}
      {busy && <p role="status">Checking your receipt…</p>}
      {error && <p role="alert">{error}</p>}
      {expired && <p>This link cannot be used. Contact the organizer if you need help with your saved response.</p>}
    </>}
  </section>;
}
