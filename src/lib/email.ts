import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  "TENANTNET.NYC <notifications@tenantnet.nyc>";

function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#1a1a1a;color:#f5f0eb;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="border-bottom:2px solid #c45d3e;padding-bottom:12px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#f5f0eb;font-family:'Archivo Black',Impact,sans-serif;">
        TENANTNET.NYC
      </h1>
    </div>
    ${content}
    <div style="margin-top:32px;border-top:1px solid #3a3a3a;padding-top:16px;">
      <p style="margin:0;font-size:12px;color:#a8a29e;">
        You received this because you are a registered tenant on TENANTNET.NYC.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function sendNewPostNotification(
  to: string[],
  unitLabel: string,
  postTitle: string,
  sectionName: string,
  postUrl: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping new-post notification");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `New post in ${sectionName}: ${postTitle}`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          New Post
        </h2>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;">
          <strong style="color:#f5f0eb;">${unitLabel}</strong> posted in <strong style="color:#d4795f;">${sectionName}</strong>
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#f5f0eb;">${postTitle}</p>
        </div>
        <a href="${postUrl}" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:10px 20px;text-decoration:none;">
          View Post
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send new-post notification:", err);
  }
}

export async function sendCommentNotification(
  to: string,
  unitLabel: string,
  commenterLabel: string,
  postTitle: string,
  postUrl: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping comment notification");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${commenterLabel} commented on "${postTitle}"`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          New Comment
        </h2>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;">
          <strong style="color:#f5f0eb;">${commenterLabel}</strong> commented on your post
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#f5f0eb;">${postTitle}</p>
        </div>
        <a href="${postUrl}" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:10px 20px;text-decoration:none;">
          View Post
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send comment notification:", err);
  }
}

export async function sendStatusChangeNotification(
  to: string,
  unitLabel: string,
  postTitle: string,
  oldStatus: string,
  newStatus: string,
  postUrl: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping status-change notification");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Status updated: "${postTitle}" is now ${newStatus}`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Status Update
        </h2>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;">
          Your post status has changed
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#f5f0eb;">${postTitle}</p>
          <p style="margin:0;font-size:13px;">
            <span style="color:#a8a29e;text-transform:uppercase;">${oldStatus}</span>
            <span style="color:#a8a29e;margin:0 8px;">&rarr;</span>
            <span style="color:#d4a843;font-weight:700;text-transform:uppercase;">${newStatus}</span>
          </p>
        </div>
        <a href="${postUrl}" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:10px 20px;text-decoration:none;">
          View Post
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send status-change notification:", err);
  }
}
