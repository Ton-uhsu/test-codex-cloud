import type { Guide as GuideData } from "../types";
import { Safety } from "./Exercise";
export function GuidePage({ data }: { data: GuideData }) {
  const tips = [
    {
      title: "เริ่มจากทั้งตัว 2 วัน",
      text: "เลือกวันฝึกแรกได้ เว็บจัดโปรแกรม B ห่างจากวัน A สามวัน หากยังไม่ได้ตั้งข้อมูลใช้จันทร์ A และพฤหัสบดี B เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกลุ่มเดิม ไม่ต้องฝึกชดเชยติดกัน",
      sources: ["acsm", "mayo"],
    },
    {
      title: "2 เซ็ต × 8–12 ครั้ง",
      text: `ทำท่าเดิม 8–12 ครั้งเท่ากับ 1 เซ็ต จากนั้นพัก แล้วทำอีก 1 เซ็ต ไม่ต้องฝืนถึง 12 ถ้าคุมท่าไม่ได้ ${data.program.doseNote}`,
      sources: ["nhs-strength", "nhs-exercises"],
    },
    {
      title: "เลือกน้ำหนักที่ควบคุมได้",
      text: "เริ่มเบาเพื่อเรียนรู้ท่า ช่วงท้ายเซ็ตยังต้องควบคุมการเคลื่อนไหวและหายใจได้ เมื่อทำถึงปลายช่วงได้สบายและฟอร์มดี ค่อยเพิ่มน้ำหนักทีละน้อย อย่าใช้น้ำหนักเท่าคนในคลิป หากดัมเบลหนักเกินสำหรับไหล่ ให้ลองมือเปล่าก่อน",
      sources: ["acsm", "mayo"],
    },
    {
      title: "พักพอ แล้วค่อยไปต่อ",
      text: `${data.program.restNote} ก่อนฝึกเดินหรือขยับเบา ๆ ระหว่างท่าอย่ากลั้นหายใจ วันพักเคลื่อนไหวได้แต่ไม่ควรฝืนกล้ามเนื้อที่เจ็บ`,
      sources: ["rest", "mayo"],
    },
  ];
  return (
    <div className="content-wrap">
      <header className="page-heading">
        <span className="eyebrow red">LEARN THE BASICS</span>
        <h1 id="page-title" tabIndex={-1}>
          เริ่มอย่างถูกวิธี
        </h1>
        <p>เข้าใจพื้นฐาน แล้วค่อยเพิ่มความท้าทาย</p>
      </header>
      <div className="guide-grid">
        {tips.map((tip, i) => (
          <section className="panel" key={tip.title}>
            <span className="eyebrow red">0{i + 1}</span>
            <h2>{tip.title}</h2>
            <p>{tip.text}</p>
            <p className="fine">
              {tip.sources.map((id) => (
                <a
                  key={id}
                  href={data.sources[id].url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.sources[id].name} ↗{" "}
                </a>
              ))}
            </p>
          </section>
        ))}
      </div>
      <section className="source-section">
        <h2>ข้อมูลมาจากไหน?</h2>
        <p>{data.program.provenance}</p>
        <p className="fine">
          คำอธิบายไทยสรุปจากแหล่งอ้างอิง คลิปสอนการเคลื่อนไหว
          ส่วนเซ็ต–ครั้งใช้ตัวอย่างของเว็บ ไม่จำเป็นต้องทำตามน้ำหนักในคลิป ·
          ตรวจแหล่งข้อมูล {data.reviewedAt}
        </p>
        <ul className="sources">
          {Object.entries(data.sources).map(([id, source]) => (
            <li key={id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name} ↗
              </a>
              <p className="fine">
                {source.description ||
                  "วิธีจัดท่า การเคลื่อนไหว และข้อควรระวัง"}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2>เกี่ยวกับสื่อและข้อมูลของคุณ</h2>
        <p>
          ภาพตัวอย่างโหลดจาก YouTube เมื่อกดเล่นจะเชื่อมต่อผ่าน
          youtube-nocookie.com ซึ่งไม่ได้แปลว่าไม่มีการส่งข้อมูล
          ผู้ให้บริการอาจประมวลผลข้อมูลตามนโยบายของตนเอง
          คลิปอาจถูกลบหรือจำกัดการฝังได้ จึงมีลิงก์ต้นฉบับ
        </p>
        <p>โหมดทำไปพร้อมกันใช้ภาพที่เก็บไว้กับเว็บ ดูผู้สร้าง ใบอนุญาต และรายละเอียดการปรับภาพได้ใน “วิธีเล่นและเครดิตภาพ” ของแต่ละท่า เสียงไทยขึ้นกับอุปกรณ์ บางเสียงอาจใช้อินเทอร์เน็ต</p>
        <p>
          {data.program.audience} ไม่มีบัญชีผู้ใช้
          ไม่ประเมินท่าหรือสุขภาพเฉพาะบุคคล ความคืบหน้าฝึกและบันทึกเซ็ตเก็บในเบราว์เซอร์เครื่องนี้
          มีตัวเลือกจำข้อมูลแบบฟอร์มเฉพาะเบราว์เซอร์ นี่เป็นคู่มือเวท
          ไม่ใช่แผนกิจกรรมทางกายทั้งหมด
        </p>
      </section>
      <Safety />
    </div>
  );
}
