/**
 * Email templates for Christ Fields form submissions, sent via Resend.
 *
 * Light theme on purpose: mobile mail apps (notably Gmail on iOS) force-convert
 * dark emails to a remapped white background, so a dark design renders
 * inconsistently. A light design with a color-scheme hint renders the same on
 * every device and in light or dark mode.
 *
 * autoReply*  -> the branded thank-you sent to the person who submitted.
 * notificationHtml -> the internal email sent to the Christ Fields inbox.
 */

interface AutoReplyVars {
  firstName: string;
  formName: string;
}

export function autoReplyText({ firstName, formName }: AutoReplyVars): string {
  if (formName === 'faithflow') {
    return [
      `Hi ${firstName},`,
      '',
      'Thank you for reaching out about FaithFlow.',
      '',
      'We read every message that comes through this form. Someone from Christ Fields will respond personally, usually within a few days.',
      '',
      'FaithFlow is one community, Iron and Ember, and it grows slowly on purpose. If joining is not the right fit right now, including by distance, we will tell you that honestly, and we will keep you in mind.',
      '',
      '"Let us consider how we may spur one another on toward love and good deeds, not giving up meeting together." Hebrews 10:24-25',
      '',
      'In the meantime, the Journal at https://christfields2717.com/journal is where we write about how the work is going.',
      '',
      'Lisandro',
      'Christ Fields',
      'proverbs@christfields2717.com',
    ].join('\n');
  }

  return [
    `Hi ${firstName},`,
    '',
    'You are in. Thank you for joining the journey.',
    '',
    'Christ Fields is built slowly, on purpose. We will reach out when there is something real to share. New tools as they open. FaithFlow news as the community grows. Build progress as it happens.',
    '',
    'If you want to follow the work week by week, the Journal is the place to be:',
    'https://christfields2717.com/journal',
    '',
    '"Commit your work to the Lord, and your plans will be established." Proverbs 16:3',
    '',
    'Lisandro',
    'Christ Fields',
    'proverbs@christfields2717.com',
  ].join('\n');
}

