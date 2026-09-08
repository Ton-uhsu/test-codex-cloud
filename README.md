# เริ่มเวท — Beginner Strength Guide

เว็บภาษาไทยสำหรับผู้เริ่มต้นเวทที่บ้านด้วย **ดัมเบลและน้ำหนักตัว**: ตั้งเป้าหมาย คำนวณพลังงานและสารอาหาร ดูตัวอย่างอาหาร และฝึกทีละเซ็ตพร้อมคลิป โดยไม่ต้องสมัครสมาชิก ไม่ต้องมีแมชชีน ม้านั่ง หรือบาร์เบล

## ทำอะไรได้

- หน้าแรกเป็นแบบฟอร์มเป้าหมาย น้ำหนัก ส่วนสูง อายุ ตัวแปรเพศ ระดับกิจกรรม และวันฝึกแรก
- แผนสรุปพลังงาน โปรตีน คาร์บ และไขมันต่อวัน พร้อมสูตร แหล่งอ้างอิง และขอบเขตที่ไม่คำนวณอัตโนมัติ
- ตัวอย่างอาหาร 3 มื้อ + ของว่าง ปรับปริมาณตามเป้า แสดงกรัมอาหารสุกและยอดสารอาหารจากวัตถุดิบจริงในตัวอย่าง
- ตารางฝึกทั้งตัว 2 วันต่อสัปดาห์ เลือกวัน A ได้ และวัน B ห่างไป 3 วัน วันละ 5 ท่า วันอื่นพักเวท (ยังไม่ตั้งข้อมูลใช้จันทร์ A / พฤหัสบดี B)
- เลือกดูทั้ง 7 วัน โดยค่าเริ่มต้นอิงวันตามเวลาของอุปกรณ์ ไม่ใช่ UTC
- คลัง 10 ท่า กรองตามอก หลัง ไหล่ และขา/สะโพก
- ทุกท่ามีภาพตัวอย่างและคลิป YouTube ที่กดเล่นในหน้าได้ พร้อมชื่อไทย–อังกฤษ วิธีทำ ข้อควรระวัง เซ็ต ครั้ง ช่วงพัก และลิงก์ต้นฉบับ
- โหมดฝึกทีละท่า: วอร์มอัป → ดูคลิป → ทำเซ็ต → จับเวลาพัก → ไปต่อ มีปุ่มข้าม พักรอบไว้ และสรุปเซ็ตที่ทำจริง
- เวลาพักใช้เวลาจริง หมดเวลาแล้วต้องกดไปต่อเอง เพิ่มเวลาพักได้ การเปลี่ยนหน้าไม่หยุดเวลาพัก และตัวเล่นไม่ถูกสร้างใหม่ทุกครั้งที่นาฬิกาเปลี่ยน
- ตัวเลือกจำข้อมูลแบบฟอร์มเฉพาะเบราว์เซอร์นี้ (เริ่มต้นไม่เลือก) พร้อมแก้ไขและล้างข้อมูล ไม่เก็บผลคำนวณที่อาจล้าสมัย
- หน้าหลักการสำหรับมือใหม่และแหล่งข้อมูล พร้อมวันที่ตรวจแหล่งข้อมูล
- รองรับหน้าจอแคบ คีย์บอร์ด ลิงก์ข้ามไปเนื้อหา และแจ้งผลการเปลี่ยนวัน/ตัวกรองสำหรับโปรแกรมอ่านหน้าจอ
- มีสถานะโหลด ข้อความเมื่อโหลดไม่สำเร็จ ปุ่มลองใหม่ และข้อมูลสำรองกรณีปิด JavaScript

ตัวแอปไม่มี login, backend, database, analytics หรือประวัติออกกำลังกายถาวร ความคืบหน้าเซ็ตอยู่ในหน่วยความจำจนกว่าจะรีเฟรช การเลือกวันเป็นการดูแผน ข้อมูลร่างกายไม่ส่งออกไปเซิร์ฟเวอร์ หากเลือกให้จำจะบันทึกใน `localStorage` ภายใต้ `beginner-strength.profile.v1` ของเว็บไซต์นี้ อ่านกลับโดยตรวจชนิดและช่วงข้อมูลก่อนใช้ และแจ้งเมื่อบันทึกหรือล้างไม่สำเร็จ ปุ่มล้างไม่แตะข้อมูลแอปอื่น

