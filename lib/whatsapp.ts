export async function sendWhatsAppMessage(to: string, message: string) {
  const apiKey = process.env.STARSENDER_API_KEY;

  if (!apiKey) {
    console.error("STARSENDER_API_KEY is not set in environment variables.");
    return { success: false, message: "API Key tidak terbaca." };
  }

  let formattedTo = to.replace(/[^0-9]/g, '');
  if (formattedTo.startsWith('0')) {
    formattedTo = '62' + formattedTo.slice(1);
  } else if (!formattedTo.startsWith('62')) {
    formattedTo = '62' + formattedTo;
  }

  try {
    const response = await fetch("https://api.starsender.online/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": apiKey
      },
      body: JSON.stringify({
        messageType: "text",
        to: formattedTo,
        body: message
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    throw error;
  }
}