export function autoReplyHtml({ firstName, formName }: AutoReplyVars): string {
  const isFaithFlow = formName === 'faithflow';
  const heading = isFaithFlow ? 'Thank you for reaching out' : 'You’re in.';
  const intro = isFaithFlow
    ? 'Thank you for reaching out about FaithFlow. We read every message that comes through this form. Someone from Christ Fields will respond personally, usually within a few days.'
    : 'Thank you for joining the journey. Christ Fields is built slowly, on purpose. We will reach out when there is something real to share.';
  const body = isFaithFlow
    ? 'FaithFlow is one community, Iron and Ember, and it grows slowly on purpose. If joining is not the right fit right now, including by distance, we will tell you that honestly, and we will keep you in mind.'
    : 'New tools as they open. FaithFlow news as the community grows. Build progress as it happens. If you want to follow the work week by week, the Journal is the place.';
  const verse = isFaithFlow
    ? '“Let us consider how we may spur one another on toward love and good deeds, not giving up meeting together.”'
    : '“Commit your work to the Lord, and your plans will be established.”';
  const verseRef = isFaithFlow ? 'Hebrews 10:24–25' : 'Proverbs 16:3';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Christ Fields</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef0ec;color:#2b332e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0ec" style="background-color:#eef0ec;">
      <tr><td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e3e7e1;border-radius:6px;">
          <tr><td style="height:3px;background:linear-gradient(to right, #e4c97a, #c9a548);font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:36px 40px 0 40px;text-align:center;">
            <img src="https://christfields2717.com/assets/logo.png" alt="Christ Fields" width="140" style="display:block;margin:0 auto 14px auto;width:140px;max-width:55%;height:auto;border:0;" />
            <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8842c;font-weight:600;">Christ Fields</p>
            <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a9a92;">Proverbs 27:17</p>
          </td></tr>
          <tr><td style="padding:28px 40px 10px 40px;">
            <h1 style="margin:0 0 24px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:32px;line-height:1.2;color:#1a221d;">${heading}</h1>
            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#3f4a44;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#3f4a44;">${intro}</p>
            <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#3f4a44;">${body}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;"><tr>
              <td bgcolor="#c9a548" style="background-color:#c9a548;border-radius:3px;">
                <a href="https://christfields2717.com/journal" style="display:inline-block;padding:14px 24px;color:#1a160a;text-decoration:none;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:600;">Read the Journal &rarr;</a>
              </td>
            </tr></table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;border-left:3px solid #c9a548;"><tr>
              <td style="padding:14px 20px;background-color:#faf6ea;">
                <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.5;color:#2b332e;">${verse}</p>
                <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a8842c;">${verseRef}</p>
              </td>
            </tr></table>
            <p style="margin:30px 0 0 0;font-size:15px;line-height:1.7;color:#3f4a44;">Lisandro</p>
          </td></tr>
          <tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #e3e7e1;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#6b7a72;">Christ Fields</p>
            <p style="margin:0;font-size:12px;color:#8a9a92;">
              <a href="mailto:proverbs@christfields2717.com" style="color:#8a9a92;text-decoration:none;">proverbs@christfields2717.com</a>
              &nbsp;·&nbsp;
              <a href="https://christfields2717.com" style="color:#8a9a92;text-decoration:none;">christfields2717.com</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function notificationHtml(v: {
  formName: string;
  name: string;
  email: string;
  interest: string;
  message: string;
}): string {
  const label = v.formName === 'faithflow' ? 'FaithFlow' : 'ScholarFlow waitlist';
  const row = (k: string, val: string) =>
    `<tr>
      <td style="padding:6px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a9a92;width:120px;vertical-align:top;">${k}</td>
      <td style="padding:6px 0;font-size:15px;color:#2b332e;">${val || '<span style="color:#aab2ac;">(none)</span>'}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>New submission</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef0ec;color:#2b332e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0ec" style="background-color:#eef0ec;"><tr><td align="center" style="padding:32px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e3e7e1;border-radius:6px;">
        <tr><td style="height:3px;background:linear-gradient(to right, #e4c97a, #c9a548);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 36px 8px 36px;">
          <img src="https://christfields2717.com/assets/logo.png" alt="Christ Fields" width="120" style="display:block;margin:0 auto 14px auto;width:120px;max-width:50%;height:auto;border:0;" />
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8842c;font-weight:600;">New ${escapeHtml(label)} submission</p>
          <h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#1a221d;">${escapeHtml(v.name)}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row('Email', `<a href="mailto:${escapeHtml(v.email)}" style="color:#a8842c;text-decoration:none;">${escapeHtml(v.email)}</a>`)}
            ${row('Interest', escapeHtml(v.interest))}
            ${row('Message', escapeHtml(v.message).replace(/\n/g, '<br>'))}
          </table>
          <p style="margin:22px 0 4px 0;font-size:12px;color:#8a9a92;">Reply to this email to respond to ${escapeHtml(v.name)} directly.</p>
        </td></tr>
        <tr><td style="height:24px;"></td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

/**
 * Internal email for in-app member feedback (the "what should we add?" box).
 * Sent to the Christ Fields inbox so Lisandro sees every suggestion.
 */
export function feedbackNotificationHtml(v: {
  category: string;
  message: string;
  fromName: string;
  fromEmail: string;
}): string {
  const row = (k: string, val: string) =>
    `<tr>
      <td style="padding:6px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a9a92;width:120px;vertical-align:top;">${k}</td>
      <td style="padding:6px 0;font-size:15px;color:#2b332e;">${val || '<span style="color:#aab2ac;">(none)</span>'}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>New feedback</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef0ec;color:#2b332e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0ec" style="background-color:#eef0ec;"><tr><td align="center" style="padding:32px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e3e7e1;border-radius:6px;">
        <tr><td style="height:3px;background:linear-gradient(to right, #e4c97a, #c9a548);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 36px 8px 36px;">
          <img src="https://christfields2717.com/assets/logo.png" alt="Christ Fields" width="120" style="display:block;margin:0 auto 14px auto;width:120px;max-width:50%;height:auto;border:0;" />
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8842c;font-weight:600;">Member feedback</p>
          <h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#1a221d;">${escapeHtml(v.category)}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row('From', escapeHtml(v.fromName))}
            ${row('Email', v.fromEmail ? `<a href="mailto:${escapeHtml(v.fromEmail)}" style="color:#a8842c;text-decoration:none;">${escapeHtml(v.fromEmail)}</a>` : '')}
            ${row('Feedback', escapeHtml(v.message).replace(/\n/g, '<br>'))}
          </table>
          <p style="margin:22px 0 4px 0;font-size:12px;color:#8a9a92;">Reply to this email to respond to ${escapeHtml(v.fromName)} directly.</p>
        </td></tr>
        <tr><td style="height:24px;"></td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

/**
 * Internal email for a leader readiness assessment. Long on purpose: the whole
 * point is to read what someone actually wrote, so the scenarios come through
 * in full rather than as a "view in dashboard" link.
 */
export function leaderAssessmentHtml(v: {
  name: string;
  email: string;
  phone: string;
  church: string;
  isMinor: boolean;
  guardianName: string;
  guardianEmail: string;
  /** Whether the parent actually heard, said here rather than left in a log. */
  guardianStatus: 'sent' | 'failed' | 'suppressed' | 'none';
  /** Keyword hits in what they wrote about themselves. Not a diagnosis. */
  urgent: string[];
  /** Under-18: exactly what they chose to let their parent see. */
  forwardable: { prompt: string; answer: string }[];
  withheldCount: number;
  gatePassed: boolean;
  /** Non-negotiables answered "no". The loudest thing this form can produce. */
  declined: string[];
  /** The questions as asked, so rows read as questions and not as column names. */
  commitmentSet: { id: string; question: string; nonNegotiable?: boolean }[];
  gates: Record<string, boolean>;
  doctrine: Record<string, boolean>;
  commitments: Record<string, boolean>;
  walk: Record<string, string>;
  scenarios: Record<string, string>;
  /** Under-18 only: which written answers the applicant sent to their guardian. */
  visibility?: Record<string, boolean>;
}): string {
  /**
   * Worth seeing. A young person who kept a particular answer back is telling
   * you something too, and it is usually the one to ask gently about in person.
   */
  const kept = (id: string) =>
    v.isMinor && v.visibility && v.visibility[id] === false
      ? '<span style="margin-left:8px;padding:1px 6px;background:#f8eeed;color:#a4463f;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">kept from parent</span>'
      : '';

  const yn = (b: boolean) =>
    b
      ? '<span style="color:#2d6a4f;font-weight:600;">Yes</span>'
      : '<span style="color:#a4463f;font-weight:600;">No</span>';

  /**
   * `labels` turns the stored ids into the questions as they were asked. Without
   * it a declined non-negotiable renders as `c_report_abuse  No` and sits
   * visually identical to `c_not_status  No` in a seventeen-row list, which is
   * the single most important signal on the form hiding in the least readable
   * place in the artifact.
   */
  const boolBlock = (
    title: string,
    map: Record<string, boolean>,
    labels?: Record<string, { question: string; nonNegotiable?: boolean }>,
  ) => `
    <p style="margin:20px 0 6px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a8842c;font-weight:600;">${escapeHtml(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${Object.entries(map)
        .map(([k, val]) => {
          const meta = labels?.[k];
          const flag = meta?.nonNegotiable && !val;
          return `<tr><td style="padding:6px 10px 6px 0;font-size:13px;line-height:1.5;color:${flag ? '#a4463f' : '#4a544e'};${flag ? 'font-weight:600;background:#f8eeed;' : ''}">${escapeHtml(meta?.question ?? k)}</td><td style="padding:6px 0;font-size:13px;text-align:right;vertical-align:top;${flag ? 'background:#f8eeed;' : ''}">${yn(val)}</td></tr>`;
        })
        .join('')}
    </table>`;

  const textBlock = (title: string, map: Record<string, string>) => `
    <p style="margin:22px 0 6px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a8842c;font-weight:600;">${escapeHtml(title)}</p>
    ${Object.entries(map)
      .map(
        ([k, val]) =>
          `<div style="margin:0 0 14px 0;padding:10px 12px;background:#f6f7f5;border-left:3px solid #e4c97a;">
             <p style="margin:0 0 4px 0;font-size:11px;color:#8a9a92;">${escapeHtml(k)}${kept(k)}</p>
             <p style="margin:0;font-size:14px;line-height:1.55;color:#2b332e;">${escapeHtml(val || '(left blank)').replace(/\n/g, '<br>')}</p>
           </div>`,
      )
      .join('')}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light">
    <title>Leader readiness</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef0ec;color:#2b332e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0ec"><tr><td align="center" style="padding:32px 20px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:640px;width:100%;background-color:#ffffff;border:1px solid #e3e7e1;border-radius:6px;">
        <tr><td style="height:3px;background:linear-gradient(to right, #e4c97a, #c9a548);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 36px 28px 36px;">
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8842c;font-weight:600;">Leader readiness</p>
          <h1 style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#1a221d;">${escapeHtml(v.name)}</h1>
          <p style="margin:0 0 18px 0;font-size:14px;color:#4a544e;">
            <a href="mailto:${escapeHtml(v.email)}" style="color:#a8842c;text-decoration:none;">${escapeHtml(v.email)}</a>
            ${v.phone ? ` &middot; ${escapeHtml(v.phone)}` : ''}<br>
            Church: ${escapeHtml(v.church)}
            ${
              v.isMinor
                ? `<br><strong style="color:#a4463f;">Under 18.</strong> Guardian: ${escapeHtml(v.guardianName)}${v.guardianEmail ? ` &lt;${escapeHtml(v.guardianEmail)}&gt;` : ''}. The covenant needs a guardian co-signature (Section 13), and this leader serves under a screened adult (Section 14).`
                : ''
            }
          </p>
          ${
            v.urgent.length
              ? `<p style="margin:0 0 10px 0;padding:14px 16px;background:#a4463f;font-size:15px;line-height:1.6;color:#ffffff;">
                   <strong>Read this one today.</strong><br>
                   What they wrote about their own life contains: ${v.urgent.map((t) => escapeHtml(t)).join(', ')}.<br>
                   <span style="font-size:13px;opacity:0.9;">A keyword match, not a judgment. It may be nothing. Open it and decide, rather than find out on Tuesday.</span>
                 </p>`
              : ''
          }
          ${
            v.guardianStatus === 'failed' || v.guardianStatus === 'suppressed'
              ? `<p style="margin:0 0 10px 0;padding:12px 14px;background:#f8eeed;border-left:4px solid #a4463f;font-size:14px;line-height:1.6;color:#2b332e;">
                   <strong style="color:#a4463f;">The guardian was not emailed.</strong>
                   ${v.guardianStatus === 'suppressed' ? 'A rate limit suppressed it, which usually means a resubmission.' : 'The send failed.'}
                   Contact ${escapeHtml(v.guardianName || 'them')} yourself today.
                 </p>`
              : ''
          }
          ${
            v.declined.length
              ? `<p style="margin:0 0 4px 0;padding:12px 14px;background:#f8eeed;border-left:4px solid #a4463f;font-size:14px;line-height:1.6;color:#2b332e;">
                   <strong style="color:#a4463f;">Answered no to ${v.declined.length === 1 ? 'a non-negotiable' : `${v.declined.length} non-negotiables`}.</strong><br>
                   ${v.declined.map((q) => escapeHtml(q)).join('<br>')}
                 </p>`
              : ''
          }
          <p style="margin:0 0 4px 0;padding:10px 12px;background:${v.gatePassed ? '#eef5f0' : '#f8eeed'};font-size:14px;color:#2b332e;">
            Gates and doctrine: ${v.gatePassed ? '<strong style="color:#2d6a4f;">all affirmed</strong>' : '<strong style="color:#a4463f;">not all affirmed</strong>'}
          </p>
          ${boolBlock('Gates', v.gates)}
          ${boolBlock('Doctrine', v.doctrine)}
          ${boolBlock(
            'Commitments',
            v.commitments,
            Object.fromEntries(
              v.commitmentSet.map((c) => [c.id, { question: c.question, nonNegotiable: c.nonNegotiable }]),
            ),
          )}
          ${textBlock('Their walk', v.walk)}
          ${textBlock('Scenarios', v.scenarios)}
          ${
            v.isMinor
              ? `<div style="margin:26px 0 0 0;padding:16px 18px;background:#eef5f0;border:1px solid #cfe0d5;">
                   <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#2d6a4f;font-weight:600;">Ready to send ${escapeHtml(v.guardianName || 'their guardian')}, once you have read it</p>
                   <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#4a544e;">
                     ${escapeHtml(v.guardianName || 'The guardian')} has already been told ${escapeHtml(v.name)} applied, and that
                     the answers come from a person after we have read them. This is exactly what
                     ${escapeHtml(v.name)} chose to let them see${v.withheldCount > 0 ? `, with ${v.withheldCount} held back` : ''}. Nothing below has been sent yet.
                   </p>
                   ${
                     v.forwardable.length
                       ? v.forwardable
                           .map(
                             (s) => `<div style="margin:0 0 12px 0;padding:10px 12px;background:#ffffff;border-left:3px solid #2d6a4f;">
                                <p style="margin:0 0 4px 0;font-size:11px;color:#8a9a92;">${escapeHtml(s.prompt)}</p>
                                <p style="margin:0;font-size:14px;line-height:1.55;color:#2b332e;">${escapeHtml(s.answer).replace(/\n/g, '<br>')}</p>
                              </div>`,
                           )
                           .join('')
                       : `<p style="margin:0;font-size:14px;color:#4a544e;">They kept every answer back. Worth a gentle conversation in person, not an email.</p>`
                   }
                 </div>`
              : ''
          }
          <p style="margin:22px 0 0 0;font-size:12px;line-height:1.6;color:#8a9a92;">
            ${
              v.isMinor
                ? `Under 18. Replies go to ${escapeHtml(v.guardianName || 'their guardian')}, not to ${escapeHtml(v.name)}. Do not open a private one-to-one thread with this applicant &mdash; Covenant Section 14, and the commitment they just made on this form.`
                : `Reply to this email to reach ${escapeHtml(v.name)} directly.`
            }
          </p>
        </td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

/**
 * Sent to a parent or guardian the moment someone under 18 submits the leader
 * readiness assessment.
 *
 * CONTAINS NONE OF THEIR ANSWERS, and that is the whole point of this template.
 *
 * The applicant chooses, one answer at a time, what their parent may see, and
 * the default is everything. But this email leaves automatically, in the same
 * second the young person presses send, before a single word has been read.
 * Sending the answers on that trigger would mean an honest account of what a
 * fifteen-year-old is struggling with arriving in a house that may be the
 * reason she is struggling, with nobody having looked first. So the parent gets
 * the notice now, and the answers their child chose to share come from a human
 * afterwards. The founder's own copy carries a ready-to-forward block.
 *
 * Which also keeps this email honest. It cannot claim anything about what is in
 * the answers, because at send time nothing knows.
 */
export function guardianNoticeHtml(v: {
  guardianName: string;
  leaderName: string;
  /** True if they wrote anything at all, so the note can be accurate. */
  hasAnswers: boolean;
}): string {
  const answersBlock = v.hasAnswers
    ? `<p style="margin:22px 0 14px 0;padding:12px 14px;background:#f6f7f5;border-left:3px solid #e4c97a;font-size:15px;line-height:1.65;color:#2b332e;">
         ${escapeHtml(v.leaderName)} wrote answers to all of it, and chose, question by question, which
         of them we may show you. Nothing is attached here, because this email left the moment they
         pressed send and none of us has read a word yet. Once we have, we will send you what they
         chose to share &mdash; and the rest is theirs to tell you in their own time.
       </p>
       <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">
         We gave them that choice on purpose. A young person who knows every word goes straight home
         tends to write what sounds right rather than what is true, and the truth is what keeps them
         safe. What we will not do is sit on something. If anything they write makes us think
         ${escapeHtml(v.leaderName)} is not safe, we act on it &mdash; and depending on what it is, that
         means a phone call to you, and it may mean the people whose job it is to keep them safe.
       </p>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Christ Fields</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef0ec;color:#2b332e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0ec"><tr><td align="center" style="padding:32px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e3e7e1;border-radius:6px;">
        <tr><td style="height:3px;background:linear-gradient(to right, #e4c97a, #c9a548);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 36px 30px 36px;">
          <img src="https://christfields2717.com/assets/logo.png" alt="Christ Fields" width="120" style="display:block;margin:0 auto 18px auto;width:120px;max-width:50%;height:auto;border:0;" />
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8842c;font-weight:600;">Christ Fields &middot; Iron and Ember</p>
          <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#1a221d;">${escapeHtml(v.guardianName)}, a quick note about ${escapeHtml(v.leaderName)}.</h1>

          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">
            ${escapeHtml(v.leaderName)} has just asked to be considered for leading a small group
            with us, and gave us your email because they are under 18. We wanted you to hear that
            from us straight away rather than later.
          </p>

          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">
            Nothing has been decided and nothing has been signed. This was a set of honest
            questions about whether leading is right for them in this season.
          </p>

          <p style="margin:22px 0 8px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a8842c;font-weight:600;">What leading here involves</p>
          <ul style="margin:0 0 14px 0;padding-left:20px;font-size:15px;line-height:1.7;">
            <li>Being at the gatherings twice a week, alongside a co-leader, never on their own.</li>
            <li>A leader under 18 always serves under the supervision of a screened adult, and is never left solely responsible for a group.</li>
            <li>No adult is ever alone one on one with a minor, and messaging with minors stays in group channels or includes a parent.</li>
            <li>They stay planted in your own church; this does not replace it.</li>
          </ul>

          <p style="margin:22px 0 8px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a8842c;font-weight:600;">What we would ask of you</p>
          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">
            If this does go further, our Leadership Covenant needs your signature alongside
            theirs. We would walk you both through it in person and give it to you at least
            seven days before anyone signs, so you can read it properly and pray about it.
          </p>

          <p style="margin:22px 0 8px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a8842c;font-weight:600;">What we asked them</p>
          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">
            Their own prayer and Scripture, who holds them accountable, what they are struggling
            with, why they want to lead, and how they would handle real situations with young
            people. The questions are not confidential &mdash; reply and we will send you every one
            of them.
          </p>

          ${answersBlock}

          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">
            Their answers are kept in our records so we can read them properly and come back to
            them. Reply at any time and we will delete them.
          </p>

          <p style="margin:0 0 6px 0;font-size:15px;line-height:1.65;">
            If you have questions, or you would rather they did not go further with this, just
            reply to this email. Either answer is completely fine.
          </p>

          <p style="margin:22px 0 0 0;padding-top:16px;border-top:1px solid #e3e7e1;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:#4a544e;">
            &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
            <span style="display:block;margin-top:4px;font-style:normal;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8842c;">Proverbs 27:17</span>
          </p>
          <p style="margin:16px 0 0 0;font-size:14px;color:#2b332e;">Lisandro<br><span style="color:#8a9a92;">Christ Fields</span></p>
        </td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
