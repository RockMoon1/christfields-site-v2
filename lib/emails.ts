/**
 * Email templates for Christ Fields form submissions, sent via Resend.
 *
 * autoReply*  -> the branded thank-you sent to the person who submitted.
 * notificationHtml -> the internal email sent to the Christ Fields inbox so a
 *                     real person sees every submission.
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
      'FaithFlow groups are intentionally small and slow to form. If we are not currently opening new groups in your area, we will tell you that honestly, and we will keep you in mind for when we are.',
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
    'Christ Fields is built slowly, on purpose. We will reach out when there is something real to share. ScholarFlow at launch. FaithFlow as new groups form. Build progress as it happens.',
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
    ? 'FaithFlow groups are intentionally small and slow to form. If we are not currently opening new groups in your area, we will tell you that honestly, and we will keep you in mind for when we are.'
    : 'ScholarFlow at launch. FaithFlow as new groups form. Build progress as it happens. If you want to follow the work week by week, the Journal is the place.';
  const verse = isFaithFlow
    ? '“Let us consider how we may spur one another on toward love and good deeds, not giving up meeting together.”'
    : '“Commit your work to the Lord, and your plans will be established.”';
  const verseRef = isFaithFlow ? 'Hebrews 10:24–25' : 'Proverbs 16:3';

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Christ Fields</title></head>
  <body style="margin:0;padding:0;background-color:#060908;color:#f0f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060908;">
      <tr><td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#0c110e;border:1px solid #1a221d;border-radius:4px;">
          <tr><td style="height:2px;background:linear-gradient(to right, transparent, #c9a548, transparent);"></td></tr>
          <tr><td style="padding:36px 40px 0 40px;text-align:center;">
            <img src="https://christfields2717.com/assets/logo.png" alt="Christ Fields" width="140" style="display:block;margin:0 auto 14px auto;width:140px;max-width:55%;height:auto;border:0;" />
            <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a548;font-weight:500;">Christ Fields</p>
            <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#4e5e57;">Proverbs 27:17</p>
          </td></tr>
          <tr><td style="padding:30px 40px 10px 40px;">
            <h1 style="margin:0 0 24px 0;font-family:Georgia,'Times New Roman',serif;font-weight:300;font-size:34px;line-height:1.15;color:#f0f2ee;">${heading}</h1>
            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#c4ccca;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#c4ccca;">${intro}</p>
            <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#c4ccca;">${body}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;"><tr><td>
              <a href="https://christfields2717.com/journal" style="display:inline-block;padding:14px 24px;background-color:#c9a548;color:#000000;text-decoration:none;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:500;border-radius:2px;">Read the Journal &rarr;</a>
            </td></tr></table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;border-left:2px solid rgba(201,165,72,0.6);"><tr>
              <td style="padding:14px 20px;background-color:rgba(201,165,72,0.04);">
                <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.5;color:#f0f2ee;">${verse}</p>
                <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c9a548;">${verseRef}</p>
              </td>
            </tr></table>
            <p style="margin:30px 0 0 0;font-size:15px;line-height:1.7;color:#c4ccca;">Lisandro</p>
          </td></tr>
          <tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #1a221d;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#8a9a92;">Christ Fields</p>
            <p style="margin:0;font-size:12px;color:#4e5e57;">
              <a href="mailto:proverbs@christfields2717.com" style="color:#4e5e57;text-decoration:none;">proverbs@christfields2717.com</a>
              &nbsp;·&nbsp;
              <a href="https://christfields2717.com" style="color:#4e5e57;text-decoration:none;">christfields2717.com</a>
            </p>
          </td></tr>
          <tr><td style="height:1px;background:linear-gradient(to right, transparent, rgba(201,165,72,0.4), transparent);"></td></tr>
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
      <td style="padding:6px 0;font-size:15px;color:#f0f2ee;">${val || '<span style="color:#4e5e57;">(none)</span>'}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>New submission</title></head>
  <body style="margin:0;padding:0;background-color:#060908;color:#f0f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060908;"><tr><td align="center" style="padding:32px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#0c110e;border:1px solid #1a221d;border-radius:4px;">
        <tr><td style="height:2px;background:linear-gradient(to right, transparent, #c9a548, transparent);"></td></tr>
        <tr><td style="padding:24px 36px 8px 36px;">
          <img src="https://christfields2717.com/assets/logo.png" alt="Christ Fields" width="120" style="display:block;margin:0 auto 14px auto;width:120px;max-width:50%;height:auto;border:0;" />
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a548;font-weight:500;">New ${escapeHtml(label)} submission</p>
          <h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-weight:300;font-size:26px;color:#f0f2ee;">${escapeHtml(v.name)}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row('Email', `<a href="mailto:${escapeHtml(v.email)}" style="color:#e4c97a;text-decoration:none;">${escapeHtml(v.email)}</a>`)}
            ${row('Interest', escapeHtml(v.interest))}
            ${row('Message', escapeHtml(v.message).replace(/\n/g, '<br>'))}
          </table>
          <p style="margin:22px 0 4px 0;font-size:12px;color:#4e5e57;">Reply to this email to respond to ${escapeHtml(v.name)} directly.</p>
        </td></tr>
        <tr><td style="height:24px;"></td></tr>
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
