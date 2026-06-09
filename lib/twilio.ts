import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!;

export const twilioClient = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(to: string, body: string) {
  if (!to) throw new Error("Missing WhatsApp destination number");
  if (!fromNumber) throw new Error("Missing Twilio WhatsApp sender number");

  return twilioClient.messages.create({
    from: fromNumber,
    to,
    body,
  });
}