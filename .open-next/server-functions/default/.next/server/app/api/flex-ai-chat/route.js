(()=>{var a={};a.id=7081,a.ids=[7081],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},18384:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>K,patchFetch:()=>J,routeModule:()=>F,serverHooks:()=>I,workAsyncStorage:()=>G,workUnitAsyncStorage:()=>H});var d={};c.r(d),c.d(d,{POST:()=>C});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641);async function v(a){let b=await fetch(process.env.NLP_API_URL,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.NLP_API_KEY}`},body:JSON.stringify({text:a})});if(!b.ok)throw Error("NLP API failed");return b.json()}function w(a,b){return b.some(b=>a.includes(b))}function x(a,b){return a/Math.pow(b/100,2)}function y(a){return a<18.5?"\uD83D\uDFE1 Underweight":a<25?"\uD83D\uDFE2 Normal Weight":a<30?"\uD83D\uDFE0 Overweight":"\uD83D\uDD34 Obese"}function z(a,b,c,d){return Math.round((10*a+6.25*b-5*c+5)*[1.2,1.375,1.55,1.725,1.9][Math.min(d-1,4)])}function A(){return"http://localhost:3000".replace(/\/$/,"")}function B(a){return[...a.matchAll(/\d+\.?\d*/g)].map(a=>parseFloat(a[0]))}async function C(a){try{let{message:b,state:c}=await a.json();if(!b)return u.NextResponse.json({reply:"Please send a message."});let d=b.toLowerCase().replace(/[?!.,;:'"]/g," ").replace(/\s+/g," ").replace(/gonna/g,"going to").replace(/wanna/g,"want to").replace(/\bu\b/g,"you").replace(/\bpls\b|\bplz\b/g,"please").replace(/\bmbi\b|\bbim\b|\bbim\b/g,"bmi").replace(/\bexcercise\b/g,"exercise").replace(/\bworkut\b|\bworkoit\b/g,"workout").trim(),e=c||{},f=await v(b).catch(()=>null),g="string"==typeof f?.intent?f.intent:null,h={};try{let a=await fetch("http://localhost:3000/api/settings",{cache:"no-store"});if(a.ok){let{settings:b}=await a.json();!function(a,b){if(Array.isArray(b))return b.forEach(b=>{b.key&&(a[b.key]=b.value)});Object.assign(a,b||{})}(h,b)}}catch{}if(e.step){let a=B(d)[0];if("height"===e.step){let c=a;if(!c||c<50||c>250){let a=b.match(/(\d)\s*[''`]\s*(\d{1,2})/);a&&(c=Math.round(30.48*parseInt(a[1])+2.54*parseInt(a[2])));let d=b.match(/(\d+)\s*(?:ft|feet|foot)/),e=b.match(/(\d+)\s*(?:in|inch)/);d&&(c=Math.round(30.48*parseInt(d[1])+(e?2.54*parseInt(e[1]):0)))}if(!c||c<100||c>250)return u.NextResponse.json({reply:"I didn't catch that. Please give your height in cm, e.g. **175**",state:e});let d={...e,height:c,step:"weight"};return u.NextResponse.json({reply:`Got it — **${c}cm**. Now your weight in kg? (e.g. 75)`,state:d})}if("weight"===e.step){if(!a||a<30||a>300)return u.NextResponse.json({reply:"Please give your weight in kg, e.g. **75**",state:e});let b=e.height,c=x(a,b),d=y(c);if("bmi"===e.intent)return u.NextResponse.json({reply:`📊 BMI: **${c.toFixed(1)}** — ${d}

Height: ${b}cm | Weight: ${a}kg

Want a full fitness plan with TDEE, protein targets, and a diet chart? Say **yes** or **full plan**.`,state:{...e,weight:a,step:"full_plan_offer"}});let f={...e,weight:a,step:"age"};return u.NextResponse.json({reply:`Weight **${a}kg**. BMI: ${c.toFixed(1)} — ${d}

How old are you?`,state:f})}if("age"===e.step){if(!a||a<10||a>100)return u.NextResponse.json({reply:"Please give your age in years, e.g. **25**",state:e});let b={...e,age:a,step:"activity"};return u.NextResponse.json({reply:`Age **${a}**. What's your activity level?

1️⃣ Sedentary (desk job, no gym)
2️⃣ Light (1-3 days/week)
3️⃣ Moderate (3-5 days/week)
4️⃣ Active (6-7 days/week)
5️⃣ Very Active (intense daily training)

Reply 1-5`,state:b})}if("activity"===e.step){if(!a||a<1||a>5)return u.NextResponse.json({reply:"Reply with a number 1-5 for your activity level.",state:e});let b={...e,activity:a,step:"goal"};return u.NextResponse.json({reply:`Activity level: ${a}/5. What's your goal?

1️⃣ Lose fat
2️⃣ Build muscle
3️⃣ Maintain / improve fitness

Reply 1, 2, or 3`,state:b})}if("goal"===e.step){let b={1:"cut",2:"bulk",3:"maintain",lose:"cut",fat:"cut",cut:"cut",build:"bulk",muscle:"bulk",gain:"bulk",maintain:"maintain",toned:"maintain",fit:"maintain"},c=d.split(" "),f=b[d.trim()]||c.map(a=>b[a]).find(Boolean)||(1===a?"cut":2===a?"bulk":3===a?"maintain":null);if(!f)return u.NextResponse.json({reply:"Please reply 1 (lose fat), 2 (build muscle), or 3 (maintain).",state:e});if("diet"===e.intent){let a={...e,goal:f,step:"religion"};return u.NextResponse.json({reply:`Goal: **${"cut"===f?"Lose fat":"bulk"===f?"Build muscle":"Maintain"}**. Any diet restrictions?

1️⃣ Halal only
2️⃣ Hindu (no beef)
3️⃣ Vegetarian
4️⃣ Vegan
5️⃣ None / No restriction

Reply 1-5`,state:a})}return D({...e,goal:f},h)}if("religion"===e.step){let b={1:"halal",2:"hindu",3:"vegetarian",4:"vegan",5:"none",halal:"halal",muslim:"halal",hindu:"hindu",veg:"vegetarian",vegetarian:"vegetarian",vegan:"vegan",none:"none"},c=d.split(" "),f=b[d.trim()]||c.map(a=>b[a]).find(Boolean)||(a>=1&&a<=5?b[String(Math.round(a))]:null);if(!f)return u.NextResponse.json({reply:"Please reply 1-5 for your diet type.",state:e});return E({...e,religion:f},h)}if("offer_diet"===e.step){if(w(d,["yes","sure","ok","okay","yep","yeah","diet","food","meal","eat"])){let a={...e,step:"religion",intent:"diet"};return u.NextResponse.json({reply:`Any diet restrictions?

1️⃣ Halal only
2️⃣ Hindu (no beef)
3️⃣ Vegetarian
4️⃣ Vegan
5️⃣ None / No restriction

Reply 1-5`,state:a})}return u.NextResponse.json({reply:"Got it! Ask me anything else — diet, products, orders. \uD83D\uDCAA",state:{height:e.height,weight:e.weight,age:e.age,activity:e.activity,goal:e.goal}})}if("full_plan_offer"===e.step){if(w(d,["diet","food","meal","eat","nutrition"])){let a={...e,step:"age",intent:"diet"};return u.NextResponse.json({reply:"Let's build your diet plan! How old are you?",state:a})}if(w(d,["workout","exercise","gym","training","plan","routine"])){let a={...e,step:"age",intent:"workout"};return u.NextResponse.json({reply:"Let's build your workout plan! How old are you?",state:a})}if(w(d,["yes","full","plan","sure","ok","okay","yep","yeah","both"])){let a={...e,step:"age",intent:"workout"};return u.NextResponse.json({reply:"Let's build your full plan! How old are you?",state:a})}return u.NextResponse.json({reply:"No problem! I have your height and weight saved. Ask me for a workout plan, diet, or anything else! \uD83D\uDCAA",state:{height:e.height,weight:e.weight}})}}let i=e.height&&e.weight&&e.age&&e.activity&&e.goal;if((d.includes("vegan")||d.includes("vegetarian")||d.includes("halal")||d.includes("hindu")||d.includes("no beef")||d.includes("i am muslim")||d.includes("i am vegan")||d.includes("change my diet")||d.includes("update diet")||d.includes("change diet"))&&i){let a=e.religion||"none";d.includes("vegan")&&!d.includes("not vegan")||d.includes("vegan")?a="vegan":d.includes("vegetarian")&&!d.includes("not")?a="vegetarian":d.includes("halal")||d.includes("muslim")?a="halal":(d.includes("hindu")||d.includes("no beef"))&&(a="hindu");let b={...e,religion:a};return E(b,h)}if(w(d,["diet","meal plan","diet chart","food plan","eating plan","nutrition plan","what to eat"])&&i){let a={...e,intent:"diet",step:"religion"};return u.NextResponse.json({reply:`I already have your profile! Any diet restrictions?

1️⃣ Halal only
2️⃣ Hindu (no beef)
3️⃣ Vegetarian
4️⃣ Vegan
5️⃣ None / No restriction

Reply 1-5`,state:a})}if(w(d,["workout","gym","exercise","training","routine","plan","lift","muscle"])&&i)return D(e,h);if(w(d,["bmi","body mass","mbi","bim","my bmi"])&&e.height&&e.weight){let a=x(e.weight,e.height);return u.NextResponse.json({reply:`📊 Your BMI: **${a.toFixed(1)}** — ${y(a)}

Height: ${e.height}cm | Weight: ${e.weight}kg

Want a workout or diet plan based on this?`,state:e})}if(w(d,["yes","sure","ok","okay","yep","yeah","full plan","full","plan"])&&e.height&&e.weight&&!e.age)return u.NextResponse.json({reply:"Let's build your full plan! How old are you?",state:{...e,step:"age",intent:"workout"}});let j=b.replace(/\D/g,"");if(j.length>=10&&!w(d,["height","weight","cm","kg","year"])){let a=j.startsWith("0")?j:"0"+j.slice(-10),b="88"+a.replace(/^0/,""),c=await fetch(`${A()}/api/orders`,{cache:"no-store"}),{orders:d=[]}=c.ok?await c.json():{},e=d.filter(c=>[j,a,b].includes(c.phone)).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,5);if(e&&e.length>0){let a="\uD83D\uDCE6 **Your recent orders:**\n\n"+e.map((a,b)=>{let c={delivered:"✅",shipped:"\uD83D\uDE9A",processing:"⚙️",confirmed:"✓",cancelled:"❌"}[a.status]||"⏳",d=`**ORDER ${b+1}**
👕 ${a.product_name}
🔘 Status: ${c} ${(a.status||"pending").toUpperCase()}
📦 Qty: ${a.quantity} | Size: ${a.size} | Color: ${a.color}`;return a.tracking_url&&(d+=`
🔗 ${a.tracking_url}`),d}).join("\n\n─────────────────\n\n")+"\n\n❓ Need help? WhatsApp: +8801935962421";return u.NextResponse.json({reply:a,state:{}})}if(j.length>=10)return u.NextResponse.json({reply:"❌ No orders found for that number.\n\nDouble-check the number you used when ordering, or WhatsApp us: +8801935962421",state:{}})}if("find_order"===g||w(d,["my order","track","find my order","check my order","where is my","parcel","shipment","order status"])||w(d,["order","package"])&&w(d,["track","find","check","where","status","tell"]))return u.NextResponse.json({reply:"Sure! Send me the **phone number** you used when placing your order and I'll look it up right away. \uD83D\uDCE6",state:{step:"order_phone"}});if("bmi_calc"===g||w(d,["bmi","body mass","body fat","how fat","am i fat","am i overweight","check my weight","check my bmi","mbi","bim","my bmi"])){let a=B(d),b=d.match(/(\d{2,3})\s*cm/),c=d.match(/(\d{2,3})\s*kg/);if(b&&c){let a=parseInt(b[1]),d=parseInt(c[1]);if(a>100&&d>30){let b=x(d,a);return u.NextResponse.json({reply:`📊 BMI: **${b.toFixed(1)}** — ${y(b)}

Height: ${a}cm | Weight: ${d}kg

Want a full plan with TDEE, protein targets, and diet? Say **yes**.`,state:{height:a,weight:d,step:"full_plan_offer",intent:"workout"}})}}if(a.length>=2){let b=a.filter(a=>a>100&&a<250),c=a.filter(a=>a>30&&a<250&&a!==b[0]);if(b.length&&c.length){let a=b[0],d=c[0],e=x(d,a);return u.NextResponse.json({reply:`📊 BMI: **${e.toFixed(1)}** — ${y(e)}

Height: ${a}cm | Weight: ${d}kg

Want a full plan? Say **yes**.`,state:{height:a,weight:d,step:"full_plan_offer",intent:"workout"}})}}return u.NextResponse.json({reply:"Let's calculate your BMI! \uD83D\uDCCA\n\nWhat's your **height in cm**? (e.g. 175)",state:{step:"height",intent:"bmi"}})}let k=B(d);if(void 0===e.step&&k.length>=1){if(1===k.length&&k[0]>=140&&k[0]<=220)return u.NextResponse.json({reply:`Taking **${k[0]}cm** as your height. What's your weight in kg?`,state:{step:"weight",height:k[0],intent:"bmi"}});if(k.length>=2){let a=k.find(a=>a>=140&&a<=220),b=k.find(b=>b>=30&&b<=200&&b!==a);if(a&&b){let c=x(b,a);return u.NextResponse.json({reply:`📊 BMI: **${c.toFixed(1)}** — ${y(c)}

Height: ${a}cm | Weight: ${b}kg

Want a full fitness plan? Say **yes**.`,state:{height:a,weight:b,step:"full_plan_offer",intent:"workout"}})}}}if("workout_plan"===g||w(d,["workout","gym","exercise","training","routine","plan","lift","muscle","build muscle","gain muscle","get fit","build my"]))return u.NextResponse.json({reply:"Let's build your workout plan! \uD83D\uDCAA\n\nFirst — what's your **height in cm**? (e.g. 175)",state:{step:"height",intent:"workout"}});if("diet_chart"===g||w(d,["diet","meal plan","diet plan","diet chart","food plan","eating plan","nutrition plan","what to eat","meal chart"]))return u.NextResponse.json({reply:"Let's build your diet plan! \uD83E\uDD57\n\nFirst — what's your **height in cm**? (e.g. 175)",state:{step:"height",intent:"diet"}});if("delivery_info"===g||w(d,["delivery","charge","shipping","how long","arrive","days","free delivery"])){if("true"===h.free_delivery)return u.NextResponse.json({reply:"\uD83D\uDE9A **FREE DELIVERY** nationwide!\n\nWe deliver across all Bangladesh for FREE.\n✓ Cash on Delivery — pay when it arrives\n✓ Zero advance payment\n\n\uD83C\uDFD9️ Khulna City: 1-2 days\n\uD83D\uDDFA️ Near Khulna: 2-3 days\n\uD83C\uDDE7\uD83C\uDDE9 All Bangladesh: 3-5 days",state:{}});return u.NextResponse.json({reply:"Check our delivery page: /delivery\n\nWe ship from Khulna. Cash on Delivery — pay when it arrives. \uD83D\uDE9A",state:{}})}if("product_browse"===g||w(d,["product","show","browse","what do you sell","collection","shop","see products","show products","view products"])){let a=await fetch(`${A()}/api/products?in_stock=true&limit=5`,{cache:"no-store"}),{products:b=[]}=a.ok?await a.json():{};if(b&&b.length>0){let a=b.map(a=>`👕 **${a.name}** — BDT ${a.price}
   → /products/${a.slug}`).join("\n\n");return u.NextResponse.json({reply:"Here's our collection:\n\n"+a+"\n\nAll sweat-wicking, 4-way stretch compression fit. \uD83D\uDD25",state:{}})}return u.NextResponse.json({reply:"Check our full collection at /products \uD83D\uDC55\n\nAll Flextreme gear: compression fit, sweat-wicking, built for athletes.",state:{}})}if("size_help"===g||w(d,["size","which size","what size","fit me","size guide","chest measurement"])){let a=d.match(/(\d{2,3})/);if(a){let b=parseInt(a[1]),c=d.includes("inch")||d.includes('"')?Math.round(2.54*b):b;return u.NextResponse.json({reply:`Based on **${c}cm** measurement: recommended size is **${c<=33?"M":c<=35?"L":"XL"}**.

💡 Our tops are compression fit — go 1 size down for skin-tight feel.

Full size guide: /size-guide`,state:{}})}return u.NextResponse.json({reply:"\uD83D\uDCCF **SIZE GUIDE — Compression Top**\n\nM: Length 63cm | Width 33cm\nL: Length 65cm | Width 35cm\nXL: Length 68cm | Width 38cm\n\n\uD83D\uDCA1 Compression fit stretches 20-30%. If between sizes, go smaller for skin-tight feel.\n\nTell me your chest/width in cm and I'll pick your size!",state:{}})}if("supplement"===g||w(d,["supplement","protein","creatine","whey","bcaa","pre workout","pre-workout","vitamin","mass gainer"]))return u.NextResponse.json({reply:"\uD83D\uDC8A **SUPPLEMENT GUIDE**\n\n✅ Worth it:\n• Whey Protein — 25-30g post-workout\n• Creatine Monohydrate — 5g daily (most proven)\n• Multivitamin — with breakfast\n• Fish Oil Omega-3 — 2-3g daily\n\n❌ Skip these:\n• Fat burners — mostly caffeine + hype\n• Test boosters — rarely work\n• BCAA — pointless if you take protein\n\n\uD83D\uDCA1 Truth: Sleep + food beats every supplement.",state:{}});let l=["knee","back","shoulder","wrist","ankle","elbow","hip","neck","hamstring","quad","calf"],m=["pain","injury","hurt","sore","ache","sprain","strain","injured","pulled","torn","swollen"],n=l.some(a=>d.includes(a))&&m.some(a=>d.includes(a))||w(d,["i have","i got","i feel"])&&m.some(a=>d.includes(a));if("injury_help"===g||n){let a=l.find(a=>d.includes(a))||"injured area";return u.NextResponse.json({reply:{knee:"\uD83E\uDDB5 **Knee injury** — avoid squats, lunges, leg press for now.\n\n✓ Train upper body\n✓ Swimming or cycling (low impact)\n✓ Hip thrusts (pain-free range)\n\nIce 15 min after training. See a physio if sharp pain.",back:"\uD83D\uDD19 **Back injury** — no deadlifts, heavy squats, or rowing.\n\n✓ Upper body (seated)\n✓ Light walking\n✓ Core bracing, not crunches\n\nNever push through back pain. See a physio.",shoulder:"\uD83D\uDCAA **Shoulder injury** — avoid overhead press, bench press.\n\n✓ Train legs, core, cardio\n✓ Resistance band rotations\n\nRest, ice, physio. Shoulder injuries worsen when ignored.",wrist:"\uD83E\uDD1D **Wrist injury** — avoid barbell pressing, push-ups.\n\n✓ Train legs (squats, leg press)\n✓ Cardio (bike, treadmill)\n\nWrist wraps help for support.",ankle:"\uD83E\uDDB6 **Ankle injury** — rest from running/jumping.\n\n✓ Upper body and seated exercises\n✓ Swimming (if no pain)\n\nElevate, ice, compress. See a physio if it doesn't improve in 3 days.",hamstring:"\uD83E\uDDB5 **Hamstring strain** — avoid deadlifts, leg curls, sprinting.\n\n✓ Upper body, core\n✓ Light walking when pain-free\n\nGradual return. Hamstrings re-strain easily if rushed."}[a]||`⚠️ **${a} injury** — rest it, ice it, and see a physio if it doesn't improve. Train around it with unaffected muscle groups.`,state:{}})}if(w(d,["recovery","rest day","sleep","sore","doms","overtraining","rest"]))return u.NextResponse.json({reply:"\uD83D\uDE34 **RECOVERY GUIDE**\n\nMuscles grow during recovery, not training.\n\n→ 7-9 hours sleep every night (non-negotiable)\n→ Beginners: 2-3 rest days/week\n→ Intermediate: 1-2 rest days\n→ Advanced: minimum 1 full rest day\n\nActive recovery: 20-30 min walk, light stretching, foam rolling.\n\n\uD83D\uDCA1 Sleep is your most powerful supplement.",state:{}});if(w(d,["gear","clothing","wear","outfit","what to wear","gym outfit","attire","dress","cloth"]))return u.NextResponse.json({reply:"\uD83D\uDC55 **GYM GEAR GUIDE**\n\n**Lifting:**\n→ Compression top + shorts\n→ Flat-soled shoes\n\n**Cardio/HIIT:**\n→ Lightweight tee, cushioned shoes\n\n**Always choose:**\n→ Sweat-wicking fabric (never cotton)\n→ 4-way stretch\n→ Compression fit\n\nFlextreme checks every box \uD83D\uDD25 → /products",state:{}});if(w(d,["motivat","inspire","lazy","no energy","tired","give up","can't do it","hard","difficult","demotivated"]))return u.NextResponse.json({reply:"\uD83D\uDD25 **Discipline over motivation.**\n\nMotivation is a feeling — it comes and goes.\nDiscipline is a decision — it stays.\n\nYou don't wait to feel ready. You show up anyway.\nEvery rep. Every set. Every day.\n\nThat's the difference between average and elite.\n\n**Work Hard. Flex Extreme.** \uD83D\uDCAA",state:{}});if("flextreme"===d||w(d,["about flextreme","who are you","what is flextreme","tell me about","brand story","flextreme brand"]))return u.NextResponse.json({reply:(h.about_story||"Flextreme is a premium gym wear brand from Bangladesh, built by athletes for athletes.")+"\n\nWork Hard. Flex Extreme. \uD83D\uDD25\n\n→ /products",state:{}});if(w(d,["contact","whatsapp","call","email","reach","support","talk to someone","human"]))return u.NextResponse.json({reply:"\uD83D\uDCDE **Contact Flextreme**\n\nWhatsApp: +8801935962421\nEmail: flextremefit@gmail.com\n\nAvailable 9am–9pm daily.\n\nTap the green WhatsApp button on any page for instant reply.",state:{}});if("greeting"===g||w(d,["hi","hello","hey","how are you","howdy","good morning","good evening","sup","what's up","wassup","hiya"]))return u.NextResponse.json({reply:"Hey! \uD83D\uDC4B I'm Flex — your AI fitness & shopping assistant.\n\nI can help with:\n\uD83D\uDE9A Order tracking\n\uD83D\uDCAA Workout plans\n\uD83E\uDD57 Diet charts\n\uD83D\uDCCA BMI calculator\n\uD83D\uDCCF Size guide\n\uD83D\uDC8A Supplements\n\uD83D\uDC55 Products\n\nWhat do you need?",state:{}});return u.NextResponse.json({reply:"I can help with:\n\n\uD83D\uDE9A **Track your order** — share your phone number\n\uD83D\uDCAA **Workout plan** — personalized for your goals\n\uD83E\uDD57 **Diet chart** — based on your profile\n\uD83D\uDCCA **BMI** — just tell me your height and weight\n\uD83D\uDCCF **Size guide**\n\uD83D\uDC8A **Supplements**\n\uD83D\uDC55 **Products**\n\nWhat do you need?",state:{}})}catch(a){return console.error(a),u.NextResponse.json({reply:"Something went wrong. Try again or WhatsApp: +8801935962421"})}}function D(a,b){let{height:c,weight:d,age:e,activity:f=3,goal:g}=a;if(!c||!d||!e)return u.NextResponse.json({reply:"Missing some info. Say 'workout plan' to start again.",state:{}});let h=z(d,c,e,f),i="cut"===g?h-400:"bulk"===g?h+300:h,j=Math.round(d*("bulk"===g?2.2:1.8)),k={cut:`🔥 **FAT LOSS WORKOUT PLAN**

Target: ${i} kcal/day | Protein: ${j}g

**Mon/Thu — Upper (Push)**
• Bench Press 4\xd78
• Shoulder Press 3\xd710
• Tricep Pushdown 3\xd712

**Tue/Fri — Upper (Pull)**
• Rows 4\xd78
• Pull-ups 3\xd7max
• Bicep Curl 3\xd712

**Wed/Sat — Lower + Cardio**
• Squats 4\xd78
• Leg Press 3\xd712
• 20 min HIIT

**Sun — Rest or walk**

💡 Cardio after weights for max fat burn.`,bulk:`💪 **MUSCLE BUILDING PLAN**

Target: ${i} kcal/day | Protein: ${j}g

**Mon — Chest + Triceps**
• Bench Press 4\xd76-8
• Incline DB Press 3\xd710
• Tricep Dips 3\xd712

**Tue — Back + Biceps**
• Deadlift 4\xd75
• Barbell Rows 3\xd78
• Bicep Curl 4\xd710

**Wed — Legs**
• Squats 5\xd75
• Leg Press 4\xd710
• Romanian Deadlift 3\xd710

**Thu — Shoulders**
• OHP 4\xd78
• Lateral Raises 4\xd712
• Face Pulls 3\xd715

**Fri — Arms + Core**
• 21s Curls, Skull Crushers, Planks

**Sat/Sun — Rest**`,maintain:`⚡ **MAINTENANCE PLAN**

Target: ${i} kcal/day | Protein: ${j}g

**3-4 days/week full body:**
• Squat 3\xd710
• Bench Press 3\xd710
• Rows 3\xd710
• OHP 3\xd710
• 15 min cardio

💡 Progressive overload: add weight or reps each week.`};return u.NextResponse.json({reply:(k[g]||k.maintain)+"\n\nWant a **diet chart** to match this plan? Reply **yes** or **diet**.",state:{...a,step:"offer_diet"}})}function E(a,b){let{height:c,weight:d,age:e,activity:f=3,goal:g,religion:h="none"}=a;if(!c||!d||!e)return u.NextResponse.json({reply:"Missing some info. Say 'diet plan' to start again.",state:{}});let i=z(d,c,e,f),j="cut"===g?i-400:"bulk"===g?i+300:i,k=Math.round(d*("bulk"===g?2.2:1.8)),l=Math.round(.45*j/4),m=Math.round(.25*j/9),n="vegetarian"===h,o="vegan"===h,p=o?"tofu, lentils, chickpeas, soy milk":n?"eggs, paneer, Greek yogurt, lentils":"halal"===h?"halal chicken, halal beef, fish, eggs":"hindu"===h?"chicken, fish, eggs, paneer (no beef)":"chicken, beef, fish, eggs",q=`🥗 **PERSONALIZED DIET PLAN**

Target: **${j} kcal** | Protein: **${k}g** | Carbs: **${l}g** | Fat: **${m}g**

**🌅 Breakfast**
• Oats + ${o?"plant milk":"milk"} + banana
• ${n||o?"Peanut butter toast":"3 eggs (any style)"}
• Green tea or black coffee

**🍎 Snack (10am)**
• ${o?"Mixed nuts + fruit":"Greek yogurt + nuts"}

**🍽️ Lunch**
• Brown rice or 2 rotis
• ${o?"Lentil curry + vegetables":`${p.split(",")[0].trim()} curry`}
• Mixed salad

**💪 Pre-workout**
• Banana + dates

**🥤 Post-workout**
• ${o?"Soy protein shake":"Whey protein shake"} or ${o?"tofu + rice":"chicken + rice"}

**🌙 Dinner**
• 2 rotis or rice
• ${p.split(",")[0].trim()} + vegetables

**Protein sources:** ${p}
💧 Water: 3-4L daily. Eat every 3-4 hours.`;return u.NextResponse.json({reply:q,state:{}})}let F=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/flex-ai-chat/route",pathname:"/api/flex-ai-chat",filename:"route",bundlePath:"app/api/flex-ai-chat/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\SK\\Desktop\\flextreme\\src\\app\\api\\flex-ai-chat\\route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:G,workUnitAsyncStorage:H,serverHooks:I}=F;function J(){return(0,g.patchFetch)({workAsyncStorage:G,workUnitAsyncStorage:H})}async function K(a,b,c){var d;let e="/api/flex-ai-chat/route";"/index"===e&&(e="/");let g=await F.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,D=(0,j.normalizeAppPath)(e),E=!!(y.dynamicRoutes[D]||y.routes[C]);if(E&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!E||F.isDev||x||(G="/index"===(G=C)?"/":G);let H=!0===F.isDev||!E,I=E&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>F.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>F.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!E)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await F.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await F.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!E)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&E||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await F.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),E)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[5873,1692],()=>b(b.s=18384));module.exports=c})();