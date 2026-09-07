# เริ่มเวท — Beginner Strength Guide

เว็บภาษาไทยสำหรับผู้เริ่มต้นเวทเทรนนิ่ง: เปิดดูว่าวันนี้ฝึกอะไร เรียนรู้ท่า เซ็ต–ครั้ง และข้อควรระวัง โดยไม่ต้องสมัครสมาชิก

## เวอร์ชันแรกทำอะไรได้

- ตารางตัวอย่างฝึกทั้งตัว 2 วันต่อสัปดาห์: จันทร์ A, พฤหัสบดี B วันอื่นพักเวท
- เลือกดูทั้ง 7 วัน โดยค่าเริ่มต้นอิงวันตามเวลาของอุปกรณ์ ไม่ใช่ UTC
- คลัง 10 ท่า กรองตามอก หลัง ไหล่ และขา/สะโพก
- แต่ละท่ามีชื่อไทย–อังกฤษ อุปกรณ์ วิธีทำ ข้อควรระวัง เซ็ต ครั้ง ช่วงพัก และลิงก์ภาพสาธิตบนแหล่งต้นฉบับ
- หน้าหลักการสำหรับมือใหม่และแหล่งข้อมูล พร้อมวันที่ตรวจแหล่งข้อมูล
- รองรับหน้าจอแคบ คีย์บอร์ด ลิงก์ข้ามไปเนื้อหา และแจ้งผลการเปลี่ยนวัน/ตัวกรองสำหรับโปรแกรมอ่านหน้าจอ
- มีสถานะโหลด ข้อความเมื่อโหลดไม่สำเร็จ ปุ่มลองใหม่ และข้อมูลสำรองกรณีปิด JavaScript

ไม่มี login, backend, database, analytics, cookie หรือการเก็บประวัติออกกำลังกาย การเลือกวันเป็นเพียงการดูแผน ไม่ใช่การเช็กอินหรือบันทึกว่าฝึกเสร็จแล้ว ผู้ให้บริการโฮสต์และเว็บต้นฉบับที่เปิดจากลิงก์อาจมีนโยบายข้อมูลของตนเอง

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

เก็บ `.nojekyll` เดิมไว้ และใช้ asset paths แบบ relative เพื่อรองรับ `/test-codex-cloud/` รวมถึง hash navigation (`#today`, `#library`, `#guide`) ที่ไม่ต้องตั้ง server rewrite

## ไฟล์

| ไฟล์ | หน้าที่ |
| --- | --- |
| `index.html` | โครงหน้า เมนู metadata และ fallback เมื่อปิด JavaScript |
| `styles.css` | รูปแบบ responsive สี contrast สูง และ keyboard focus |
| `app.js` | โหลดข้อมูล เปลี่ยนหน้า เลือกวันและตัวกรอง รวมถึง retry |
| `data/guide.json` | ท่าฝึก ตาราง A/B เซ็ต–ครั้ง คำอธิบายที่มา และ source URLs |
| `lib/guide.mjs` | ตรวจ schema จัดการวัน ตาราง ตัวกรอง โหลดข้อมูล และ escape HTML |
| `lib/views.mjs` | สร้าง HTML ของแต่ละหน้าจากข้อมูลที่ผ่านการตรวจ |
| `tests/guide.test.mjs` | Automated tests ด้วย Node.js built-in test runner |

## ตรวจสอบ

ใช้ Node.js 20 ขึ้นไป (เฉพาะการทดสอบ ไม่จำเป็นสำหรับ hosting):

```sh
node --test tests/guide.test.mjs
node --input-type=module --check < app.js
node --check lib/guide.mjs
node --check lib/views.mjs
git diff --check
```

Tests ตรวจ schema ของข้อมูลครบทุกท่า, source URLs, ตาราง 7 วันและวันพัก, โปรแกรม A/B ครบกล้ามเนื้อที่ระบุ, วันท้องถิ่นในไทย/อเมริกา, ตัวกรอง, HTML output, ป้องกันการแทรก HTML, ข้อผิดพลาด HTTP/JSON/schema, timeout และ relative asset paths

การทดสอบเหล่านี้ไม่ใช่ browser end-to-end หรือการรับรองความถูกต้องทางคลินิก ควรตรวจด้วยเบราว์เซอร์จริงหลัง deploy: เปลี่ยนวันและเมนู, ทุกตัวกรอง, เปิด–ปิดท่า, ลิงก์ต้นฉบับ, Back/Forward, Tab/Enter/Space และหน้าจอมือถือ

## เนื้อหาและแหล่งข้อมูล

ตรวจแหล่งข้อมูลเมื่อ **2026-09-07** ไม่ใช่วันที่ผู้เชี่ยวชาญรับรองโปรแกรม

- [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/): หลักการฝึกสม่ำเสมอและปรับตามบุคคล
- [NHS: Strength and flexibility](https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/): แนวทางเซ็ต–ครั้ง
- [NHS: Strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/): วิดพื้นกับผนัง
- [Mayo Clinic](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670): การเริ่มฝึกและพักฟื้น
- [Healthline: Rest between sets](https://www.healthline.com/health/fitness/rest-between-sets): ช่วงพักสำหรับมือใหม่
- ACE Exercise Library: ลิงก์ตรงของทั้ง 9 ท่าอยู่ใน `data/guide.json` และในการ์ดแต่ละท่า

คำแนะนำท่าสรุปใหม่เป็นภาษาไทย ไม่คัดลอกบทความหรือภาพมาเผยแพร่ซ้ำ ตาราง A/B เป็นการเรียบเรียงของโปรเจกต์ ไม่ใช่โปรแกรมที่ ACSM, ACE, NHS หรือแหล่งใดรับรอง

ปริมาณฝึกเริ่มต้นในเว็บคือ 2 เซ็ต × 8–12 ครั้ง ส่วนวิดพื้นกับผนังใช้ช่วง 5–10 ครั้งจาก NHS และลดจากต้นฉบับ 3 เซ็ตเหลือ 2 เซ็ตในตัวอย่างนี้ พัก 90 วินาทีเป็นค่าตัวอย่างภายในช่วง 60–120 วินาที ไม่ใช่ข้อบังคับและพักเพิ่มได้ ปริมาณเหล่านี้ไม่ได้มาจากหน้า ACE รายท่า

เหมาะเป็นข้อมูลทั่วไปสำหรับผู้ใหญ่ที่เริ่มฝึกในยิม ไม่ใช่โปรแกรมเฉพาะบุคคลหรือคำแนะนำทางการแพทย์ หากมีโรคประจำตัว บาดเจ็บ หรือข้อจำกัด ควรปรึกษาผู้เชี่ยวชาญก่อนเริ่ม และหยุดเมื่อมีอาการผิดปกติ

หากแก้เนื้อหา ให้ตรวจลิงก์ต้นฉบับอีกครั้ง อัปเดต `reviewedAt` และข้อมูลที่มา แล้วรัน tests อย่าเปลี่ยนตัวเลขฝึกโดยอ้างว่าเป็นคำแนะนำของแหล่งต้นฉบับหากแหล่งนั้นไม่ได้ระบุ
