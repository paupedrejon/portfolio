import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TO_EMAIL = "paupedrejon@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reason, name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      console.error("GMAIL_USER or GMAIL_APP_PASSWORD not set in .env.local");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const reasonLabel = reason || "Contact";
    const subject = `Portfolio Contact: ${reasonLabel} - ${name}`;
    const html = `
      <h2>New contact from portfolio</h2>
      <p><strong>Reason:</strong> ${reasonLabel}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 16px; border-radius: 8px;">${message}</pre>
      <hr/>
      <p style="color: #666; font-size: 12px;">Sent from portfolio contact form</p>
    `;

    await transporter.sendMail({
      from: `"Portfolio" <${gmailUser}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
