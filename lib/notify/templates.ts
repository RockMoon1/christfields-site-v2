import { escapeHtml } from '@/lib/emails';
import type { MemberEvent } from '@/lib/schedule/public-event';
import type { Answer } from './rules';

/**
 * The event emails. Light theme like every other Christ Fields email (mobile
 * mail apps remap dark designs), one shell, plain words, and the same three
 * buttons the app shows. Every email names the event and the change, and the
 * first link always opens that event.
 */

export interface EventLinks {
  /** The event page (needs a sign-in). */
  open: string;
  /** One-tap answers that need no sign-in; absent when APP_TOKEN_SECRET is unset. */
  rsvp?: { going: string; maybe: string; cant: string };
  /** Signed .ics download; absent when the secret is unset. */
  ics?: string;
  /** Google Calendar template link (no sign-in). */
  google?: string;
  settings: string;
}

export interface EventMailInput {
  kind: 'created' | 'changed' | 'cancelled' | 'thanks' | 'reminder_24h' | 'nudge';
  event: MemberEvent;
  /** "Thursday, 7pm" in the recipient's own zone. */
  whenText: string;
  firstName: string;
  myAnswer: Answer;
  /** For changed: the one-line summary. For cancelled: the reason. For thanks: the note. */
  summary?: string;
  starters: string[];
  links: EventLinks;
  /** Series posts say so. */
  weekly?: boolean;
}

export interface Mail {
  subject: string;
  html: string;
  text: string;
}

const C = {
  bg: '#eef0ec',
  card: '#ffffff',
  border: '#e3e7e1',
  ink: '#1a221d',
  body: '#3f4a44',
  soft: '#6b7a72',
  faint: '#8a9a92',
  gold: '#c9a548',
  goldDeep: '#a8842c',
  cream: '#faf6ea',
  red: '#a4463f',
};

function button(label: string, href: string, primary = true): string {
  const bg = primary ? C.gold : '#ffffff';
  const fg = primary ? '#1a160a' : C.body;
  const border = primary ? C.gold : '#cfd6d1';
  return `<td style="padding:0 8px 8px 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;min-width:120px;padding:14px 18px;background-color:${bg};border:1px solid ${border};border-radius:4px;color:${fg};text-decoration:none;font-size:14px;font-weight:600;text-align:center;">${escapeHtml(label)}</a>
  </td>`;
}

function buttons(list: { label: string; href: string; primary?: boolean }[]): string {
  if (list.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px 0;"><tr>${list
    .map((b) => button(b.label, b.href, b.primary !== false))
    .join('')}</tr></table>`;
}

function shell(title: string, preheader: string, inner: string, footer: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${C.bg};color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}"><tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="max-width:560px;width:100%;background-color:${C.card};border:1px solid ${C.border};border-radius:6px;">
        <tr><td style="height:3px;background:linear-gradient(to right, #e4c97a, ${C.gold});font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 28px 6px 28px;">
          <p style="margin:0 0 14px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.goldDeep};font-weight:600;">Christ Fields</p>
          ${inner}
        </td></tr>
        <tr><td style="padding:18px 28px 26px 28px;border-top:1px solid ${C.border};">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${C.faint};">${footer}</p>
        </td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

function whereLine(e: MemberEvent): string {
  return e.location ? ` at ${e.location}` : '';
}

function eventBlock(e: MemberEvent, whenText: string, struck = false): string {
  const deco = struck ? 'text-decoration:line-through;' : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0 0;border-left:3px solid ${C.gold};"><tr>
    <td style="padding:12px 16px;background-color:${C.cream};">
      <p style="margin:0 0 2px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.goldDeep};">${escapeHtml(e.orgName)}</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:${C.ink};${deco}">${escapeHtml(e.title)}</p>
      <p style="margin:6px 0 0 0;font-size:16px;line-height:1.5;color:${C.body};${deco}">${escapeHtml(whenText)}${escapeHtml(whereLine(e))}</p>
      ${e.description ? `<p style="margin:8px 0 0 0;font-size:15px;line-height:1.6;color:${C.soft};">${escapeHtml(e.description)}</p>` : ''}
    </td>
  </tr></table>`;
}

