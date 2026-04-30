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
  const smtpPass = process.env.EMAIL_PASS;
  const mailTo = process.env.EMAIL_TO || smtpUser;
  const mailFrom = smtpUser;

  if (!smtpUser || !smtpPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS are required to send email");
  }

  if (!mailTo) {
    throw new Error("EMAIL_TO or EMAIL_USER is required to send email");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.strato.de",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.verify();

  await transporter.sendMail({
    from: mailFrom,
    to: mailTo,
    subject: "LinkedIn Daily Updates",
    text: formatted,
  });

  console.log("Email sent");
}

run();
