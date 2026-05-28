import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

async function test() {
  const res = await deepseek.chat.completions.create({
    model: "deepseek-v4-flash",
    messages: [
      {
        role: "user",
        content: "Say hello",
      },
    ],
  });

  console.log(res.choices[0].message.content);
}

test();