ภาพตัวอย่างโหลดจาก YouTube และเมื่อกดเล่นจะโหลด iframe ผ่าน `youtube-nocookie.com` ซึ่งไม่ใช่คำรับรองว่าไม่มีการส่งข้อมูล ผู้ให้บริการโฮสต์และวิดีโออาจประมวลผลข้อมูลตามนโยบายของตนเอง

## การคำนวณอาหาร

ตรวจแหล่งข้อมูล **2026-09-08** ไม่ใช่การรับรองทางคลินิก:

- [Mifflin–St Jeor (1990)](https://pubmed.ncbi.nlm.nih.gov/2305711/): พลังงานขณะพัก = 10 × กก. + 6.25 × ซม. − 5 × อายุ + 5 สำหรับตัวแปรชาย หรือ −161 สำหรับตัวแปรหญิง
- [ACE](https://www.acefitness.org/certifiednewsarticle/2882/resting-metabolic-rate-best-ways-to-measure-it-and-raise-it-too/): คูณระดับกิจกรรม 1.2 / 1.375 / 1.55 / 1.725 เพื่อประมาณพลังงานคงน้ำหนัก ไม่บวกพลังงานเวทซ้ำ
- เป้าลดไขมันใช้ 90% คงน้ำหนักใช้ 100% เพิ่มกล้ามใช้ 110% ของพลังงานคงน้ำหนัก แล้วปัดใกล้ 10 kcal **±10% เป็นทางเลือกเริ่มต้นของโปรเจกต์** ไม่ใช่สูตรเฉพาะบุคคลหรือข้อกำหนดจากแหล่งอ้างอิง
- [ISSN (2017)](https://pubmed.ncbi.nlm.nih.gov/28642676/): เลือกโปรตีน 1.6 กรัม/กก./วันในช่วง 1.4–2.0 สำหรับผู้ใหญ่สุขภาพดีที่ออกกำลังกาย ไขมันเลือก 30% ของพลังงานโดยโปรเจกต์ คาร์บใช้พลังงานที่เหลือ คิดโปรตีน/คาร์บ 4 kcal/กรัม ไขมัน 9 kcal/กรัม และปัดกรัมใกล้จำนวนเต็ม
- [NIDDK](https://www.niddk.nih.gov/bwp) ระบุขอบเขตเครื่องคำนวณสำหรับผู้ใหญ่ ไม่รวมผู้ตั้งครรภ์/ให้นม เว็บนี้รับอายุ 18–80 ปีและมีตัวเลือกเงื่อนไขที่ควรปรึกษาผู้เชี่ยวชาญ
- ไม่แสดงเป้าตัวเลขเมื่อมีเงื่อนไขสุขภาพดังกล่าว, BMI ต่ำกว่า 18.5 ([NHLBI](https://www.nhlbi.nih.gov/health/heart-healthy-living/healthy-weight)), ผลพลังงานนอก 1,500–4,000 kcal, คาร์บต่ำกว่า 130 กรัม หรือโปรตีนเกิน 35% พลังงาน ขอบเขตตัวเลขเป็นข้อจำกัดของเครื่องมือ ไม่ใช่คำรับรองความปลอดภัย ไม่ clamp ผลเงียบ ๆ และไม่มีการทำนายวันถึงน้ำหนักเป้าหมาย

ตัวอย่างอาหารใช้ข้อมูลสาธารณะ [USDA Home and Garden Bulletin 72 (2002), Table 9](https://www.ars.usda.gov/ARSUserFiles/80400525/Data/hg72/hg72_2002.pdf) เก็บค่าตามปริมาณที่ต้นฉบับระบุ แล้วคำนวณตามกรัมที่แสดง:

| อาหาร | Food no. | ส่วนอ้างอิง (ก.) | kcal | โปรตีน (ก.) | คาร์บ (ก.) | ไขมัน (ก.) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| ข้าวกล้องสุก | 634 | 195 | 216 | 5 | 45 | 2 |
| อกไก่อบสุก เฉพาะเนื้อ | 876 | 86 | 142 | 27 | 0 | 3 |
| ไข่ต้ม ปอกเปลือก | 146 | 50 | 78 | 6 | 1 | 5 |
| นมวัวรสจืด ไขมัน 2% | 119 | 244 | 121 | 8 | 12 | 5 |
| กล้วยกลาง เฉพาะเนื้อ | 280 | 118 | 109 | 1 | 28 | 1 |
| บรอกโคลีต้ม สะเด็ดน้ำ | 1067 | 156 | 44 | 5 | 8 | 1 |
| น้ำมันมะกอก | 176 | 14 | 119 | 0 | 0 | 14 |

ตัวอย่างปรับข้าวเพื่อใกล้เป้าคาร์บ ปรับไก่โดยนับโปรตีนจากอาหารอื่นด้วย และปรับน้ำมันโดยนับไขมันเดิม ปัดข้าว/ไก่ทีละ 10 กรัม น้ำมันทีละ 5 กรัม ใช้ไข่/นมน้อยลงเมื่อเป้าโปรตีนต่ำ ตัวเลขรวมแสดงจากปริมาณอาหารที่เสนอจริงและอาจต่างจากเป้าได้ ค่าเฉลี่ยต้นฉบับมีการปัดเศษ จึงไม่อ้างความแม่นยำระดับกรัมหรือให้แคลอรี่ตรง 4/4/9 ทุกจาน

นี่เป็นตัวอย่างให้เห็นปริมาณหนึ่งวัน ไม่ใช่อาหารที่ต้องกินซ้ำหรือแผนสารอาหารครบถ้วนเฉพาะบุคคล ต้องสลับอาหารหลากหลายและดูฉลากเมื่อเปลี่ยนวัตถุดิบ มีไข่และนมวัว ไม่ประเมินการแพ้อาหารเฉพาะบุคคล

## อุปกรณ์และตารางฝึก

ใช้ดัมเบล 1 คู่ (บางท่าใช้ 1 ลูก) ผนังที่มั่นคง และพื้นไม่ลื่น เสื่อปูพื้นเป็นตัวเลือก ดัมเบลของผู้ใช้ไม่จำเป็นต้องหนักเท่าคนในคลิป หากหนักเกินไปให้ฝึกมือเปล่าหรือใช้น้ำหนักเบาลง

- A: Bodyweight Squat, Dumbbell Floor Press, Dumbbell Bent Over Row, Glute Bridge, Lateral Raise
- B: Goblet Squat, Wall Push-up, Dumbbell Bent Over Row, Glute Bridge, Standing Dumbbell Shoulder Press
- Reverse Fly และ Dumbbell Romanian Deadlift อยู่ในคลังเพื่อเรียนรู้เพิ่ม ไม่อยู่ในตารางเริ่มต้น โดย NASM จัด RDL ระดับกลาง จึงมีคำเตือนให้ฝึกพับสะโพกและตรวจท่าก่อนเพิ่มน้ำหนัก

ท่า Floor Press ทำบนพื้น ไม่ใช่ Bench Press และท่า Row ใช้ดัมเบลสองข้างโดยไม่พิงม้านั่ง

## วิดีโอสาธิต

มีคลิปเฉพาะท่าครบ 10 ท่า ไม่ใช่ลิงก์ค้นหา YouTube คลิปเป็นภาษาอังกฤษ มีคำแนะนำไทยอยู่ใต้คลิปทุกท่า ข้อมูล `video` เก็บ YouTube ID, ชื่อคลิป, ที่มา, ลิงก์อ้างอิง, ภาษา และวันที่ตรวจแหล่งข้อมูล

คลิปมาจาก PureGym, Nuffield Health, ScottHermanFitness, Wellen, Buff Dudes และคลิปที่ NASM อ้างอิง ให้เครดิตและลิงก์ต้นฉบับ ไม่ดาวน์โหลดวิดีโอหรือภาพมาตีพิมพ์ซ้ำ วิดีโอสอนท่า ไม่ได้เป็นที่มาของเซ็ต–ครั้งที่เว็บกำหนด และไม่ได้หมายถึงเจ้าของคลิปรับรองโปรแกรมนี้

ตัวเล่นโหลดเมื่อกดเท่านั้น เปิดได้ครั้งละหนึ่งคลิป รองรับ fullscreen และคงปุ่ม **เปิดใน YouTube** ไว้ตลอด หากคลิปถูกลบ ปิดการฝัง จำกัดอายุ/ประเทศ หรือเล่นไม่ได้ เบราว์เซอร์อาจบล็อก autoplay จนต้องกดเล่นในตัวเล่นอีกครั้ง เมื่อภาพโหลดไม่สำเร็จยังมีปุ่มเล่นและลิงก์ต้นฉบับ

การฝังวิดีโอเป็นบริการภายนอก: การตรวจลิงก์/ข้อมูลอ้างอิงไม่ใช่การรับประกันการเล่นจริงบนทุกอุปกรณ์ ยังไม่ได้ทดสอบ playback ในเบราว์เซอร์จริง

## Tech stack และรันในเครื่อง

HTML + CSS + JavaScript (native ES modules) + JSON ไม่มี runtime dependencies และไม่ต้อง build

เปิดผ่าน HTTP server เพราะเบราว์เซอร์ไม่สามารถโหลด JSON / ES modules จาก `file://` ได้ตามปกติ ตัวอย่างเมื่อมี Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

เปิด [เว็บในเครื่อง](http://127.0.0.1:8000/) จากโฟลเดอร์โปรเจกต์นี้ ไม่ต้องติดตั้ง npm packages

## Deploy ที่ GitHub Pages เดิม

โปรเจกต์นี้ยังใช้ GitHub Pages แบบ `Deploy from a branch` → `main` → `/(root)` ไม่ได้เปลี่ยนการตั้งค่า hosting หรือเพิ่ม workflow

เมื่อ merge PR เข้า `main` แล้ว GitHub Pages จึงจะเผยแพร่เวอร์ชันใหม่ที่ [เริ่มเวท](https://ton-uhsu.github.io/test-codex-cloud/) ตรวจผล deployment ในแท็บ Actions ของ repository หากหน้าเดิมยังแสดงอยู่ให้รอ deployment สำเร็จแล้ว refresh

เก็บ `.nojekyll` เดิมไว้ และใช้ asset paths แบบ relative เพื่อรองรับ `/test-codex-cloud/` รวมถึง hash navigation (`#plan`, `#setup`, `#nutrition`, `#today`, `#library`, `#guide`) ที่ไม่ต้องตั้ง server rewrite หน้าเริ่มต้นคือ `#plan` ซึ่งแสดงแบบฟอร์มเมื่อยังไม่มีข้อมูล

## ไฟล์

| ไฟล์ | หน้าที่ |
| --- | --- |
| `index.html` | โครงหน้า เมนู metadata และ fallback เมื่อปิด JavaScript |
| `styles.css` | รูปแบบ responsive สี contrast สูง และ keyboard focus |
| `app.js` | โหลดข้อมูล เปลี่ยนหน้า เลือกวันและตัวกรอง รวมถึง retry |
| `data/guide.json` | ท่าฝึก ตาราง A/B เซ็ต–ครั้ง คำอธิบายที่มา และ source URLs |
| `lib/guide.mjs` | ตรวจ schema จัดการวัน ตาราง ตัวกรอง โหลดข้อมูล และ escape HTML |
| `lib/views.mjs` | สร้าง HTML ของแต่ละหน้าจากข้อมูลที่ผ่านการตรวจ |
| `lib/video.mjs` | URL ที่จำกัดเฉพาะ YouTube, ภาพตัวอย่าง และวงจรเริ่ม/หยุดตัวเล่น |
| `lib/nutrition.mjs` | ตรวจข้อมูล สูตรพลังงาน/สารอาหาร ขอบเขตการคำนวณ localStorage และตารางตามวันเริ่ม |
| `lib/meals.mjs` | ข้อมูลอาหาร USDA ปริมาณตัวอย่าง และการรวมสารอาหาร |
| `lib/profile-views.mjs` | แบบฟอร์ม แผนสรุป และหน้าอาหารพร้อมแหล่งอ้างอิง |
| `lib/session.mjs` | สถานะวอร์มอัป/เซ็ต/พัก/เสร็จ และเวลาพักแบบเวลาจริง |
| `lib/workout-views.mjs` | หน้าฝึกทีละท่า ตาราง และสรุปรอบที่ฝึก |
| `tests/guide.test.mjs` | Automated tests ด้วย Node.js built-in test runner |
| `tests/video.test.mjs` | ตรวจอุปกรณ์/วิดีโอทุกท่า URL validation และ lifecycle ของตัวเล่น |
| `tests/plan.test.mjs` | ตัวอย่างคำนวณที่รู้ผล กรณีไม่รองรับ ปริมาณอาหาร storage และลำดับฝึก |

## ตรวจสอบ

ใช้ Node.js 20 ขึ้นไป (เฉพาะการทดสอบ ไม่จำเป็นสำหรับ hosting):

```sh
node --test tests/*.test.mjs
node --input-type=module --check < app.js
node --check lib/guide.mjs
node --check lib/views.mjs
node --check lib/video.mjs
git diff --check
```

Tests ตรวจ schema ของข้อมูลครบทุกท่า, source URLs, ตาราง 7 วันและวันพัก, โปรแกรม A/B ครบกล้ามเนื้อที่ระบุ, วันท้องถิ่นในไทย/อเมริกา, ตัวกรอง, HTML output, ป้องกันการแทรก HTML, ข้อผิดพลาด HTTP/JSON/schema, timeout, relative asset paths รวมถึงสูตรทั้งสองตัวแปรเพศ ทุกเป้าหมาย การปัดเศษ/ยอดอาหาร การปฏิเสธข้อมูลที่ไม่รองรับ การจำ/ล้างข้อมูล และลำดับ 10 เซ็ตพร้อมกรณีข้าม/พักเพิ่ม

การทดสอบเหล่านี้ไม่ใช่ browser end-to-end หรือการรับรองความถูกต้องทางคลินิก ยังไม่ได้ทดสอบเบราว์เซอร์จริงในรอบนี้ ควรตรวจหลัง deploy: กรอก/แก้/ล้างข้อมูล, opt-in แล้วรีเฟรช, Back/Forward, เริ่มฝึก/ข้าม/พัก/ไปต่อจนจบ, เปลี่ยนวันและเมนู, เล่น/หยุดคลิป, fullscreen, ลิงก์สำรอง, Tab/Enter/Space และหน้าจอมือถือ

## เนื้อหาและแหล่งข้อมูล

ตรวจแหล่งข้อมูลเมื่อ **2026-09-07** ไม่ใช่วันที่ผู้เชี่ยวชาญรับรองโปรแกรม

- [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/): หลักการฝึกสม่ำเสมอและปรับตามบุคคล
- [NHS: Strength and flexibility](https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/): แนวทางเซ็ต–ครั้ง
- [NHS: Strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/): วิดพื้นกับผนัง
- [Mayo Clinic](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670): การเริ่มฝึกและพักฟื้น
- [Healthline: Rest between sets](https://www.healthline.com/health/fitness/rest-between-sets): ช่วงพักสำหรับมือใหม่
- ACE Exercise Library: ท่า Lateral Raise, Bodyweight Squat และ Glute Bridge
- [PureGym: Dumbbell Bent Over Row](https://www.puregym.com/exercises/back/rows/dumbbell-bent-over-row/), [Dumbbell Shoulder Press](https://www.puregym.com/exercises/arms-and-shoulders/shoulder-press/dumbbell-shoulder-press/), [Goblet Squat](https://www.puregym.com/exercises/legs/quad-exercises/squats/goblet-squat/)
- [Muscle & Strength: Dumbbell Floor Press](https://www.muscleandstrength.com/exercises/dumbbell-floor-press.html), [Bent Over Dumbbell Reverse Fly](https://www.muscleandstrength.com/exercises/bent-over-dumbbell-reverse-fly.html)
- [NASM: Dumbbell Romanian Deadlift](https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift)

คำแนะนำท่าสรุปใหม่เป็นภาษาไทย ไม่คัดลอกบทความ ตาราง A/B เป็นการเรียบเรียงของโปรเจกต์ ไม่ใช่โปรแกรมที่ ACSM, ACE, NHS หรือแหล่งใดรับรอง ลิงก์ตรงทุกท่าและวิดีโออยู่ใน `data/guide.json`

ปริมาณฝึกเริ่มต้นในเว็บคือ 2 เซ็ต × 8–12 ครั้ง ส่วนวิดพื้นกับผนังใช้ช่วง 5–10 ครั้งจาก NHS และลดจากต้นฉบับ 3 เซ็ตเหลือ 2 เซ็ตในตัวอย่างนี้ พัก 90 วินาทีเป็นค่าตัวอย่างภายในช่วง 60–120 วินาที ไม่ใช่ข้อบังคับและพักเพิ่มได้ ปริมาณเหล่านี้ไม่ได้มาจากหน้า ACE รายท่า

เหมาะเป็นข้อมูลทั่วไปสำหรับผู้ใหญ่ที่เริ่มฝึกที่บ้าน ไม่ใช่โปรแกรมเฉพาะบุคคลหรือคำแนะนำทางการแพทย์ หากมีโรคประจำตัว บาดเจ็บ หรือข้อจำกัด ควรปรึกษาผู้เชี่ยวชาญก่อนเริ่ม และหยุดเมื่อมีอาการผิดปกติ

หากแก้เนื้อหา ให้ตรวจลิงก์ต้นฉบับอีกครั้ง อัปเดต `reviewedAt` และข้อมูลที่มา แล้วรัน tests อย่าเปลี่ยนตัวเลขฝึกโดยอ้างว่าเป็นคำแนะนำของแหล่งต้นฉบับหากแหล่งนั้นไม่ได้ระบุ

### Free follow-along pilot (v5)

Open **เริ่มฝึก → ทำไปพร้อมกัน · Lateral Raise** to practice independently, or use
**ทำไปพร้อมกัน · เซ็ตนี้** on the Lateral Raise set in workout A. The pilot covers
**one reviewed standing dumbbell exercise**. Other exercises retain their existing
YouTube tutorials; seated/bench versions from wger were not substituted for standing
exercises. Program, nutrition and onboarding prescriptions are unchanged.

The player provides a five-second preparation countdown, 8/10/12 demonstrated
cycles, pause/resume and rest. Each completed MP4 cycle advances the demonstration
counter; elapsed wall time never fabricates repetitions. Pausing, a video stall or
hiding the tab stops movement cues, and resuming restarts the unfinished cycle.
The user explicitly confirms completing a set. In a workout this advances the
existing session once; standalone practice does not alter workout progress and
provides a 90-second extendable rest. Nothing detects actual movement or verifies form.

Thai speech uses the device's `speechSynthesis` Thai voice when available, with a
voice-test and mute button. Availability/quality varies by browser and installed
voices; some device voices may use a network service. Without a Thai voice the UI
provides text and an optional Web Audio beep. No paid TTS API, account or API key
is required. Closing, navigating away or hiding the page cancels active coaching.

Media: **Goulart via wger**, video ID 6, exercise 348, licensed **CC BY-SA 4.0**.
Source: https://wger.de/media/exercise-video/348/de69928a-8a35-4096-821c-1f46de5e0e03.MOV
License: https://creativecommons.org/licenses/by-sa/4.0/
The local MP4 (0.25–2.25 s source segment, half speed, resized, audio removed) and
extracted JPEG poster are adaptations distributed under that same license.
This media notice does not relicense unrelated application code. Original API
record, license, retrieval date and local asset hashes are preserved in
`assets/exercises/credits.json`; attribution is also visible inside the player.
No affiliation with or endorsement by the creator or wger is implied.

Validation: `node --test tests/*.test.mjs`. Browser/device voice playback still
requires manual acceptance on the intended phone/browser; automated checks do
not claim a real-device or visual UI test.
