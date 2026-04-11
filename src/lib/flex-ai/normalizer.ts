export function normalizeMessage(raw: string) {

let msg = raw.toLowerCase()

msg = msg
.replace(/[?!.,;:'"]/g, " ")
.replace(/\s+/g, " ")

.replace(/\bu\b/g, "you")
.replace(/\br\b/g, "are")

.replace(/wrkout|workut/g, "workout")
.replace(/protien/g, "protein")

.replace(/wieght/g, "weight")
.replace(/heigth/g, "height")

return msg.trim()

}