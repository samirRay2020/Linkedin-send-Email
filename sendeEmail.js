const nodemailer = require("nodemailer");

async function run() {
  // 👉 replace with your gist raw URL
  const GIST_URL = "https://gist.githubusercontent.com/samirRay2020/48921ceacc845ba5bcbb5463052e0d5c/raw/linkedin-data.json";

  const res = await fetch(GIST_URL);
  const data = await res.json();

  if (!data || data.length === 0) {
    console.log("No data to send");
    return;
  }

  // Format email nicely
  const formatted = data.map(item => {
    return `• ${item.author}\n${item.url}\n`;
  }).join("\n");

  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // change if needed
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "LinkedIn Daily Updates",
    text: formatted,
  });

  console.log("Email sent");
}

run();