function startersBlock(starters: string[]): string {
  if (starters.length === 0) return '';
  return `<p style="margin:22px 0 6px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.faint};">Two things you could ask someone</p>
  <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.7;color:${C.body};">${starters
    .slice(0, 2)
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('')}</ul>`;
}

type Button = { label: string; href: string; primary?: boolean };

function answerButtons(links: EventLinks, myAnswer: Answer): Button[] {
  if (!links.rsvp) return [{ label: 'Open Christ Fields', href: links.open }];
  if (myAnswer === 'going') {
    const list: Button[] = [{ label: 'See who is in', href: links.open }];
    if (links.google) list.push({ label: 'Add to Google Calendar', href: links.google, primary: false });
    return list;
  }
  return [
    { label: "I'm in", href: links.rsvp.going },
    { label: 'Not sure yet', href: links.rsvp.maybe, primary: false },
    { label: "I can't make it", href: links.rsvp.cant, primary: false },
  ];
}

function textLinks(links: EventLinks, myAnswer: Answer): string[] {
  const out: string[] = [];
  if (links.rsvp && myAnswer !== 'going') {
    out.push(`I'm in: ${links.rsvp.going}`, `Not sure yet: ${links.rsvp.maybe}`, `I can't make it: ${links.rsvp.cant}`);
  }
  out.push(`Open it: ${links.open}`);
  if (links.google) out.push(`Google Calendar: ${links.google}`);
  if (links.ics) out.push(`Apple or Outlook (.ics): ${links.ics}`);
  return out;
}

const FOOTER = (links: EventLinks) =>
  `You get these because you are part of this group on Christ Fields. Turn emails off any time on the <a href="${escapeHtml(links.settings)}" style="color:${C.faint};">You page</a>. Replies reach a person.`;

