export const sendTelegramNotification = async (message: string) => {
  const botToken = "8903876036:AAEDESUha3MUDfkJKUSJQ5OQDqlNqREn39s";
  const chatId = "8963692756"; 

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      console.error("Telegram API hatası:", response.statusText);
    }
  } catch (error) {
    console.error("Telegram bildirimi gönderilemedi:", error);
  }
};
