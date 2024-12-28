import { Bot } from "./bot/bot.service";

export class App {
    bot: Bot;

    constructor() {
        this.bot = new Bot();
    }

    async init() {
        this.bot.useBot();
        console.log("Бот готов принимать сообщения.");
    }
}
