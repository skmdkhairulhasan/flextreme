export async function classifyText(input: string) {
  const res = await fetch(process.env.NLP_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NLP_API_KEY}`,
    },
    body: JSON.stringify({ text: input }),
  })

  if (!res.ok) {
    throw new Error("NLP API failed")
  }

  return res.json()
}
