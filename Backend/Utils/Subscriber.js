const { Resend } = require("resend");
const Subscriber = require("../models/Subscriber");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNewsletter = async (subject, htmlContent) => {
 const subscribers = await Subscriber.find();

  // Send newsletter to all subscribers using Resend
  for (let sub of subscribers) {
    try {
      await resend.emails.send({
        from: "MediPredict Newsletter <onboarding@resend.dev>",
        to: [sub.email],
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error(`❌ Failed to send newsletter to ${sub.email}:`, error);
      // Continue with other subscribers even if one fails
    }
  }

  console.log("✅ Newsletter sent to", subscribers.length, "subscribers.");
};

module.exports = sendNewsletter;
