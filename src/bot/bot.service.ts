import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

import { telegramToken, openaiKey, context } from "../constants";

export class Bot {
    bot: TelegramBot;
    private chatContext: { role: string; content: string }[] = [];

    constructor() {
        this.bot = new TelegramBot(telegramToken, { polling: true });
    }

    private async callChatGPT(prompt: string) {
        const url = "https://api.openai.com/v1/chat/completions";

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
        };

        const data = {
            model: "gpt-3.5-turbo-16k",
            messages: this.chatContext,
        };

        if (this.chatContext.length === 0) {
            this.chatContext.push({ role: "system", content: `${context}` });
        }
        this.chatContext.push({ role: "user", content: prompt });

        if (this.chatContext.length > 20) {
            this.chatContext = this.chatContext.slice(-20);
        }

        try {
            const response = await axios.post(url, data, { headers });
            const result = response.data.choices[0].message.content;

            this.chatContext.push({ role: "assistant", content: result });

            return result;
        } catch (error: any) {
            console.error(
                "Error calling ChatGPT API:",
                error.response ? error.response.data : error.message,
            );
            throw error;
        }
    }

    private async sendMessage(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const prompt = msg.text;

        if (!prompt || prompt.trim() === "") {
            this.bot.sendMessage(chatId, "Пожалуйста, введите запрос.");
            return;
        }

        try {
            const res = await this.callChatGPT(prompt);
            this.bot.sendMessage(chatId, res);
        } catch (err) {
            console.error("Ошибка при обработке сообщения:", err);
            this.bot.sendMessage(
                chatId,
                "Произошла ошибка. Пожалуйста, попробуйте позже.",
            );
        }
    }

    async useBot() {
        this.bot.onText(/(.+)/, async (msg: TelegramBot.Message) =>
            this.sendMessage(msg),
        );
    }
}
