#!/usr/bin/env node
// One-shot migration: wrap each puzzle's `prompt` and `explanation` into a
// LocalizedString { en, th }. Other fields (code/payload/answer/etc.) are left
// byte-identical. The Thai translations live in TRANSLATIONS below — edit them
// here if you want to refine wording, then re-run.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../data/puzzles.json", import.meta.url);

/** id -> { promptTh, explanationTh } */
const TRANSLATIONS = {
  "2026-01-01-spotbug-01": {
    promptTh: "บรรทัดไหนทำให้ view นี้พัง?",
    explanationTh:
      "ใน Swift สตริงต้องอยู่ในเครื่องหมายคำพูด ต้องเขียนเป็น Text(\"Hello, world!\")",
  },
  "2026-01-02-predict-01": {
    promptTh: "view นี้แสดงผลออกมาเป็นอย่างไร?",
    explanationTh:
      "VStack วางลูก ๆ ของมันในแนวตั้งจากบนลงล่าง: \"Hi\" อยู่บน \"There\" อยู่ล่าง",
  },
  "2026-01-03-fillmod-01": {
    promptTh: "เติม modifier ที่ทำให้ตัวอักษรเป็นสีน้ำเงิน",
    explanationTh:
      ".foregroundStyle(.blue) ใช้กำหนดสีตัวอักษร (.foregroundColor ยังใช้ได้อยู่แต่ Apple กำลังจะเลิกใช้)",
  },
  "2026-01-04-syntaxsort-01": {
    promptTh: "เรียงลำดับบรรทัดเหล่านี้ให้เป็น view ที่ใช้งานได้",
    explanationTh:
      "View ต้องประกาศ `struct ... : View` ก่อน แล้วตามด้วย property `body` จากนั้นใส่เนื้อหา แล้วปิดด้วยปีกกา",
  },
  "2026-01-05-spotbug-02": {
    promptTh: "บรรทัดไหนทำให้โค้ดนี้ compile ไม่ผ่าน?",
    explanationTh:
      "VStack เปิด `{` ไว้ที่บรรทัดที่ 3 แต่ไม่มีบรรทัดไหนปิดเลย บรรทัดที่ 5 ควรเป็น `}` เพื่อปิด VStack ก่อนที่จะปิด body",
  },
  "2026-01-06-fillmod-02": {
    promptTh: "เติม modifier ที่ใส่ระยะห่างรอบตัวอักษรทุกด้าน",
    explanationTh:
      ".padding() เพิ่มพื้นที่ว่างให้กับ view ของตัวเอง ถ้าไม่ใส่ พื้นหลังสีเหลืองจะแนบติดตัวอักษรพอดี",
  },
  "2026-01-07-predict-02": {
    promptTh: "view นี้แสดงผลออกมาเป็นอย่างไร?",
    explanationTh:
      "HStack วางลูก ๆ เรียงข้างกันจากซ้ายไปขวา: \"Left\" ก่อน แล้วตามด้วย \"Right\"",
  },
  "2026-01-08-syntaxsort-02": {
    promptTh: "เรียงบรรทัดเหล่านี้ให้กลายเป็นปุ่มที่ใช้งานได้",
    explanationTh:
      "`Button(\"Press\") {` เปิด closure ของ action จากนั้นใส่โค้ดที่จะทำงานข้างใน แล้วปิด closure ด้วย `}`",
  },
  "2026-01-09-spotbug-03": {
    promptTh: "บรรทัดไหนผิด?",
    explanationTh:
      "`systemName:` รับค่าเป็น String ดังนั้นชื่อ SF Symbol ต้องอยู่ในเครื่องหมายคำพูด: Image(systemName: \"heart.fill\")",
  },
  "2026-01-10-fillmod-03": {
    promptTh: "เติม modifier ที่ทำให้ตัวอักษรใหญ่ขึ้นและตัวหนา เหมือนหัวข้อบนหน้าจอ",
    explanationTh:
      ".font(.largeTitle) เลือกใช้สไตล์ตัวอักษรสำเร็จรูปของ SwiftUI พอใช้คู่กับ .bold() ก็จะได้หัวข้อตัวใหญ่ตัวหนา",
  },
  "2026-01-11-predict-03": {
    promptTh: "view นี้แสดงผลออกมาเป็นอย่างไร?",
    explanationTh:
      "ลำดับสำคัญมาก: ตัวอักษรสีขาว → .padding() ขยายกรอบ → .background(.blue) เติมพื้นหลังสีน้ำเงินตามกรอบที่ขยายแล้ว ผลคือแคปซูลสีน้ำเงินเล็ก ๆ ที่มีคำว่า \"Hi\" อยู่กลาง",
  },
  "2026-01-12-syntaxsort-03": {
    promptTh: "เรียงบรรทัดเหล่านี้ให้เป็น view ที่มีหัวข้ออยู่บนหัวข้อย่อย",
    explanationTh:
      "เปิด VStack ใส่ \"Welcome\" ก่อน (จะอยู่ด้านบน) แล้วตามด้วย \"to Swordle\" ที่อยู่ใต้ลงมา จากนั้นปิด VStack",
  },
  "2026-01-13-spotbug-04": {
    promptTh: "บรรทัดไหนทำให้ view นี้พัง?",
    explanationTh:
      "stack ต้องมีปีกกาเปิด: `VStack {` ถ้าไม่มี Text สองตัวจะไม่อยู่ใน stack และปีกกา `}` ที่ปิดก็จะไม่มีคู่",
  },
  "2026-01-14-fillmod-04": {
    promptTh: "เติม modifier ที่ขยาย SF Symbol นี้ให้ใหญ่ขึ้นตามขนาดจุดที่กำหนด",
    explanationTh:
      "SF Symbols เป็น glyph ของฟอนต์ ดังนั้นต้องใช้ .font(.system(size: 40)) เพื่อกำหนดขนาด (.imageScale มีแค่ small/medium/large; .resizable เอาไว้ใช้กับรูปแบบ bitmap)",
  },
  "2026-01-15-predict-04": {
    promptTh: "view นี้แสดงผลออกมาเป็นอย่างไร?",
    explanationTh:
      "ZStack ซ้อนลูก ๆ ทับกันจากหลังไปหน้า: สีน้ำเงินเติมทั้งพื้นที่ ตัวอักษรสีขาว \"On top\" อยู่ด้านบนตรงกลาง",
  },
  "2026-01-16-syntaxsort-04": {
    promptTh: "เรียงบรรทัดเหล่านี้ให้เป็น view ที่มี state และมีปุ่มเปลี่ยนค่าได้",
    explanationTh:
      "ประกาศ struct ก่อน → property @State → `body` → ปุ่ม Button ที่เปลี่ยนค่า → ปิด `body` → ปิด struct",
  },
  "2026-01-17-spotbug-05": {
    promptTh: "บรรทัดไหนคือบั๊ก?",
    explanationTh:
      "`count + 1` คำนวณค่าใหม่แต่ทิ้งไปเฉย ๆ ถ้าจะอัปเดต state จริง ๆ ต้องใช้ `count += 1`",
  },
  "2026-01-18-fillmod-05": {
    promptTh: "เติม property wrapper เพื่อให้ Toggle เปลี่ยนค่า `isOn` ได้",
    explanationTh:
      "@State ทำให้ view มีค่าที่แก้ได้ของตัวเอง สัญลักษณ์ `$isOn` คือการส่ง binding ของ state นั้นเข้าไปใน Toggle เพื่อให้ Toggle สลับค่าได้",
  },
  "2026-01-19-predict-05": {
    promptTh: "view นี้แสดงผลออกมาเป็นอย่างไร?",
    explanationTh:
      "VStack(alignment: .leading) จัดลูก ๆ ให้ชิดขอบซ้าย ดังนั้น Text ทั้งสองจะเริ่มที่ตำแหน่ง x เดียวกันทางซ้าย",
  },
  "2026-01-20-spotbug-06": {
    promptTh: "บรรทัดไหนทำให้ list นี้ไม่ทำงาน?",
    explanationTh:
      "closure ได้รับ element แต่ละตัว แต่ไม่ได้ตั้งชื่อให้ ต้องเขียนเป็น `List(names, id: \\.self) { name in Text(name) }` ตัวแปร `name` ถึงจะมี",
  },
  "2026-01-21-fillmod-06": {
    promptTh: "เติม modifier ที่ทำให้กล่องสีน้ำเงินมีมุมโค้ง",
    explanationTh:
      ".cornerRadius(12) ทำให้มุมทั้งสี่โค้ง (.clipShape(RoundedRectangle(cornerRadius: 12)) ทำเหมือนกันและเป็นสไตล์ใหม่กว่า)",
  },
  "2026-01-22-predict-06": {
    promptTh: "view นี้แสดงผลออกมาเป็นอย่างไร?",
    explanationTh:
      "Spacer ขยายตัวเองให้เต็มที่ว่างที่มี ดัน \"Left\" ไปชิดขอบซ้ายและ \"Right\" ไปชิดขอบขวา",
  },
  "2026-01-23-syntaxsort-05": {
    promptTh: "เรียงบรรทัดเหล่านี้ให้หน้าจอมี navigation title",
    explanationTh:
      "เปิด NavigationStack → ใส่เนื้อหาข้างใน → ต่อ `.navigationTitle` ให้กับเนื้อหา → ปิด stack",
  },
  "2026-01-24-syntaxsort-06": {
    promptTh: "เรียงบรรทัดเหล่านี้ให้เป็นแถวที่มีไอคอนอยู่ข้างป้ายชื่อ",
    explanationTh:
      "เปิด HStack → รูปดาวมาก่อน (จะอยู่ทางซ้าย) → ป้าย \"Favorites\" ตามมา → ปิด HStack",
  },
};

const puzzles = JSON.parse(readFileSync(SRC, "utf8"));

const missing = [];
const migrated = puzzles.map((p) => {
  const tr = TRANSLATIONS[p.id];
  if (!tr) {
    missing.push(p.id);
    return p;
  }
  // If already localized (re-run), pass through unchanged.
  if (typeof p.prompt === "object" && p.prompt !== null) return p;
  return {
    ...p,
    prompt: { en: p.prompt, th: tr.promptTh },
    explanation: { en: p.explanation, th: tr.explanationTh },
  };
});

if (missing.length) {
  console.error("Missing translations for:", missing.join(", "));
  process.exit(1);
}

writeFileSync(SRC, JSON.stringify(migrated, null, 2) + "\n");
console.log(`Migrated ${migrated.length} puzzles.`);
