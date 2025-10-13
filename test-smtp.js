// node test-smtp.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: "resend",
    pass: "re_RdqFXTeL_LkiJJcCXhQd3NQ3AVF22SNh3", // e.g. re_xxx
  },
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: '"Tbz Labs (Dev)" <onboarding@resend.dev>',
      to: "YOUR_TEST_EMAIL@gmail.com",
      subject: "Resend SMTP test",
      text: "SMTP test from Resend",
      html: "<b>SMTP test from Resend</b>",
    });
    console.log("Sent OK:", info);
  } catch (e) {
    console.error("SMTP test failed:", e);
  }
}

run();
