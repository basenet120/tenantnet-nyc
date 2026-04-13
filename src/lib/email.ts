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
        You received this because you are associated with TENANTNET.NYC.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  unitLabel: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Welcome to TENANTNET.NYC, ${firstName}!`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Welcome Home
        </h2>
        <p style="margin:0 0 20px;font-size:15px;color:#f5f0eb;">
          Hey ${firstName} — we're excited to have you join our building's community.
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;color:#a8a29e;">Your Unit</p>
          <p style="margin:0;font-size:22px;font-weight:900;color:#f5f0eb;font-family:'Archivo Black',Impact,sans-serif;">${unitLabel}</p>
        </div>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;line-height:1.6;">
          TENANTNET.NYC is your building's private forum. Report maintenance issues, document landlord disputes, stay informed with bulletins, and connect with your neighbors.
        </p>
        <a href="https://tenantnet.nyc/dashboard" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:12px 24px;text-decoration:none;">
          Go to Your Dashboard
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err);
  }
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

export async function sendMgmtRepInvite(
  to: string,
  buildingName: string,
  tempPassword: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping mgmt rep invite");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `You've been invited to TENANTNET.NYC — ${buildingName}`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Management Rep Invite
        </h2>
        <p style="margin:0 0 20px;font-size:15px;color:#f5f0eb;">
          You've been invited as a management representative for <strong>${buildingName}</strong> on TENANTNET.NYC.
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;color:#a8a29e;">Your Temporary Password</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#f5f0eb;font-family:monospace;">${tempPassword}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#a8a29e;">Please change this after your first login.</p>
        </div>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;">
          As a management rep, you can view all posts and comment, helping maintain open communication with tenants.
        </p>
        <a href="https://tenantnet.nyc/admin/login" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:12px 24px;text-decoration:none;">
          Sign In
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send mgmt rep invite:", err);
  }
}

export async function sendTenantRepInvite(
  to: string,
  buildingName: string,
  tempPassword: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping tenant rep invite");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your building is on TENANTNET.NYC — ${buildingName}`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Tenant Rep Account
        </h2>
        <p style="margin:0 0 20px;font-size:15px;color:#f5f0eb;">
          <strong>${buildingName}</strong> has been set up on TENANTNET.NYC. You are the building's Tenant Representative.
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;color:#a8a29e;">Your Login Credentials</p>
          <p style="margin:0;font-size:14px;color:#f5f0eb;">Email: <strong>${to}</strong></p>
          <p style="margin:4px 0 0;font-size:14px;color:#f5f0eb;">Password: <strong style="font-family:monospace;">${tempPassword}</strong></p>
          <p style="margin:8px 0 0;font-size:12px;color:#a8a29e;">Please change your password after first login.</p>
        </div>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;">
          As Tenant Rep, you can manage units, sections, moderate posts, and invite management representatives.
        </p>
        <a href="https://tenantnet.nyc/admin/login" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:12px 24px;text-decoration:none;">
          Sign In
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send tenant rep invite:", err);
  }
}

export async function sendBuildingSignupConfirmation(
  to: string,
  address: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping signup confirmation");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `TENANTNET.NYC — We received your request for ${address}`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Request Received
        </h2>
        <p style="margin:0 0 20px;font-size:15px;color:#f5f0eb;">
          Thanks for your interest in TENANTNET.NYC for <strong>${address}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;line-height:1.6;">
          We've received your request and will review it shortly. If approved, we'll set up your building's private forum and send you login credentials.
        </p>
        <p style="margin:0;font-size:14px;color:#a8a29e;">
          Questions? Reply to this email.
        </p>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send signup confirmation:", err);
  }
}

export async function sendPostForwardEmail(
  to: string,
  postTitle: string,
  sectionName: string,
  buildingId: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping post forward");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `[Auto-Forward] New post in ${sectionName}: ${postTitle}`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Auto-Forwarded Post
        </h2>
        <p style="margin:0 0 16px;font-size:14px;color:#a8a29e;">
          A new post was created in <strong style="color:#d4795f;">${sectionName}</strong>
        </p>
        <div style="background:#2a2a2a;border:2px solid #3a3a3a;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#f5f0eb;">${postTitle}</p>
        </div>
        <a href="https://tenantnet.nyc/dashboard" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:10px 20px;text-decoration:none;">
          View on TENANTNET.NYC
        </a>
        <p style="margin:16px 0 0;font-size:12px;color:#a8a29e;">
          You receive this because auto-forward is enabled. Manage in your admin settings.
        </p>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send post forward:", err);
  }
}

export async function sendWeeklyDigest(
  to: string,
  posts: { title: string; sectionName: string; createdAt: Date }[],
  buildingName: string,
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping weekly digest");
    return;
  }

  const postRows = posts.map((p) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#f5f0eb;border-bottom:1px solid #3a3a3a;">
        <strong>${p.title}</strong>
        <br><span style="font-size:11px;color:#a8a29e;">${p.sectionName} &middot; ${p.createdAt.toLocaleDateString()}</span>
      </td>
    </tr>
  `).join("");

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Weekly Digest — ${buildingName} (${posts.length} posts)`,
      html: wrapHtml(`
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;text-transform:uppercase;color:#c45d3e;font-family:'Archivo Black',Impact,sans-serif;">
          Weekly Digest
        </h2>
        <p style="margin:0 0 20px;font-size:15px;color:#f5f0eb;">
          ${buildingName} — ${posts.length} new ${posts.length === 1 ? "post" : "posts"} this week
        </p>
        <table style="margin:0 0 24px;width:100%;" cellpadding="0" cellspacing="0">
          ${postRows || '<tr><td style="padding:8px 0;font-size:13px;color:#a8a29e;">No new posts this week.</td></tr>'}
        </table>
        <a href="https://tenantnet.nyc/dashboard" style="display:inline-block;background:#c45d3e;color:#f5f0eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:10px 20px;text-decoration:none;">
          Go to Dashboard
        </a>
      `),
    });
  } catch (err) {
    console.error("[email] Failed to send weekly digest:", err);
  }
}