export function eventMail(input: EventMailInput): Mail {
  const { event: e, whenText, firstName, links, kind } = input;
  const hi = `Hi ${escapeHtml(firstName || 'there')},`;
  const where = whereLine(e);

  if (kind === 'cancelled') {
    const reason = (input.summary || '').trim();
    const subject = `${e.title} is called off`;
    const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.red};">Called off.</h1>
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.7;color:${C.body};">${hi}</p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:${C.body};">${escapeHtml(e.title)} on ${escapeHtml(whenText)} is not happening.${reason ? ` ${escapeHtml(reason)}` : ''}</p>
      ${eventBlock(e, whenText, true)}
      ${buttons([{ label: 'Open Christ Fields', href: links.open }])}`;
    const text = [
      `Hi ${firstName || 'there'},`,
      '',
      `${e.title} on ${whenText}${where} is called off.${reason ? ` ${reason}` : ''}`,
      '',
      `Open Christ Fields: ${links.open}`,
    ].join('\n');
    return { subject, html: shell(subject, `${e.title} on ${whenText} is not happening.`, inner, FOOTER(links)), text };
  }

  if (kind === 'thanks') {
    const note = (input.summary || '').trim();
    const subject = `Thanks from ${e.orgName}`;
    const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.ink};">Thank you.</h1>
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.7;color:${C.body};">${hi}</p>
      <p style="margin:0;font-size:17px;line-height:1.7;color:${C.ink};font-family:Georgia,'Times New Roman',serif;font-style:italic;">${escapeHtml(note)}</p>
      <p style="margin:14px 0 0 0;font-size:14px;color:${C.soft};">About ${escapeHtml(e.title)}, ${escapeHtml(whenText)}.</p>
      ${buttons([{ label: 'See what is next', href: links.settings.replace(/\/settings$/, '') }])}`;
    const text = [`Hi ${firstName || 'there'},`, '', note, '', `About ${e.title}, ${whenText}.`, '', `Open Christ Fields: ${links.open}`].join('\n');
    return { subject, html: shell(subject, note, inner, FOOTER(links)), text };
  }

  if (kind === 'changed') {
    const summary = (input.summary || '').trim();
    const subject = `${e.title} changed: ${whenText}`;
    const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.ink};">A change of plan.</h1>
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.7;color:${C.body};">${hi}</p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:${C.body};">${escapeHtml(summary || `${e.title} moved.`)} Here is where it stands now.</p>
      ${eventBlock(e, whenText)}
      ${buttons(answerButtons(links, input.myAnswer))}
      ${links.ics ? `<p style="margin:10px 0 0 0;font-size:13px;color:${C.soft};">Calendar: <a href="${escapeHtml(links.google || links.open)}" style="color:${C.goldDeep};">Google</a> &middot; <a href="${escapeHtml(links.ics)}" style="color:${C.goldDeep};">Apple or Outlook</a></p>` : ''}`;
    const text = [`Hi ${firstName || 'there'},`, '', summary || `${e.title} moved.`, '', `${e.title}: ${whenText}${where}`, '', ...textLinks(links, input.myAnswer)].join('\n');
    return { subject, html: shell(subject, summary, inner, FOOTER(links)), text };
  }

  if (kind === 'reminder_24h') {
    const going = input.myAnswer === 'going';
    const subject = going ? `Tomorrow: ${e.title}, ${whenText}` : `Tomorrow? ${e.title}, ${whenText}`;
    const lead = going
      ? `You are in for ${escapeHtml(e.title)} tomorrow, ${escapeHtml(whenText)}${escapeHtml(where)}. See you there.`
      : input.myAnswer === 'maybe'
        ? `You said not sure yet about ${escapeHtml(e.title)}, ${escapeHtml(whenText)}${escapeHtml(where)}. Know now?`
        : `${escapeHtml(e.title)} is ${escapeHtml(whenText)}${escapeHtml(where)}. Are you coming?`;
    const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.ink};">${going ? 'See you tomorrow.' : 'Tomorrow.'}</h1>
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.7;color:${C.body};">${hi}</p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:${C.body};">${lead}</p>
      ${eventBlock(e, whenText)}
      ${buttons(answerButtons(links, input.myAnswer))}
      ${going ? startersBlock(input.starters) : ''}`;
    const text = [
      `Hi ${firstName || 'there'},`,
      '',
      going
        ? `You are in for ${e.title} tomorrow, ${whenText}${where}.`
        : `${e.title} is tomorrow, ${whenText}${where}. Are you coming?`,
      '',
      ...textLinks(links, input.myAnswer),
      ...(going && input.starters.length ? ['', 'Two things you could ask someone:', ...input.starters.slice(0, 2).map((s) => `- ${s}`)] : []),
    ].join('\n');
    return { subject, html: shell(subject, `${e.title}, ${whenText}${where}`, inner, FOOTER(links)), text };
  }

  if (kind === 'nudge') {
    const subject = `Are you coming? ${e.title}, ${whenText}`;
    const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.ink};">Quick one.</h1>
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.7;color:${C.body};">${hi}</p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:${C.body};">Your leader is counting heads for ${escapeHtml(e.title)}, ${escapeHtml(whenText)}${escapeHtml(where)}. One tap tells them.</p>
      ${eventBlock(e, whenText)}
      ${buttons(answerButtons(links, 'none'))}`;
    const text = [`Hi ${firstName || 'there'},`, '', `Your leader is counting heads for ${e.title}, ${whenText}${where}. One tap tells them.`, '', ...textLinks(links, 'none')].join('\n');
    return { subject, html: shell(subject, `${e.title}, ${whenText}${where}`, inner, FOOTER(links)), text };
  }

  // created
  const weekly = !!input.weekly;
  const subject = weekly ? `New: ${e.title}, weekly from ${whenText}` : `New: ${e.title}, ${whenText}`;
  const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.ink};">Something new is on.</h1>
    <p style="margin:0 0 6px 0;font-size:16px;line-height:1.7;color:${C.body};">${hi}</p>
    <p style="margin:0;font-size:16px;line-height:1.7;color:${C.body};">${escapeHtml(e.orgName)} just posted ${escapeHtml(e.title)}${weekly ? ', every week' : ''}. Can you make it?</p>
    ${eventBlock(e, whenText)}
    ${buttons(answerButtons(links, input.myAnswer))}
    ${links.ics ? `<p style="margin:10px 0 0 0;font-size:13px;color:${C.soft};">Put it on your calendar: <a href="${escapeHtml(links.google || links.open)}" style="color:${C.goldDeep};">Google</a> &middot; <a href="${escapeHtml(links.ics)}" style="color:${C.goldDeep};">Apple or Outlook</a></p>` : ''}`;
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    `${e.orgName} just posted ${e.title}${weekly ? ' (every week)' : ''}: ${whenText}${where}. Can you make it?`,
    '',
    ...textLinks(links, input.myAnswer),
  ].join('\n');
  return { subject, html: shell(subject, `${e.title}, ${whenText}${where}`, inner, FOOTER(links)), text };
}

