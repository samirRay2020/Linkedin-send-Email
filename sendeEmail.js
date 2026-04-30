const nodemailer = require("nodemailer");

async function run() {
  const GIST_URL = "https://gist.githubusercontent.com/samirRay2020/48921ceacc845ba5bcbb5463052e0d5c/raw/linkedin-data.json";

  const res = await fetch(GIST_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch gist data: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const items = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
        ? json.items
        : [];

  if (items.length === 0) {
    console.log("No data to send");
    return;
  }

  const formatted = items
    .map((item) => `• ${item.author ?? "Unknown author"}\n${item.url ?? "No URL provided"}\n`)
    .join("\n");

  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  const mailToRaw = process.env.EMAIL_TO || smtpUser;
  const mailFrom = smtpUser;

  // Validate required environment variables
  if (!smtpUser || !smtpPass) {
    console.error("[❌] Missing required environment variables");
    console.error(`[DEBUG] EMAIL_USER: ${smtpUser ? "✓ " + smtpUser : "❌ missing"}`);
    console.error(
      `[DEBUG] EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? "✓ set" : "❌ not set"}`
    );
    console.error(`[DEBUG] EMAIL_PASS: ${process.env.EMAIL_PASS ? "✓ set" : "❌ not set"}`);
    throw new Error(
      "EMAIL_USER and (EMAIL_APP_PASSWORD or EMAIL_PASS) are required to send email"
    );
  }

  if (!mailToRaw) {
    console.error("[❌] No email recipient specified");
    throw new Error("EMAIL_TO or EMAIL_USER is required to send email");
  }

  // Support comma-separated receivers
  const mailToList = mailToRaw
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  if (mailToList.length === 0) {
    console.error("[❌] No valid email addresses found in EMAIL_TO");
    throw new Error("EMAIL_TO must contain at least one valid email address");
  }

  console.log(`[📧] Email recipients: ${mailToList.join(", ")}`);

  const transporter = nodemailer.createTransport({
    host: "smtp.strato.de",
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  console.log("[📡] Verifying SMTP connection...");
  await transporter.verify();
  console.log("[✅] SMTP connection verified");

  console.log("[📨] Sending email...");
  await transporter.sendMail({
    from: mailFrom,
    to: mailToList,
    subject: "LinkedIn Daily Updates",
    text: formatted,
  });

  console.log("[✅] Email sent successfully");
}

run();