/* ============================================================
   The 7am leader brief.
   ============================================================ */

export interface LeaderBriefInput {
  event: MemberEvent;
  whenText: string;
  leaderFirstName: string;
  going: string[];
  maybe: string[];
  silent: string[];
  firstTimers: string[];
  gaps: string[];
  questions: string[];
  openUrl: string;
}

export function leaderBriefMail(b: LeaderBriefInput): Mail {
  const e = b.event;
  const subject = `Today: ${e.title}, ${b.whenText}. ${b.going.length} in.`;
  const names = (list: string[]) => (list.length ? list.join(', ') : 'nobody');
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.faint};width:130px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:15px;line-height:1.6;color:${C.body};">${escapeHtml(value)}</td></tr>`;
  const inner = `<h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${C.ink};">Today you lead.</h1>
    <p style="margin:0;font-size:16px;line-height:1.7;color:${C.body};">Hi ${escapeHtml(b.leaderFirstName || 'there')}, here is where ${escapeHtml(e.title)} stands this morning.</p>
    ${eventBlock(e, b.whenText)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0 0;">
      ${row(`${b.going.length} in`, names(b.going))}
      ${row(`${b.maybe.length} not sure`, names(b.maybe))}
      ${row(`${b.silent.length} quiet`, names(b.silent))}
      ${b.firstTimers.length ? row('First time', `${b.firstTimers.join(', ')}. Say their name back to them.`) : ''}
      ${b.gaps.length ? row('Still needed', b.gaps.join('; ')) : ''}
    </table>
    ${
      b.questions.length
        ? `<p style="margin:22px 0 6px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.faint};">Questions that might come up</p>
    <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.7;color:${C.body};">${b.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ul>`
        : ''
    }
    ${buttons([{ label: 'Open the event', href: b.openUrl }])}
    <p style="margin:8px 0 0 0;font-size:13px;color:${C.soft};">After it ends, tap who came. It takes a minute and it is how you notice who is drifting.</p>`;
  const text = [
    `Hi ${b.leaderFirstName || 'there'}, here is where ${e.title} stands this morning.`,
    '',
    `${e.title}: ${b.whenText}${whereLine(e)}`,
    `${b.going.length} in: ${names(b.going)}`,
    `${b.maybe.length} not sure: ${names(b.maybe)}`,
    `${b.silent.length} quiet: ${names(b.silent)}`,
    ...(b.firstTimers.length ? [`First time: ${b.firstTimers.join(', ')}`] : []),
    ...(b.gaps.length ? [`Still needed: ${b.gaps.join('; ')}`] : []),
    ...(b.questions.length ? ['', 'Questions that might come up:', ...b.questions.map((q) => `- ${q}`)] : []),
    '',
    `Open the event: ${b.openUrl}`,
  ].join('\n');
  return {
    subject,
    html: shell(subject, `${b.going.length} in, ${b.maybe.length} not sure, ${b.silent.length} quiet.`, inner, 'Leader briefs go to the leaders of this group on the morning of a gathering.'),
    text,
  };
}
